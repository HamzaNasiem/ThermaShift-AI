"""Pydantic request/response schemas for workers."""

import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class WorkerCreate(BaseModel):
    site_id: uuid.UUID
    name: str
    phone_number: str
    preferred_language: Literal["ur", "en"] = "ur"


class WorkerResponse(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    name: str
    phone_number: str
    preferred_language: str
    status: str
    consented_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
