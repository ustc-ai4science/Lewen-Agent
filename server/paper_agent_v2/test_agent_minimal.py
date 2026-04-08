import pathlib
import sys
import types
import unittest
from unittest.mock import AsyncMock


def _install_httpx_stub() -> None:
    if "httpx" in sys.modules:
        return

    httpx_stub = types.ModuleType("httpx")

    class Headers(dict):
        pass

    class RequestError(Exception):
        pass

    class TimeoutException(Exception):
        pass

    class Timeout:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

    class Limits:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

    class Response:
        def __init__(self, status_code=200, payload=None, headers=None):
            self.status_code = status_code
            self._payload = payload or {}
            self.headers = Headers(headers or {})

        async def aread(self):
            return b""

        async def aclose(self):
            return None

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RequestError(f"HTTP {self.status_code}")

        def json(self):
            return self._payload

    class AsyncClient:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

        async def aclose(self):
            return None

        async def request(self, *args, **kwargs):
            return Response()

        async def post(self, *args, **kwargs):
            return Response(payload={"organic": []})

    httpx_stub.Headers = Headers
    httpx_stub.RequestError = RequestError
    httpx_stub.TimeoutException = TimeoutException
    httpx_stub.Timeout = Timeout
    httpx_stub.Limits = Limits
    httpx_stub.Response = Response
    httpx_stub.AsyncClient = AsyncClient
    sys.modules["httpx"] = httpx_stub


def _install_openai_stub() -> None:
    if "openai" in sys.modules:
        return

    openai_stub = types.ModuleType("openai")

    class OpenAI:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

    openai_stub.OpenAI = OpenAI
    sys.modules["openai"] = openai_stub


_install_httpx_stub()
_install_openai_stub()

CURRENT_DIR = pathlib.Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import paper_agent_v2 as agent_module
import utils as utils_module


class FakeClient:
    def __init__(self):
        self.search_calls = []
        self.detail_calls = []
        self.citation_calls = []
        self.reference_calls = []

    async def close(self):
        return None

    async def search(self, query: str, limit: int = 10, **kwargs):
        self.search_calls.append({"query": query, "limit": limit, **kwargs})
        return [
            agent_module.Paper(
                paper_id="2401.00001",
                raw_paper_id="S2-SEARCH-1",
                arxiv_id="2401.00001",
                title="Search Hit One",
                abstract="A relevant abstract for search testing.",
                authors="Alice, Bob",
                year=2024,
            ),
            agent_module.Paper(
                paper_id="ignore-no-arxiv",
                raw_paper_id="S2-SEARCH-2",
                arxiv_id="",
                title="Should Be Filtered",
                abstract="This item should never enter the pool.",
                authors="Nobody",
                year=2024,
            ),
        ]

    async def get_citations(self, paper_id: str, limit: int = 50, **kwargs):
        self.citation_calls.append({"paper_id": paper_id, "limit": limit, **kwargs})
        return [
            agent_module.Paper(
                paper_id="2402.00002",
                raw_paper_id="S2-CIT-1",
                arxiv_id="2402.00002",
                title="Citation Candidate",
                abstract="Citation abstract is already available.",
                authors="Carol",
                year=2024,
            ),
            agent_module.Paper(
                paper_id="non-arxiv-candidate",
                raw_paper_id="S2-CIT-2",
                arxiv_id="",
                title="Filtered Candidate",
                abstract="Should be filtered because arxiv_id is empty.",
                authors="Dave",
                year=2024,
            ),
        ]

    async def get_references(self, paper_id: str, limit: int = 50, **kwargs):
        self.reference_calls.append({"paper_id": paper_id, "limit": limit, **kwargs})
        return [
            agent_module.Paper(
                paper_id="2403.00003",
                raw_paper_id="S2-REF-1",
                arxiv_id="2403.00003",
                title="Reference Candidate",
                abstract="",
                authors="Eve",
                year=2023,
            ),
        ]

    async def get_paper(self, paper_id: str, **kwargs):
        self.detail_calls.append({"paper_id": paper_id, **kwargs})
        return agent_module.Paper(
            paper_id="2403.00003",
            raw_paper_id="S2-REF-1",
            arxiv_id="2403.00003",
            title="Reference Candidate",
            abstract="Hydrated abstract from paper detail.",
            authors="Eve",
            year=2023,
        )


