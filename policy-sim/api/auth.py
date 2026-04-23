"""Shared-secret auth middleware for the policy-sim API."""

import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

_BYPASS_PATHS = {"/api/health", "/api/debug/boom", "/api/smoke", "/api/scenarios"}


class ApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _BYPASS_PATHS:
            return await call_next(request)
        key = os.environ.get("POLICY_SIM_KEY", "")
        if not key:
            return await call_next(request)
        # Accept key via header OR query param (query param needed for native EventSource)
        provided = (
            request.headers.get("X-POLICY-SIM-KEY", "")
            or request.query_params.get("key", "")
        )
        if provided != key:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return await call_next(request)
