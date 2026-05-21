from __future__ import annotations

from app.core.exceptions import ForbiddenError, NotFoundError


class CaseNotFoundError(NotFoundError):
    detail = "Case not found"


class CaseAccessDeniedError(ForbiddenError):
    detail = "You do not have access to this case"
