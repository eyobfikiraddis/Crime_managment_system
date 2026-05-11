from __future__ import annotations

import pytest

from app.modules.case_management.permissions import level_satisfies
from app.shared.enums import AccessLevelEnum


@pytest.mark.parametrize(
    ("actual", "required", "expected"),
    [
        (AccessLevelEnum.admin.value, AccessLevelEnum.read.value, True),
        (AccessLevelEnum.write.value, AccessLevelEnum.read.value, True),
        (AccessLevelEnum.read.value, AccessLevelEnum.read.value, True),
        (AccessLevelEnum.read.value, AccessLevelEnum.write.value, False),
        (AccessLevelEnum.write.value, AccessLevelEnum.write.value, True),
        (AccessLevelEnum.write.value, AccessLevelEnum.admin.value, False),
    ],
)
def test_level_satisfies(actual: str, required: str, expected: bool) -> None:
    assert level_satisfies(actual, required) is expected
