"""SQLAlchemy model for site workers."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Uuid, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="safe",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('safe','elevated','notified','acknowledged')", name="ck_worker_status"),
    )
