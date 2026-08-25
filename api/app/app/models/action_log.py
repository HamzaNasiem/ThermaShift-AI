"""SQLAlchemy model for alert action logs (voice + SMS dispatch records)."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Uuid, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ActionLog(Base):
    __tablename__ = "action_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    heat_snapshot_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("heat_snapshots.id", ondelete="SET NULL"), nullable=True)
    channel: Mapped[str] = mapped_column(String, nullable=False)  # 'voice' | 'sms'
    provider_ref: Mapped[str | None] = mapped_column(String, nullable=True)  # Retell call_id or Twilio sid
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    transcript: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("channel IN ('voice','sms')", name="ck_log_channel"),
        CheckConstraint("status IN ('queued','delivered','failed','acknowledged')", name="ck_log_status"),
    )
