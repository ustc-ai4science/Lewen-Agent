from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from server.response_utils import ApiError


@dataclass
class SessionRecord:
    session_id: str
    query: str
    agent: Any


class SessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionRecord] = {}
        self._lock = asyncio.Lock()

    async def create(self, session_id: str, query: str, agent: Any) -> SessionRecord:
        record = SessionRecord(session_id=session_id, query=query, agent=agent)
        async with self._lock:
            self._sessions[session_id] = record
        return record

    async def get(self, session_id: str) -> SessionRecord:
        async with self._lock:
            record = self._sessions.get(session_id)
        if record is None:
            raise ApiError(
                code=1404,
                message="session not found",
                error_type="SESSION_NOT_FOUND",
                status_code=404,
                details={"session_id": session_id},
            )
        return record

    async def delete(self, session_id: str) -> SessionRecord | None:
        async with self._lock:
            return self._sessions.pop(session_id, None)

    async def list_all(self) -> list[SessionRecord]:
        async with self._lock:
            return list(self._sessions.values())
