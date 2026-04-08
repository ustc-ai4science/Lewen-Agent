from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(
        self,
        *,
        code: int,
        message: str,
        error_type: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details or {}
        self.request_id = str(uuid4())


def success_response(data: Any, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "code": 0,
            "message": "ok",
            "request_id": str(uuid4()),
            "data": data,
        },
    )


def error_response(error: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={
            "code": error.code,
            "message": error.message,
            "request_id": error.request_id,
            "error": {
                "type": error.error_type,
                "details": error.details,
            },
        },
    )
