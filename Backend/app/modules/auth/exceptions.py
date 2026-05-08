from __future__ import annotations

from app.core.exceptions import (
    CCMSBaseException,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from fastapi import status


class InvalidCredentialsError(UnauthorizedError):
    detail = "Invalid credentials"


class InvalidTokenError(UnauthorizedError):
    detail = "Invalid or expired token"


class SessionExpiredError(UnauthorizedError):
    detail = "Session expired due to inactivity. Please log in again."


class AccountInactiveError(UnauthorizedError):
    detail = "Account is inactive"


class InvalidResetTokenError(CCMSBaseException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Reset token is invalid or has expired"


class SamePasswordError(ValidationError):
    detail = "New password must be different from the current password"


class IncorrectCurrentPasswordError(UnauthorizedError):
    detail = "Current password is incorrect"
