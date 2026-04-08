from __future__ import annotations

import logging
import os
import uuid
from typing import Literal

from server.env_loader import load_env

load_env()

from fastapi import BackgroundTasks, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from server.agent_round_logger import AgentRoundLogger
from server.answer_service import build_answer_payload
from server.citation_service import build_citation_items
from server.paper_agent_v2.http_retry import httpx_request_with_retry
from server.paper_agent_v2.paper_agent_v2 import PaperSearchV2Agent as LocalPaperSearchAgent
from server.paper_agent_v2.utils import PaperSearchV2Client as LocalPaperSearchClient
from server.response_utils import ApiError, error_response, success_response
from server.session_manager import SessionManager


DEFAULT_PAPER_SEARCH_V2_BASE_URL = "http://172.16.100.204:4000"
DEFAULT_PAPER_SEARCH_V2_API_KEY = "lw-d7ea4e41519dc1cd03b322d0faa8fb9b"


class WebPaperSearchV2Client(LocalPaperSearchClient):
    def __init__(self, *args, **kwargs):
        base_url = kwargs.pop("base_url", None) or os.getenv(
            "PAPER_SEARCH_V2_BASE_URL", DEFAULT_PAPER_SEARCH_V2_BASE_URL
        )
        super().__init__(base_url=base_url, *args, **kwargs)
        self.paper_search_api_key = os.getenv("PAPER_SEARCH_V2_API_KEY", DEFAULT_PAPER_SEARCH_V2_API_KEY)

    async def _request(self, method: str, url: str, *, semaphore=None, **kwargs):
        headers = dict(kwargs.pop("headers", {}) or {})
        headers["X-API-Key"] = self.paper_search_api_key
        effective_semaphore = self._semaphore if semaphore is None else semaphore
        return await httpx_request_with_retry(
            self.client,
            method,
            url,
            semaphore=effective_semaphore,
            headers=headers,
            **kwargs,
        )


class PaperSearchAgent(LocalPaperSearchAgent):
    def __init__(self, logger=None, *args, **kwargs):
        super().__init__(logger=logger, *args, **kwargs)
        self.client = WebPaperSearchV2Client(timeout=30.0)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("web_paper_search_server")
round_logger = AgentRoundLogger.from_env()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session_manager = SessionManager()


class CreateSessionRequest(BaseModel):
    query: str
    max_steps: int = 5
    max_parallel_calls: int = 5


class ExpandRequest(BaseModel):
    arxiv_id: str


@app.exception_handler(ApiError)
async def handle_api_error(_, exc: ApiError):
    return error_response(exc)


@app.exception_handler(Exception)
async def handle_unexpected_error(_, exc: Exception):
    logger.exception("Unhandled server error: %s", exc)
    return error_response(
        ApiError(
            code=1500,
            message="internal server error",
            error_type="INTERNAL_ERROR",
            status_code=500,
            details={"reason": str(exc)},
        )
    )


@app.get("/healthz")
async def healthz():
    return success_response({"status": "ok"})


@app.post("/sessions")
async def create_session(request: CreateSessionRequest, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())
    agent = PaperSearchAgent(
        logger=logger,
        round_logger=round_logger,
        session_id=session_id,
        max_steps=request.max_steps,
        max_parallel_calls=request.max_parallel_calls,
    )
    await session_manager.create(session_id=session_id, query=request.query, agent=agent)
    background_tasks.add_task(agent.run, request.query)
    return success_response({"session_id": session_id, "status": "ITERATING"})


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    record = await session_manager.get(session_id)
    return success_response(record.agent.get_state())


@app.post("/sessions/{session_id}/pause")
async def pause_session(session_id: str):
    record = await session_manager.get(session_id)
    record.agent.pause()
    return success_response({"status": "PAUSED"})


@app.post("/sessions/{session_id}/resume")
async def resume_session(session_id: str):
    record = await session_manager.get(session_id)
    record.agent.resume()
    return success_response({"status": "ITERATING"})


@app.post("/sessions/{session_id}/stop")
async def stop_session(session_id: str):
    record = await session_manager.get(session_id)
    record.agent.stop()
    return success_response({"status": "COMPLETED"})


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    record = await session_manager.delete(session_id)
    if record is not None:
        record.agent.stop()
        await record.agent.close()
    return success_response({"status": "deleted"})


@app.post("/sessions/{session_id}/expand")
async def expand_paper(session_id: str, request: ExpandRequest, background_tasks: BackgroundTasks):
    record = await session_manager.get(session_id)
    agent = record.agent
    base_id = agent._normalize_arxiv_id(request.arxiv_id)

    with agent._paper_pool_lock:
        entry = agent.paper_pool.get_paper(base_id)
        if entry is None:
            raise ApiError(
                code=2404,
                message="paper not found in session",
                error_type="PAPER_NOT_FOUND_IN_POOL",
                status_code=404,
                details={"arxiv_id": request.arxiv_id},
            )
        if entry.expand:
            return success_response({"accepted": False, "arxiv_id": base_id})

    agent.history_actions.append(("expand", request.arxiv_id))
    background_tasks.add_task(agent.expand, request.arxiv_id)
    return success_response({"accepted": True, "arxiv_id": base_id})


@app.get("/sessions/{session_id}/answer")
async def get_answer(
    session_id: str,
    mode: Literal["strict", "balanced"] = Query(default="balanced"),
):
    record = await session_manager.get(session_id)
    state = record.agent.get_state()
    return success_response(build_answer_payload(query=record.query, papers=state["papers"], mode=mode))


@app.get("/sessions/{session_id}/citations")
async def get_citations(
    session_id: str,
    format: Literal["bibtex", "ris", "text"] = Query(default="bibtex"),
    paper_ids: str | None = Query(default=None),
):
    record = await session_manager.get(session_id)
    state = record.agent.get_state()
    selected_ids = [item.strip() for item in paper_ids.split(",")] if paper_ids else None
    return success_response(
        build_citation_items(state["papers"], citation_format=format, paper_ids=selected_ids)
    )


@app.on_event("shutdown")
async def shutdown_event():
    for record in await session_manager.list_all():
        try:
            record.agent.stop()
            await record.agent.close()
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to close session %s: %s", record.session_id, exc)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
