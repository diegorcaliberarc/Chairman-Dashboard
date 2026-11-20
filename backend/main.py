from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.circadian_router import router as circadian_router
from backend.routers.copilot_mcp_router import router as copilot_mcp_router
from backend.routers.pods_router import router as pods_router


def resolve_allowed_origins() -> List[str]:
    """
    Zenity Zero-Trust CORS Policy: never combine allow_origins=['*'] with
    allow_credentials=True. Restrict credentialed CORS to explicit allowlist.
    """
    raw = os.environ.get("CHAIRMAN_ALLOWED_ORIGINS", "").strip()
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


app = FastAPI(
    title="Chairman Dashboard Living OS — Sovereign API",
    description=(
        "FastAPI Contract Engine v3.0: Circadian Solar Arc, Zero-Trust Shared Pods, "
        "Scoped MCP Sovereign Mesh Manifest, and Multimodal Live Copilot WebSocket."
    ),
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(circadian_router)
app.include_router(pods_router)
app.include_router(copilot_mcp_router)


@app.get("/health")
async def healthcheck() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "chairman-living-os-fastapi",
        "version": "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
