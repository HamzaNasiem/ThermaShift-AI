"""FastAPI application entrypoint for ThermaShift AI."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.scheduler import poll_loop
from app.routers import sites, workers, heat, alerts, internal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_poller_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background poller on startup, cancel on shutdown."""
    global _poller_task
    if settings.environment != "testing":
        _poller_task = asyncio.create_task(poll_loop())
        logger.info("ThermaShift AI backend started")
    yield
    if _poller_task:
        _poller_task.cancel()
        try:
            await _poller_task
        except asyncio.CancelledError:
            pass
    logger.info("ThermaShift AI backend shut down")


app = FastAPI(
    title="ThermaShift AI",
    description="Autonomous heat-safety alert system for outdoor workers.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://thermashift-ai.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router, prefix="/sites", tags=["Sites"])
app.include_router(workers.router, prefix="/workers", tags=["Workers"])
app.include_router(heat.router, prefix="/heat", tags=["Heat"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(internal.router, prefix="/internal", tags=["Internal"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness check endpoint."""
    return {"status": "ok", "service": "ThermaShift AI"}
