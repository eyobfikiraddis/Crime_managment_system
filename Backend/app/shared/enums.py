from __future__ import annotations

from enum import Enum


class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    undisclosed = "undisclosed"


class LocationTypeEnum(str, Enum):
    country = "country"
    region = "region"
    city = "city"
    district = "district"
    street = "street"
    building = "building"
    crime_scene = "crime_scene"
    court = "court"
    storage = "storage"
    other = "other"


class SeverityEnum(str, Enum):
    infraction = "infraction"
    misdemeanor = "misdemeanor"
    felony = "felony"
    capital = "capital"


class RiskLevelEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AccessLevelEnum(str, Enum):
    read = "read"
    write = "write"
    admin = "admin"


class RoleInCaseEnum(str, Enum):
    lead_investigator = "lead_investigator"
    co_investigator = "co_investigator"
    support_officer = "support_officer"
    forensic_officer = "forensic_officer"
    supervisor = "supervisor"


class ChargeStatusEnum(str, Enum):
    filed = "filed"
    pending = "pending"
    dismissed = "dismissed"
    convicted = "convicted"
    acquitted = "acquitted"
    appealed = "appealed"


class VerdictEnum(str, Enum):
    pending = "pending"
    guilty = "guilty"
    not_guilty = "not_guilty"
    mistrial = "mistrial"
    dismissed = "dismissed"


class AuthEventEnum(str, Enum):
    login_success = "login_success"
    login_failure = "login_failure"
    logout = "logout"
    password_change = "password_change"
    password_reset_request = "password_reset_request"
    password_reset_complete = "password_reset_complete"
    mfa_success = "mfa_success"
    mfa_failure = "mfa_failure"
    token_refresh = "token_refresh"
    account_locked = "account_locked"
    account_unlocked = "account_unlocked"
    permission_granted = "permission_granted"
    permission_revoked = "permission_revoked"
    role_changed = "role_changed"
    session_invalidated = "session_invalidated"


class RoleNameEnum(str, Enum):
    readonly = "readonly"
    forensic = "forensic"
    legal_officer = "legal_officer"
    investigator = "investigator"
    department_head = "department_head"
    admin = "admin"
    superadmin = "superadmin"
