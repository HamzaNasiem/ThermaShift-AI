"""Async SQLAlchemy engine and session factory with automatic fallback."""

import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.database_url

# On serverless (Vercel / Lambda), ensure writable SQLite or Postgres
if os.environ.get("VERCEL") and db_url.startswith("sqlite") and not db_url.startswith("sqlite+aiosqlite:////tmp/"):
    db_url = "sqlite+aiosqlite:////tmp/thermashift.db"

try:
    connect_args = {}
    engine_kwargs = {
        "echo": settings.environment == "development",
    }

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

    engine = create_async_engine(
        db_url,
        connect_args=connect_args,
        **engine_kwargs,
    )
except Exception as e:
    logger.warning(f"Failed to create engine for {db_url}: {e}. Falling back to SQLite.")
    db_url = "sqlite+aiosqlite:////tmp/thermashift.db"
    engine = create_async_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
