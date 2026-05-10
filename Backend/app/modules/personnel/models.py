from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.auth.models import (
    AuthAuditLog,
    Department,
    Officer,
    OfficerHistory,
    Person,
    PersonHistory,
    Role,
)
from app.shared.base_model import Base


class DepartmentAuditLog(Base):
    __tablename__ = "department_audit_log"

    audit_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("department.department_id"), nullable=False
    )
    changed_by_officer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("officer.officer_id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    department: Mapped[Department] = relationship("Department", backref="audit_logs")
    changed_by: Mapped[Officer] = relationship(
        "Officer", backref="department_audit_logs", foreign_keys=[changed_by_officer_id]
    )


__all__ = [
    "AuthAuditLog",
    "Department",
    "DepartmentAuditLog",
    "Officer",
    "OfficerHistory",
    "Person",
    "PersonHistory",
    "Role",
]
