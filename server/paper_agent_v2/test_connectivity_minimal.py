import json
import os
import socket
import ssl
import sys
import urllib.error
import urllib.request
from typing import Optional
from urllib.parse import urlparse

try:
    from ..env_loader import load_env
except ImportError:
    from server.env_loader import load_env

load_env()

DEFAULT_MODEL = "Qwen3-4b-instruct"
DEFAULT_API_KEY = "Qwen3-4b-instruct"
DEFAULT_AGENT_API_BASES = (
    "http://localhost:8998/v1",
    "http://localhost:8999/v1",
)
DEFAULT_WARMUP_MODEL = "qwen3-max"
DEFAULT_WARMUP_API_KEY = "sk-d85cf3f774b646659b6fd099b9c7672d"
DEFAULT_WARMUP_AGENT_API_BASES = (
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
)
DEFAULT_SCORER_URLS = (
    "http://localhost:8993/classify",
    "http://localhost:8996/classify",
)
DEFAULT_SEARCH_BASE = "http://172.16.100.204:4000"


def print_section(title: str) -> None:
    print(f"\n=== {title} ===")


def print_result(name: str, ok: bool, detail: str) -> None:
    status = "OK" if ok else "FAIL"
    print(f"[{status}] {name}: {detail}")


def parse_host_port(url: str) -> tuple[str, int]:
    parsed = urlparse(url)
    host = parsed.hostname or ""
    if parsed.port is not None:
        return host, parsed.port
    return host, 443 if parsed.scheme == "https" else 80


def parse_scorer_urls() -> list[str]:
    raw_urls = os.getenv("PAPER_AGENT_V2_SCORER_URLS", "").strip()
    legacy_url = os.getenv("PAPER_AGENT_V2_SELECTOR_URL", "").strip()
    if raw_urls:
        return [item.strip() for item in raw_urls.replace(",", " ").split() if item.strip()]
    if legacy_url:
        return [legacy_url]
    return list(DEFAULT_SCORER_URLS)


def parse_agent_api_bases() -> list[str]:
    raw_urls = os.getenv("PAPER_AGENT_V2_AGENT_URLS", "").strip()
    legacy_url = os.getenv("PAPER_AGENT_V2_API_BASE", "").strip()
    if raw_urls:
        return [item.strip() for item in raw_urls.replace(",", " ").split() if item.strip()]
    if legacy_url:
        return [legacy_url]
    return list(DEFAULT_AGENT_API_BASES)


def parse_warmup_enabled() -> bool:
    return os.getenv("PAPER_AGENT_V2_WARMUP_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}


def parse_warmup_top_k() -> int:
    raw_value = os.getenv("PAPER_AGENT_V2_WARMUP_TOP_K", "").strip()
    if not raw_value:
        return 0
    try:
        return int(raw_value)
    except Exception:
        return 0


def parse_warmup_agent_api_bases() -> list[str]:
    raw_urls = os.getenv("PAPER_AGENT_V2_WARMUP_AGENT_URLS", "").strip()
    legacy_url = os.getenv("PAPER_AGENT_V2_WARMUP_API_BASE", "").strip()
    if raw_urls:
        return [item.strip() for item in raw_urls.replace(",", " ").split() if item.strip()]
    if legacy_url:
        return [legacy_url]
    return list(DEFAULT_WARMUP_AGENT_API_BASES)


def tcp_probe(name: str, url: str, timeout: float = 5.0) -> bool:
    host, port = parse_host_port(url)
    try:
        with socket.create_connection((host, port), timeout=timeout):
            print_result(name, True, f"TCP connect to {host}:{port} succeeded")
            return True
    except Exception as exc:
        print_result(name, False, f"TCP connect to {host}:{port} failed: {exc!r}")
        return False


def tls_probe(name: str, url: str, timeout: float = 5.0) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        print_result(name, True, "Skipped for non-HTTPS endpoint")
        return True

    host, port = parse_host_port(url)
    try:
        context = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=host) as tls_sock:
                print_result(name, True, f"TLS handshake succeeded with {tls_sock.version()}")
                return True
    except Exception as exc:
        print_result(name, False, f"TLS handshake failed: {exc!r}")
        return False


def http_json_request(
    name: str,
    url: str,
    payload: Optional[dict] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: float = 10.0,
) -> bool:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(url, data=data, headers=request_headers, method="POST" if data else "GET")

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(300).decode("utf-8", errors="replace")
            print_result(name, True, f"HTTP {response.status}, body preview: {body}")
            return True
    except urllib.error.HTTPError as exc:
        body = exc.read(300).decode("utf-8", errors="replace")
        print_result(name, False, f"HTTP {exc.code}, body preview: {body}")
        return False
    except Exception as exc:
        print_result(name, False, f"Request failed: {exc!r}")
        return False


