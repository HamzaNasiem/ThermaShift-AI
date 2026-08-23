"""SQLAlchemy model for heat snapshots fetched from FortyGuard."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class HeatSnapshot(Base):
    __tablename__ = "heat_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    fortyguard_activity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    temperature_f: Mapped[float] = mapped_column(Numeric, nullable=False)
    analysis_layer: Mapped[str] = mapped_column(String, nullable=False, default="snapshot")
    risk_level: Mapped[str] = mapped_column(String, nullable=False)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("analysis_layer IN ('snapshot','exceedance','persistence')", name="ck_snapshot_layer"),
        CheckConstraint("risk_level IN ('normal','elevated','extreme')", name="ck_snapshot_risk"),
    )
