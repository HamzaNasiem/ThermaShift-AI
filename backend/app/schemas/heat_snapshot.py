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


class MicrocellDetail(BaseModel):
    id: str
    row: int
    col: int
    lat: float
    lng: float
    temp_f: float
    temp_c: float
    surface_temp_f: float
    surface_type: str  # 'asphalt', 'concrete', 'shaded_canopy', 'green_buffer'
    solar_exposure: str  # 'direct_sun', 'partial_shade', 'full_canopy_shade'
    solar_radiation_w_m2: float
    is_hotspot: bool = False
    is_refuge: bool = False


class MicroclimateAnalysisResponse(BaseModel):
    site_id: uuid.UUID
    site_name: str
    ambient_temp_f: float
    surface_temp_f: float
    uhi_delta_f: float
    solar_radiation_w_m2: float
    hotspot_zone: str
    cooling_refuge: str
    recommended_shift_distance_m: int
    cooling_delta_f: float
    action_plan: str
    microcells: list[MicrocellDetail]
    vector_origin_lat: float
    vector_origin_lng: float
    vector_target_lat: float
    vector_target_lng: float

