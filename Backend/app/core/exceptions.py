from __future__ import annotations

from fastapi import HTTPException, status


class CCMSBaseException(HTTPException):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(
            status_code=self.status_code,
            detail=detail or self.__class__.detail,
        )


class NotFoundError(CCMSBaseException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"


class ConflictError(CCMSBaseException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource conflict"


class ForbiddenError(CCMSBaseException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Access denied"


class UnauthorizedError(CCMSBaseException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Not authenticated"


class ValidationError(CCMSBaseException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation failed"


class RateLimitError(CCMSBaseException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    detail = "Rate limit exceeded"


class ServiceUnavailableError(CCMSBaseException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "Service temporarily unavailable"