class PaperSearchV2AgentMinimalTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.agent = agent_module.PaperSearchV2Agent(max_steps=2, search_top_k=5)
        self.agent.client = FakeClient()
        self.agent.get_relevance_score = AsyncMock(side_effect=[0.91, 0.92, 0.83])
        self.agent.user_query = "multimodal retrieval"

    async def asyncTearDown(self):
        await self.agent.selector_client.aclose()

    def _print_paper_pool(self, action_name: str) -> None:
        print(f"\nPaper pool after {action_name}:")
        print(self.agent.paper_pool.paper_list)

    async def test_search_runs_and_uses_local_db_source(self):
        reward = await self.agent.search("multimodal retrieval")
        self._print_paper_pool("search")

        self.assertGreater(reward, 0.0)
        self.assertEqual(len(self.agent.client.search_calls), 1)
        self.assertEqual(self.agent.client.search_calls[0]["source"], "local_db")
        self.assertTrue(self.agent.paper_pool.has_paper("2401.00001"))
        self.assertFalse(self.agent.paper_pool.has_paper(""))
        self.assertEqual(self.agent.history_search_queries["multimodal retrieval"], 1)

    async def test_expand_runs_with_citations_and_references(self):
        root_paper = agent_module.Paper(
            paper_id="2400.00000",
            raw_paper_id="S2-ROOT",
            arxiv_id="2400.00000",
            title="Root Paper",
            abstract="Root paper abstract.",
            authors="Root Author",
            year=2024,
        )
        self.agent.paper_pool.add_paper(root_paper, "search", "seed", 0.99)

        reward = await self.agent.expand("2400.00000")
        self._print_paper_pool("expand")

        self.assertGreater(reward, 0.0)
        self.assertEqual(len(self.agent.client.citation_calls), 1)
        self.assertEqual(len(self.agent.client.reference_calls), 1)
        self.assertEqual(len(self.agent.client.detail_calls), 1)
        self.assertTrue(self.agent.paper_pool.has_paper("2402.00002"))
        self.assertTrue(self.agent.paper_pool.has_paper("2403.00003"))
        self.assertFalse(self.agent.paper_pool.has_paper("non-arxiv-candidate"))

        root_entry = self.agent.paper_pool.get_paper("2400.00000")
        self.assertIsNotNone(root_entry)
        self.assertTrue(root_entry.expand)
        self.assertFalse(root_entry.expanding)

    async def test_scorer_balancer_switches_to_less_used_backend(self):
        agent = agent_module.PaperSearchV2Agent(
            scorer_backends=[
                {"name": "scorer-a", "url": "http://localhost:8993/classify"},
                {"name": "scorer-b", "url": "http://localhost:8996/classify"},
            ]
        )

        original_request = agent_module.httpx_request_with_retry
        called_urls = []

        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"data": [{"probs": [0.88]}]}

        async def fake_request(_client, _method, url, **kwargs):
            called_urls.append(url)
            return FakeResponse()

        agent_module.httpx_request_with_retry = fake_request
        try:
            paper = agent_module.Paper(
                paper_id="2401.00001",
                raw_paper_id="S2-SEARCH-1",
                arxiv_id="2401.00001",
                title="Search Hit One",
                abstract="A relevant abstract for search testing.",
                authors="Alice, Bob",
                year=2024,
            )
            score_one = await agent.get_relevance_score("multimodal retrieval", paper)
            score_two = await agent.get_relevance_score("multimodal retrieval", paper)
        finally:
            agent_module.httpx_request_with_retry = original_request
            await agent.close()

        self.assertEqual(score_one, 0.88)
        self.assertEqual(score_two, 0.88)
        self.assertEqual(
            called_urls,
            ["http://localhost:8993/classify", "http://localhost:8996/classify"],
        )

    async def test_scorer_failover_uses_next_backend(self):
        agent = agent_module.PaperSearchV2Agent(
            scorer_backends=[
                {"name": "scorer-a", "url": "http://localhost:8993/classify"},
                {"name": "scorer-b", "url": "http://localhost:8996/classify"},
            ]
        )

        original_request = agent_module.httpx_request_with_retry
        called_urls = []

        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"data": [{"probs": [0.77]}]}

        async def fake_request(_client, _method, url, **kwargs):
            called_urls.append(url)
            if url.endswith("8993/classify"):
                raise RuntimeError("primary scorer unavailable")
            return FakeResponse()

        agent_module.httpx_request_with_retry = fake_request
        try:
            paper = agent_module.Paper(
                paper_id="2401.00001",
                raw_paper_id="S2-SEARCH-1",
                arxiv_id="2401.00001",
                title="Search Hit One",
                abstract="A relevant abstract for search testing.",
                authors="Alice, Bob",
                year=2024,
            )
            score = await agent.get_relevance_score("multimodal retrieval", paper)
        finally:
            agent_module.httpx_request_with_retry = original_request
            await agent.close()

        self.assertEqual(score, 0.77)
        self.assertEqual(
            called_urls,
            ["http://localhost:8993/classify", "http://localhost:8996/classify"],
        )

    def test_search_agent_balancer_switches_to_less_used_backend(self):
        agent = agent_module.PaperSearchV2Agent(
            agent_backends=[
                {"name": "agent-a", "url": "http://localhost:8998/v1"},
                {"name": "agent-b", "url": "http://localhost:8999/v1"},
            ]
        )

        original_chat = agent_module.call_openai_chat
        called_bases = []

        class FakeMessage:
            tool_calls = None

        class FakeChoice:
            def __init__(self):
                self.message = FakeMessage()

        class FakeResponse:
            def __init__(self):
                self.choices = [FakeChoice()]

        def fake_chat(*args, **kwargs):
            called_bases.append(kwargs["api_base"])
            return FakeResponse()

        agent_module.call_openai_chat = fake_chat
        try:
            msg_one, tool_calls_one = agent._get_next_turn_message("multimodal retrieval")
            msg_two, tool_calls_two = agent._get_next_turn_message("multimodal retrieval")
        finally:
            agent_module.call_openai_chat = original_chat

        self.assertIsNotNone(msg_one)
        self.assertIsNone(tool_calls_one)
        self.assertIsNotNone(msg_two)
        self.assertIsNone(tool_calls_two)
        self.assertEqual(called_bases, ["http://localhost:8998/v1", "http://localhost:8999/v1"])

    def test_search_agent_failover_uses_next_backend(self):
        agent = agent_module.PaperSearchV2Agent(
            agent_backends=[
                {"name": "agent-a", "url": "http://localhost:8998/v1"},
                {"name": "agent-b", "url": "http://localhost:8999/v1"},
            ]
        )

        original_chat = agent_module.call_openai_chat
        called_bases = []

        class FakeMessage:
            tool_calls = None

        class FakeChoice:
            def __init__(self):
                self.message = FakeMessage()

        class FakeResponse:
            def __init__(self):
                self.choices = [FakeChoice()]

        def fake_chat(*args, **kwargs):
            called_bases.append(kwargs["api_base"])
            if kwargs["api_base"].endswith("8998/v1"):
                raise RuntimeError("primary agent unavailable")
            return FakeResponse()

        agent_module.call_openai_chat = fake_chat
        try:
            msg, tool_calls = agent._get_next_turn_message("multimodal retrieval")
        finally:
            agent_module.call_openai_chat = original_chat

        self.assertIsNotNone(msg)
        self.assertIsNone(tool_calls)
        self.assertEqual(called_bases, ["http://localhost:8998/v1", "http://localhost:8999/v1"])


class PaperSearchV2ClientTest(unittest.IsolatedAsyncioTestCase):
    async def test_get_paper_returns_none_on_404(self):
        client = utils_module.PaperSearchV2Client(base_url="http://example.com")

        class FakeResponse:
            status_code = 404

            def raise_for_status(self):
                raise AssertionError("404 should be handled before raise_for_status")

            def json(self):
                return {}

        client._request = AsyncMock(return_value=FakeResponse())
        paper = await client.get_paper("2602.14744")

        self.assertIsNone(paper)
        await client.close()

    async def test_search_uses_local_db_range_params(self):
        client = utils_module.PaperSearchV2Client(base_url="http://example.com")

        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"data": []}

        client._request = AsyncMock(return_value=FakeResponse())
        await client.search(
            "test query",
            limit=5,
            source="local_db",
            from_month="2024-01",
            to_month="2024-12",
        )

        _, kwargs = client._request.call_args
        self.assertEqual(kwargs["params"]["query"], "test query")
        self.assertEqual(kwargs["params"]["limit"], 5)
        self.assertEqual(kwargs["params"]["from"], "2024-01")
        self.assertEqual(kwargs["params"]["to"], "2024-12")
        await client.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
