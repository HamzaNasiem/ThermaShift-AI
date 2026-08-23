"""Pydantic response schema for heat snapshots."""

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class HeatSnapshotResponse(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    fortyguard_activity_id: str | None
    temperature_f: float
    analysis_layer: str
    risk_level: str
    raw_response: dict[str, Any] | None = None
    captured_at: datetime

    model_config = {"from_attributes": True}
