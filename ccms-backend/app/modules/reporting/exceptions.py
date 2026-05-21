from __future__ import annotations

from app.core.exceptions import ForbiddenError, ValidationError


class ReportAccessDeniedError(ForbiddenError):
    detail = "Insufficient permissions to access this report."


class InvalidDateRangeError(ValidationError):
    detail = "Invalid date range"
