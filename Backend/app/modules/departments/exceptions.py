from __future__ import annotations

from app.core.exceptions import NotFoundError


class NoDepartmentHeadError(NotFoundError):
    detail = "This department currently has no assigned department head"
