"""Deduplication helpers: prevents double-alerting the same worker for the same snapshot."""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.action_log import ActionLog


async def already_notified(db: AsyncSession, worker_id: uuid.UUID, snapshot_id: uuid.UUID, channel: str) -> bool:
    """Returns True if this worker was already alerted on this channel for this snapshot."""
    result = await db.execute(
        select(ActionLog).where(
            ActionLog.worker_id == worker_id,
            ActionLog.heat_snapshot_id == snapshot_id,
            ActionLog.channel == channel,
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None