def openai_sdk_probe(api_base: str, model: str, api_key: str, timeout: float = 20.0) -> bool:
    print_section("OpenAI SDK Probe")
    if not api_key:
        print_result("sdk_chat_completion", False, "Skipped because API key is empty")
        return False

    try:
        from openai import OpenAI
    except Exception as exc:
        print_result("sdk_chat_completion", False, f"OpenAI import failed: {exc!r}")
        return False

    try:
        client = OpenAI(api_key=api_key, base_url=api_base, timeout=timeout)
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Reply with the single word OK."}],
        )
        content = response.choices[0].message.content if response.choices else ""
        print_result("sdk_chat_completion", True, f"Request succeeded, response preview: {content!r}")
        return True
    except Exception as exc:
        print_result("sdk_chat_completion", False, f"SDK request failed: {type(exc).__name__}: {exc}")
        return False


def main() -> int:
    agent_api_bases = parse_agent_api_bases()
    warmup_agent_api_bases = parse_warmup_agent_api_bases()
    scorer_urls = parse_scorer_urls()
    search_base = os.getenv("PAPER_SEARCH_V2_BASE_URL", DEFAULT_SEARCH_BASE).rstrip("/")
    api_key = os.getenv("PAPER_AGENT_V2_API_KEY", DEFAULT_API_KEY)
    model = os.getenv("PAPER_AGENT_V2_MODEL_NAME", DEFAULT_MODEL)
    warmup_enabled = parse_warmup_enabled()
    warmup_top_k = parse_warmup_top_k()
    warmup_api_key = os.getenv("PAPER_AGENT_V2_WARMUP_API_KEY", DEFAULT_WARMUP_API_KEY)
    warmup_model = os.getenv("PAPER_AGENT_V2_WARMUP_MODEL_NAME", DEFAULT_WARMUP_MODEL)
    selector_model = os.getenv("PAPER_AGENT_V2_SELECTOR_MODEL", "selector")

    print_section("Configuration")
    print(f"AGENT_API_BASES={' '.join(agent_api_bases)}")
    print(f"MODEL={model}")
    print(f"WARMUP_ENABLED={warmup_enabled}")
    print(f"WARMUP_TOP_K={warmup_top_k}")
    print(f"WARMUP_AGENT_API_BASES={' '.join(warmup_agent_api_bases)}")
    print(f"WARMUP_MODEL={warmup_model}")
    print(f"SCORER_URLS={' '.join(scorer_urls)}")
    print(f"SELECTOR_MODEL={selector_model}")
    print(f"SEARCH_BASE={search_base}")
    print(f"API_KEY_PRESENT={'yes' if bool(api_key) else 'no'}")
    print(f"WARMUP_API_KEY_PRESENT={'yes' if bool(warmup_api_key) else 'no'}")

    print_section("Network Probes")
    for index, agent_api_base in enumerate(agent_api_bases, start=1):
        tcp_probe(f"agent_{index}_tcp", agent_api_base)
        tls_probe(f"agent_{index}_tls", agent_api_base)
    if warmup_enabled:
        for index, agent_api_base in enumerate(warmup_agent_api_bases, start=1):
            tcp_probe(f"warmup_agent_{index}_tcp", agent_api_base)
            tls_probe(f"warmup_agent_{index}_tls", agent_api_base)
    for index, scorer_url in enumerate(scorer_urls, start=1):
        tcp_probe(f"scorer_{index}_tcp", scorer_url)
    tcp_probe("search_service_tcp", search_base)

    print_section("HTTP Probes")
    for index, agent_api_base in enumerate(agent_api_bases, start=1):
        http_json_request(f"agent_{index}_base_get", agent_api_base)
    if warmup_enabled:
        for index, agent_api_base in enumerate(warmup_agent_api_bases, start=1):
            http_json_request(f"warmup_agent_{index}_base_get", agent_api_base)
    for index, scorer_url in enumerate(scorer_urls, start=1):
        http_json_request(
            f"scorer_{index}_classify",
            scorer_url,
            payload={"model": selector_model, "input": ["Test prompt"]},
        )
    http_json_request("search_service_get", f"{search_base}/paper/search?query=test&limit=1")

    for index, agent_api_base in enumerate(agent_api_bases, start=1):
        print_section(f"OpenAI SDK Probe Agent {index}")
        openai_sdk_probe(api_base=agent_api_base, model=model, api_key=api_key)
    if warmup_enabled:
        for index, agent_api_base in enumerate(warmup_agent_api_bases, start=1):
            print_section(f"OpenAI SDK Probe Warmup Agent {index}")
            openai_sdk_probe(api_base=agent_api_base, model=warmup_model, api_key=warmup_api_key)
    return 0


if __name__ == "__main__":
    sys.exit(main())
