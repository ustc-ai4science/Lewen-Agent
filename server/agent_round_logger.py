from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_ROUND_LOG_PATH = Path(__file__).resolve().parents[1] / "logs" / "agent_rounds.log"


class AgentRoundLogger:
    def __init__(self, log_path: str | None = None) -> None:
        resolved_path = Path(log_path.strip()) if log_path and log_path.strip() else DEFAULT_ROUND_LOG_PATH
        if not resolved_path.is_absolute():
            resolved_path = Path(__file__).resolve().parents[1] / resolved_path
        self.log_path = resolved_path
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    @classmethod
    def from_env(cls) -> "AgentRoundLogger":
        return cls(os.getenv("PAPER_AGENT_V2_ROUND_LOG_PATH"))

    def log_event(self, *, event_type: str, payload: dict[str, Any]) -> None:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            **payload,
        }
        with self._lock:
            with self.log_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=True) + "\n")
