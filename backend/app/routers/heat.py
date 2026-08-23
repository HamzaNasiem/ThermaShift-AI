"""Router for heat snapshot data endpoints."""

import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.heat_snapshot import HeatSnapshot
from app.schemas.heat_snapshot import HeatSnapshotResponse

router = APIRouter()


@router.get("", response_model=HeatSnapshotResponse)
async def get_latest_heat(
    site_id: uuid.UUID = Query(..., description="Site ID to get the latest heat snapshot for"),
    db: AsyncSession = Depends(get_db),
):
    """Return the most recent heat snapshot for a site  -  polled by the frontend every 15-30s."""
    result = await db.execute(
        select(HeatSnapshot)
        .where(HeatSnapshot.site_id == site_id)
        .order_by(HeatSnapshot.captured_at.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(status_code=404, detail="No heat snapshots found for this site")
    return snapshot


@router.get("/history", response_model=list[HeatSnapshotResponse])
async def get_heat_history(
    site_id: uuid.UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return recent heat snapshot history for a site."""
    result = await db.execute(
        select(HeatSnapshot)
        .where(HeatSnapshot.site_id == site_id)
        .order_by(HeatSnapshot.captured_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
