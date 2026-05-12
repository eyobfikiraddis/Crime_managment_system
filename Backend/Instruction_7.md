---

# Instruction.md — CCMS Gap Implementation Guide

## SECTION 1 — PREAMBLE & HARD RULES

You are implementing missing features in an existing, working FastAPI + PostgreSQL + Redis backend called CCMS (Centralized Crime Management System). The codebase already has working modules for reference data, auth, personnel, departments, cases (partial), and evidence (complete). You are adding only the items specified in this file.

**Absolute non-negotiable rules. Violation of any of these is a critical error:**

1. **No test files.** Do not create any file in a `tests/` directory or named `test_*.py`.
2. **No refactoring.** Do not modify any existing working endpoint, service method, repository method, or model unless this file explicitly instructs you to add to that file.
3. **No new auth dependencies.** Reuse `get_current_officer` exactly as it exists. Do not create any wrapper, variant, or alternative.
4. **No new pagination utilities.** Reuse the existing pagination class and response wrapper exactly as found in the codebase.
5. **No new base exception classes.** Reuse the existing exception hierarchy exactly as found in `app/core/exceptions.py`.
6. **No synchronous DB access.** Every database call must use `await session.execute(select(...))` or `await session.execute(insert(...))` etc. Never use `session.query(...)`.
7. **No stub functions or TODO comments.** Every method you write must be fully implemented. If you write a function signature, the body must be complete.
8. **No migrations that touch confirmed-existing tables.** Do not recreate or drop tables confirmed to exist. Use `op.add_column()` only for missing columns. Check before writing.
9. **No raw SQL.** Use SQLAlchemy ORM exclusively. No `text(...)`, no `op.execute("SELECT ...")` for data manipulation.
10. **No new router registered only at end.** Register each new router in `app/main.py` immediately after completing that task, before starting the next task.

---

## SECTION 2 — MANDATORY MINIMAL CODEBASE SCAN

Perform this scan **before writing a single line of new code**. Read exactly the files listed. Do not read additional files unless a specific file you open imports something you need to replicate and the import target is unclear.

### Step 1 — Alembic migrations
- List all filenames in `alembic/versions/` (do not open them yet).
- Identify the two most recently dated files by filename prefix or timestamp.
- Open those two files only.
- Note: the `down_revision` chain, how enums are referenced (`sa.Enum(...)` with named type or `postgresql.ENUM`), whether `IF NOT EXISTS` is used, and the exact import block at the top.
- Note the highest existing revision ID — your new migrations must chain from it.

### Step 2 — Models
- Open `app/models/case.py` (or equivalent). Note: class name, `__tablename__`, how `deleted_at` is declared, how relationships are declared, how `TimestampMixin` or base class is used if any.
- Open `app/models/evidence.py`. Note: same conventions. This is your template for new model files.
- Open one additional model file (your choice — whichever looks most complete). Confirm conventions are consistent.

### Step 3 — Repositories
- Open `app/repositories/case_repository.py`. Note: async session injection pattern (is it `AsyncSession` parameter, or a dependency?), how `select()` + `where()` + `scalars().first()` / `scalars().all()` is called, how soft-delete is filtered (`where(Model.deleted_at.is_(None))`), how pagination is applied (`offset`/`limit`), how inserts are done (`session.add(obj)` + `await session.flush()` or `await session.commit()`).
- Open `app/repositories/evidence_repository.py`. Confirm patterns are consistent.

### Step 4 — Services
- Open `app/services/case_service.py`. Note: how services call repository methods, how they raise exceptions, whether they receive the session and pass it through, or whether session management is at a different layer.
- Open `app/services/evidence_service.py`. Confirm patterns consistent.

### Step 5 — Routers
- Open `app/routers/case_router.py` (or `app/api/cases.py` — match whatever path exists). Note: how `Depends(get_current_officer)` is declared in each function signature, how `response_model` is set, how `status_code` is set, how the router prefix and tags are declared.
- Open one additional completed router (evidence or departments). Confirm conventions.

### Step 6 — Core
- Open `app/core/dependencies.py`. Extract the **exact** function signature of `get_current_officer` including its return type annotation. You will use this verbatim in every router.
- Open `app/core/exceptions.py`. List all exception class names and their HTTP status codes. You will reuse these — do not create new base classes.
- Open `app/core/permissions.py` or `app/core/security.py` (whichever contains `check_case_access`). Extract the **exact** function signature. Note whether it is `async` or sync, what arguments it takes, and what it raises on failure (does it raise a specific exception or return bool?).

### Step 7 — Main
- Open `app/main.py`. Note the exact pattern used to register routers: `app.include_router(router, prefix="...", tags=[...])`. Count and list the existing registrations so you can replicate the style exactly.

### Step 8 — Schemas
- Open `app/schemas/case_schemas.py` (or equivalent). Note how `BaseModel` is subclassed, whether `model_config` is used for Pydantic v2, how `Optional` fields are declared, how response schemas include nested objects.

### Step 9 — Mental model summary (write this before proceeding)

Before writing any new code, write the following as a comment block in a scratch area (you can use a comment in the first new file you create, then delete it):

```
# MENTAL MODEL:
# Session injection pattern: [exact pattern from scan]
# Pagination class name: [exact class name]
# 404 exception: [exact class name]
# 409 exception: [exact class name]
# 403 exception: [exact class name]
# 422 exception: [exact class name]
# Soft-delete filter: [exact ORM expression]
# check_case_access signature: [exact signature]
# check_case_access raises on failure: [exception class or bool return]
# Router Depends pattern: [exact Depends(...) expression]
# Transaction pattern: [async with session.begin() / session.add+flush / other]
# Enum import style in migrations: [sa.Enum / postgresql.ENUM / existing type ref]
```

---

## SECTION 3 — DATABASE SCHEMA REFERENCE

These are the confirmed columns from the V3 relational diagram. Do not deviate from these names.

### Tables that already exist — do not recreate, do not alter unless adding a confirmed-missing column

**`case`**
`case_id serial PK`, `title varchar(255)`, `description text`, `date_reported date`, `crime_type_id int FK→crime_type`, `location_id int FK→location`, `status_id int FK→case_status`, `department_id int FK→department`, `created_by int FK→officer`, `updated_by int FK→officer`, `archived_by int FK→officer`, `closed_by int FK→officer`, `archived_at timestamptz`, `closed_at timestamptz`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`

**`case_update`**
`update_id serial PK`, `case_id int FK→case`, `officer_id int FK→officer`, `update_type varchar(50)`, `description text`, `created_at timestamptz`
**Append-only. DB trigger prevents UPDATE or DELETE on this table. Only INSERT.**

**`case_permission`**
`permission_id serial PK`, `case_id int FK→case`, `officer_id int FK→officer`, `access_level access_level_enum`, `can_read boolean`, `can_write boolean`, `can_admin boolean`, `granted_by int FK→officer`, `granted_at timestamptz`, `revoked_at timestamptz`, `revoked_by int FK→officer`

**`case_permission_audit`**
`audit_id serial PK`, `permission_id int FK→case_permission`, `case_id int FK→case`, `officer_id int FK→officer`, `action varchar(50)`, `old_access_level access_level_enum`, `new_access_level access_level_enum`, `performed_by int FK→officer`, `performed_at timestamptz`, `notes text`

**`case_suspects`**
`id serial PK`, `case_id int FK→case`, `suspect_id int FK→suspect`, `notes text`, `added_at timestamptz`, `added_by int FK→officer`

**`suspect`**
`suspect_id serial PK`, `person_id int FK→person`, `criminal_record text`, `risk_level risk_level_enum`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`

**`officer`**
`officer_id serial PK`, `person_id int FK→person`, `department_id int FK→department`, `role_id int FK→role`, `rank varchar(50)`, `badge_number varchar(50)`, `password_hash varchar(255)`, `is_active boolean`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`

**`person`**
`person_id serial PK`, `first_name varchar(100)`, `last_name varchar(100)`, ... (join via officer for names)

**`location`**
`location_id serial PK`, `name varchar(255)`, `city varchar(100)`, `region varchar(100)`, ...

### Tables you will create migrations for — these may be partially or fully absent

**`report`**
```
report_id    serial PRIMARY KEY
case_id      int NOT NULL REFERENCES case(case_id)
officer_id   int NOT NULL REFERENCES officer(officer_id)
report_type  varchar(50) NOT NULL
content      text NOT NULL
created_at   timestamptz NOT NULL DEFAULT now()
updated_at   timestamptz
deleted_at   timestamptz
```

**`interrogation`**
```
interrogation_id  serial PRIMARY KEY
case_id           int NOT NULL REFERENCES case(case_id)
suspect_id        int NOT NULL REFERENCES suspect(suspect_id)
officer_id        int NOT NULL REFERENCES officer(officer_id)
location_id       int REFERENCES location(location_id)
notes             text
recording_url     varchar(500)
date              timestamptz NOT NULL
created_at        timestamptz NOT NULL DEFAULT now()
updated_at        timestamptz
deleted_at        timestamptz
```

**`arrest`**
```
arrest_id       serial PRIMARY KEY
suspect_id      int NOT NULL REFERENCES suspect(suspect_id)
officer_id      int NOT NULL REFERENCES officer(officer_id)
case_id         int REFERENCES case(case_id)
booking_number  varchar(100) UNIQUE
location_id     int REFERENCES location(location_id)
bail_amount     decimal(12,2)
bail_set_at     timestamptz
date            timestamptz NOT NULL
released_at     timestamptz
notes           text
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz
deleted_at      timestamptz
```

### Enums confirmed to exist — never recreate in migrations, reference as existing types

`genderenum`, `locationtypeenum`, `severityenum`, `risklevelenum`, `accesslevelenum`, `roleincaseenum`, `chargestatusenum`, `verdictenum`, `autheventenum`

When referencing these in `op.create_table()`, use `sa.Enum(..., name='accesslevelenum', create_type=False)` (or whatever pattern your existing migrations use — match it exactly from your scan).

### Indexes to create (only if not already present — check existing migrations first)

```sql
idx_report_case         ON report(case_id)
idx_interrogation_case  ON interrogation(case_id)
idx_interrogation_suspect ON interrogation(suspect_id)
idx_arrest_case         ON arrest(case_id)
idx_arrest_suspect      ON arrest(suspect_id)
idx_arrest_deleted      ON arrest(deleted_at) WHERE deleted_at IS NULL
idx_arrest_released     ON arrest(case_id) WHERE released_at IS NULL
uq_arrest_booking       UNIQUE on arrest(booking_number)
```

---

## SECTION 4 — IMPLEMENTATION ORDER

Complete each task fully (model → schema → repository → service → router → migration → route registration) before starting the next. Do not interleave tasks.

---

### TASK A — POST /cases/{case_id}/updates (add to existing case files)

**Goal:** Add the manually-posted note endpoint. This route already exists in the spec but is not yet implemented.

**Repository** — add to `app/repositories/case_repository.py`:

```python
async def create_case_update(
    self,
    case_id: int,
    officer_id: int,
    update_type: str,
    description: str,
    session: AsyncSession,
) -> CaseUpdate:
    obj = CaseUpdate(
        case_id=case_id,
        officer_id=officer_id,
        update_type=update_type,
        description=description,
        created_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj
```
Match the exact flush/refresh/add pattern you confirmed during the scan.

**Service** — add to `app/services/case_service.py`:

Method: `add_manual_case_update(case_id, requester, data, session)`

Logic:
1. Fetch case by `case_id` where `deleted_at IS NULL` — raise `CaseNotFoundError` (404) if missing.
2. If `data.update_type != 'note'` — raise `422` using the existing validation exception. Note: all other `update_type` values are system-reserved.
3. If case status is `'closed'` — raise `409` using the existing conflict exception with message: `"Cannot add updates to a closed case"`.
4. Call `case_repository.create_case_update(case_id, requester.officer_id, 'note', data.description, session)`.
5. Return the created object.

**Schema** — add to `app/schemas/case_schemas.py` (or create `CaseUpdateCreateRequest` / `CaseUpdateResponse` if not already present):

```python
class CaseUpdateCreateRequest(BaseModel):
    update_type: str  # must equal 'note' — validated in service
    description: str = Field(..., min_length=1, max_length=2000)

class CaseUpdateResponse(BaseModel):
    update_id: int
    case_id: int
    officer_id: int
    update_type: str
    description: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

**Router** — add to the existing case router file:

```python
@router.post(
    "/{case_id}/updates",
    response_model=CaseUpdateResponse,
    status_code=201,
    summary="Add a manual note to a case",
    tags=["Cases"],
)
async def add_case_update(
    case_id: int,
    data: CaseUpdateCreateRequest,
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    # Access check: write or admin case access OR lead_investigator OR dept_head OR admin/superadmin
    case = await case_service.get_case_or_404(case_id, session)
    check_case_access(current_officer, case, minimum_level='write')
    return await case_service.add_manual_case_update(case_id, current_officer, data, session)
```

Adjust the exact `Depends` pattern and session injection to match what you confirmed during the scan. The access check call must match the exact signature of `check_case_access` you found.

**Migration:** No migration needed. `case_update` table already exists.

**Register in main.py:** This is added to the existing case router — no new registration needed.

---

### TASK B — GET + POST /cases/{case_id}/reports (add to existing case files)

**Goal:** Implement the formal report CRUD. The `report` table may not yet exist — check migrations first.

**Model** — add to `app/models/case.py` (or create `app/models/report.py` if models are split per file — match the pattern you found):

```python
class Report(Base):  # use whatever base class the codebase uses
    __tablename__ = "report"

    report_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    report_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    case = relationship("Case", back_populates="reports")
    officer = relationship("Officer")
```

Add `reports = relationship("Report", back_populates="case")` to the `Case` model.

**Schema** — add to case schemas file (or `app/schemas/report_schemas.py`):

```python
class ReportCreateRequest(BaseModel):
    report_type: str  # validated in service: incident|investigation|forensic|summary|final
    content: str = Field(..., min_length=1)

class ReportResponse(BaseModel):
    report_id: int
    case_id: int
    officer_id: int
    report_type: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

**Repository** — add to `app/repositories/case_repository.py`:

```python
async def create_report(self, case_id, officer_id, report_type, content, session) -> Report:
    obj = Report(case_id=case_id, officer_id=officer_id, report_type=report_type,
                 content=content, created_at=datetime.utcnow())
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj

async def list_reports_by_case(self, case_id, page, size, session) -> tuple[list[Report], int]:
    base = select(Report).where(Report.case_id == case_id, Report.deleted_at.is_(None))
    total_result = await session.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar()
    result = await session.execute(base.offset((page - 1) * size).limit(size))
    return result.scalars().all(), total

async def get_final_report_by_case(self, case_id, session) -> Report | None:
    result = await session.execute(
        select(Report).where(
            Report.case_id == case_id,
            Report.report_type == 'final',
            Report.deleted_at.is_(None),
        )
    )
    return result.scalars().first()
```

**Service** — add to `app/services/case_service.py`:

Method: `create_case_report(case_id, requester, data, session)`

Logic:
1. Fetch case — 404 if not found/deleted.
2. Validate `data.report_type` is one of: `incident`, `investigation`, `forensic`, `summary`, `final` — raise 422 if not.
3. If `data.report_type == 'final'`: call `case_repository.get_final_report_by_case(case_id, session)` — raise 409 with message `"A final report already exists for this case"` if one is found.
4. Validate case is not closed — raise 409 if it is.
5. Within a single transaction:
   - Call `case_repository.create_report(case_id, requester.officer_id, data.report_type, data.content, session)`.
   - Call `case_repository.create_case_update(case_id, requester.officer_id, 'report_filed', f"Formal {data.report_type} report filed by Officer {requester.officer_id}", session)`.
6. Return the created report.

Method: `list_case_reports(case_id, requester, page, size, session)`

Logic:
1. Fetch case — 404 if not found/deleted.
2. Check read access via `check_case_access(requester, case, 'read')` — 403 if denied.
3. Call `case_repository.list_reports_by_case(case_id, page, size, session)`.
4. Return paginated response using the existing pagination wrapper class.

**Router** — add to existing case router:

```python
@router.get("/{case_id}/reports", response_model=PaginatedResponse[ReportResponse], status_code=200, ...)
async def list_case_reports(case_id: int, page: int = 1, size: int = 20,
                             current_officer = Depends(get_current_officer),
                             session = Depends(get_db)):
    return await case_service.list_case_reports(case_id, current_officer, page, size, session)

@router.post("/{case_id}/reports", response_model=ReportResponse, status_code=201, ...)
async def create_case_report(case_id: int, data: ReportCreateRequest,
                              current_officer = Depends(get_current_officer),
                              session = Depends(get_db)):
    case = await case_service.get_case_or_404(case_id, session)
    check_case_access(current_officer, case, minimum_level='write')
    return await case_service.create_case_report(case_id, current_officer, data, session)
```

**Migration:** Create a new Alembic migration file. Name it descriptively: `add_report_table`. Chain `down_revision` from the current head. Create the `report` table only if it does not already appear in any existing migration. Include `idx_report_case`. Write a complete `downgrade()` that drops the index then drops the table.

**Register in main.py:** No new router file — this is added to the existing case router. No registration change needed.

---

### TASK C — Case Permissions endpoints (add to existing case files)

**Goal:** Implement the ACL management endpoints for cases.

**Schema** — add to case schemas:

```python
class CasePermissionGrantRequest(BaseModel):
    officer_id: int
    access_level: str  # 'read' | 'write' | 'admin' — validated in service

class CasePermissionResponse(BaseModel):
    permission_id: int
    case_id: int
    officer_id: int
    access_level: str
    can_read: bool
    can_write: bool
    can_admin: bool
    granted_by: int
    granted_at: datetime
    revoked_at: datetime | None
    model_config = ConfigDict(from_attributes=True)
```

**Repository** — add to `app/repositories/case_repository.py`:

```python
async def list_case_permissions(self, case_id, session) -> list[CasePermission]:
    result = await session.execute(
        select(CasePermission).where(
            CasePermission.case_id == case_id,
            CasePermission.revoked_at.is_(None),
        )
    )
    return result.scalars().all()

async def get_active_permission(self, case_id, officer_id, session) -> CasePermission | None:
    result = await session.execute(
        select(CasePermission).where(
            CasePermission.case_id == case_id,
            CasePermission.officer_id == officer_id,
            CasePermission.revoked_at.is_(None),
        )
    )
    return result.scalars().first()

async def grant_case_permission(
    self, case_id, officer_id, access_level, granted_by, session
) -> CasePermission:
    can_read = access_level in ('read', 'write', 'admin')
    can_write = access_level in ('write', 'admin')
    can_admin = access_level == 'admin'
    obj = CasePermission(
        case_id=case_id, officer_id=officer_id, access_level=access_level,
        can_read=can_read, can_write=can_write, can_admin=can_admin,
        granted_by=granted_by, granted_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj

async def revoke_case_permission(
    self, permission_id, revoked_by_officer_id, session
) -> CasePermission:
    result = await session.execute(
        select(CasePermission).where(CasePermission.permission_id == permission_id)
    )
    obj = result.scalars().first()
    if not obj:
        raise CasePermissionNotFoundError()
    obj.revoked_at = datetime.utcnow()
    obj.revoked_by = revoked_by_officer_id
    await session.flush()
    return obj

async def write_permission_audit(
    self, permission_id, case_id, officer_id, action,
    old_access_level, new_access_level, performed_by, session
) -> None:
    obj = CasePermissionAudit(
        permission_id=permission_id, case_id=case_id, officer_id=officer_id,
        action=action, old_access_level=old_access_level,
        new_access_level=new_access_level, performed_by=performed_by,
        performed_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
```

**Service** — add to `app/services/case_service.py`:

Method: `list_case_permissions(case_id, requester, session)`
1. Fetch case — 404 if not found/deleted.
2. Verify requester has admin case access OR is dept_head of case's dept OR is admin/superadmin — 403 if not.
3. Return `case_repository.list_case_permissions(case_id, session)`.

Method: `grant_case_permission(case_id, requester, data, session)`
1. Validate `data.access_level` is one of `read`, `write`, `admin` — 422 if not.
2. Fetch case — 404 if not found/deleted.
3. If `data.access_level == 'admin'`: verify requester has admin case access OR is dept_head of case's dept OR is admin/superadmin — 403 if not. For `read`/`write` grants: verify requester has admin case access OR is dept_head OR is admin/superadmin.
4. Verify target officer exists and `deleted_at IS NULL` — 404 if not.
5. Check for existing active permission via `get_active_permission(case_id, data.officer_id, session)` — raise 409 `"An active permission already exists for this officer on this case"` if found.
6. Within one transaction:
   - Call `grant_case_permission(...)`.
   - Call `write_permission_audit(permission_id, case_id, data.officer_id, 'granted', None, data.access_level, requester.officer_id, session)`.
   - Call `create_case_update(case_id, requester.officer_id, 'permission_granted', f"Access granted to Officer {data.officer_id} at level {data.access_level}", session)`.
7. Return the created permission.

Method: `revoke_case_permission(case_id, permission_id, requester, session)`
1. Fetch case — 404 if not found/deleted.
2. Verify requester has admin case access OR is dept_head of case's dept OR is admin/superadmin — 403 if not.
3. Fetch `CasePermission` by `permission_id` — 404 if not found.
4. Verify `permission.case_id == case_id` — 403 with message `"Permission does not belong to this case"` if mismatch.
5. Capture `old_access_level = permission.access_level` before revoking.
6. Within one transaction:
   - Call `revoke_case_permission(permission_id, requester.officer_id, session)`.
   - Call `write_permission_audit(permission_id, case_id, permission.officer_id, 'revoked', old_access_level, None, requester.officer_id, session)`.
   - Fetch officer name: `SELECT Person.first_name, Person.last_name FROM officer JOIN person`. Use the name in the case update.
   - Call `create_case_update(case_id, requester.officer_id, 'permission_revoked', f"Access revoked for Officer {permission.officer_id}", session)`.
7. Return 204 (no body) or the revoked permission object, per your router's `status_code`.

**Router** — add to existing case router:

```python
@router.get("/{case_id}/permissions", response_model=list[CasePermissionResponse], status_code=200, ...)
async def list_permissions(case_id, current_officer=Depends(get_current_officer), session=Depends(get_db)):
    return await case_service.list_case_permissions(case_id, current_officer, session)

@router.post("/{case_id}/permissions", response_model=CasePermissionResponse, status_code=201, ...)
async def grant_permission(case_id, data: CasePermissionGrantRequest,
                            current_officer=Depends(get_current_officer), session=Depends(get_db)):
    return await case_service.grant_case_permission(case_id, current_officer, data, session)

@router.delete("/{case_id}/permissions/{permission_id}", status_code=204, ...)
async def revoke_permission(case_id, permission_id: int,
                             current_officer=Depends(get_current_officer), session=Depends(get_db)):
    await case_service.revoke_case_permission(case_id, permission_id, current_officer, session)
```

**Migration:** No new tables needed (`case_permission` and `case_permission_audit` already exist per diagram). No migration required for this task.

**Register in main.py:** No new router file. No registration change needed.

---

### TASK D — Module 6: Interrogations (new files)

Complete all files for this task before starting Task E.

**Model** — create `app/models/interrogation.py`:

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base  # use whatever base exists

class Interrogation(Base):
    __tablename__ = "interrogation"

    interrogation_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    suspect_id = Column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    location_id = Column(Integer, ForeignKey("location.location_id"), nullable=True)
    notes = Column(Text, nullable=True)
    recording_url = Column(String(500), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    case = relationship("Case")
    suspect = relationship("Suspect")
    officer = relationship("Officer")
    location = relationship("Location")
```

Import this model in `app/models/__init__.py` (or wherever models are collected) so Alembic autogenerate can see it.

**Schema** — create `app/schemas/interrogation_schemas.py`:

```python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class InterrogationCreateRequest(BaseModel):
    suspect_id: int
    date: datetime  # validated in service: must not be in the future
    notes: Optional[str] = None
    location_id: Optional[int] = None
    recording_url: Optional[str] = Field(default=None, max_length=500)

class InterrogationResponse(BaseModel):
    interrogation_id: int
    case_id: int
    suspect_id: int
    officer_id: int
    location_id: Optional[int]
    notes: Optional[str]
    recording_url: Optional[str]
    date: datetime
    created_at: datetime
    # Denormalized display fields — populate in service from joined data:
    suspect_name: Optional[str] = None   # Person.first_name + last_name
    officer_name: Optional[str] = None
    location_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
```

**Repository** — create `app/repositories/interrogation_repository.py`:

```python
class InterrogationRepository:
    async def create_interrogation(self, case_id, suspect_id, officer_id, date,
                                    notes, location_id, recording_url, session) -> Interrogation:
        obj = Interrogation(
            case_id=case_id, suspect_id=suspect_id, officer_id=officer_id,
            date=date, notes=notes, location_id=location_id,
            recording_url=recording_url, created_at=datetime.utcnow(),
        )
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj

    async def list_by_case(self, case_id, suspect_id_filter, page, size, session):
        q = select(Interrogation).where(
            Interrogation.case_id == case_id,
            Interrogation.deleted_at.is_(None),
        )
        if suspect_id_filter:
            q = q.where(Interrogation.suspect_id == suspect_id_filter)
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        rows = (await session.execute(q.offset((page-1)*size).limit(size))).scalars().all()
        return rows, total

    async def get_by_id(self, interrogation_id, session) -> Interrogation | None:
        result = await session.execute(
            select(Interrogation).where(
                Interrogation.interrogation_id == interrogation_id,
                Interrogation.deleted_at.is_(None),
            )
        )
        return result.scalars().first()
```

**Service** — create `app/services/interrogation_service.py`:

Method: `create_interrogation(case_id, requester, data, session)`

1. Fetch case — 404 if not found/deleted.
2. Check write access via `check_case_access(requester, case, 'write')` — 403 if denied.
3. If case is closed — raise 409 `"Cannot record an interrogation on a closed case"`.
4. Verify `data.suspect_id` references an active `Suspect` (`deleted_at IS NULL`) — raise 404 `"Suspect not found"` if not.
5. Verify suspect is linked to this case: `SELECT 1 FROM case_suspects WHERE case_id = ? AND suspect_id = ?` — raise 422 `"Suspect is not linked to this case. Link the suspect to the case before recording an interrogation."` if not found.
6. Validate `data.date` is not in the future (compare against `datetime.utcnow()`) — raise 422 `"Interrogation date cannot be in the future"` if it is.
7. If `data.location_id` provided: verify `Location` exists — raise 404 `"Location not found"` if not.
8. Within one transaction:
   - Call `interrogation_repository.create_interrogation(...)`.
   - Fetch `Officer` + `Person` for requester to get name string.
   - Call `case_repository.create_case_update(case_id, requester.officer_id, 'interrogation_recorded', f"Interrogation of Suspect #{data.suspect_id} recorded by Officer {officer_name} on {data.date.date()}", session)`.
9. Build and return `InterrogationResponse` — join suspect person name, officer name, location name if present.

Method: `list_interrogations(case_id, requester, suspect_id_filter, page, size, session)`

1. Fetch case — 404 if not found/deleted.
2. Check read access — 403 if denied.
3. Call `interrogation_repository.list_by_case(case_id, suspect_id_filter, page, size, session)`.
4. For each result: join suspect→person, officer→person, location for display names.
5. Return paginated response.

**Router** — create `app/routers/interrogation_router.py`:

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional

router = APIRouter(prefix="/cases/{case_id}/interrogations", tags=["Investigation"])

@router.post("", response_model=InterrogationResponse, status_code=201,
             summary="Record a formal interrogation")
async def create_interrogation(
    case_id: int,
    data: InterrogationCreateRequest,
    current_officer = Depends(get_current_officer),
    session = Depends(get_db),
):
    return await interrogation_service.create_interrogation(case_id, current_officer, data, session)

@router.get("", response_model=PaginatedResponse[InterrogationResponse], status_code=200,
            summary="List interrogations for a case")
async def list_interrogations(
    case_id: int,
    suspect_id: Optional[int] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer = Depends(get_current_officer),
    session = Depends(get_db),
):
    return await interrogation_service.list_interrogations(
        case_id, current_officer, suspect_id, page, size, session
    )
```

Use the exact `PaginatedResponse` wrapper class name you confirmed during the scan.

**Migration** — create a new Alembic revision file:
- Name: `add_interrogation_table`
- Chain from current head.
- Check existing migrations: if `interrogation` table already exists anywhere, only add missing columns. If absent, create the full table.
- Create indexes: `idx_interrogation_case`, `idx_interrogation_suspect`.
- Write complete `downgrade()` that drops indexes then table.
- Reference all FK types as `sa.Integer()` and all enum columns with `create_type=False` matching existing migration style.

**Register in main.py** — add immediately after writing the router:
```python
from app.routers.interrogation_router import router as interrogation_router
app.include_router(interrogation_router, prefix="", tags=["Investigation"])
# (prefix is empty because the router already has /cases/{case_id}/interrogations)
```
Match the exact `include_router` style used in the existing file.

---

### TASK E — Module 6: Arrests (new files)

Complete after Task D is fully done.

**Model** — create `app/models/arrest.py`:

```python
class Arrest(Base):
    __tablename__ = "arrest"

    arrest_id = Column(Integer, primary_key=True, autoincrement=True)
    suspect_id = Column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=True)
    booking_number = Column(String(100), unique=True, nullable=True)
    location_id = Column(Integer, ForeignKey("location.location_id"), nullable=True)
    bail_amount = Column(Numeric(12, 2), nullable=True)
    bail_set_at = Column(DateTime(timezone=True), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    released_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    suspect = relationship("Suspect")
    officer = relationship("Officer", foreign_keys=[officer_id])
    case = relationship("Case")
    location = relationship("Location")
```

Import in the models collection file so Alembic can see it.

**Schema** — create `app/schemas/arrest_schemas.py`:

```python
from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ArrestCreateRequest(BaseModel):
    suspect_id: int
    arrested_by_officer_id: int
    arrest_datetime: datetime          # validated in service: not in future
    case_id: Optional[int] = None
    booking_number: Optional[str] = Field(default=None, max_length=100)
    arrest_location_id: Optional[int] = None
    bail_amount: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None

class ArrestUpdateRequest(BaseModel):
    bail_amount: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None
    released_at: Optional[datetime] = None
    # All other fields are immutable — service raises 422 if any other field appears.
    # Pydantic v2: use model_validator or __init__ to reject unexpected fields,
    # OR use model_config = ConfigDict(extra='forbid') and only declare mutable fields here.
    model_config = ConfigDict(extra='forbid')

class ArrestResponse(BaseModel):
    arrest_id: int
    suspect_id: int
    officer_id: int
    case_id: Optional[int]
    booking_number: Optional[str]
    location_id: Optional[int]
    bail_amount: Optional[Decimal]
    bail_set_at: Optional[datetime]
    date: datetime
    released_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    # Denormalized display fields:
    suspect_name: Optional[str] = None
    officer_name: Optional[str] = None
    location_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
```

**Repository** — create `app/repositories/arrest_repository.py`:

```python
class ArrestRepository:
    async def create_arrest(self, data: ArrestCreateRequest, created_by_officer_id: int,
                             session: AsyncSession) -> Arrest:
        obj = Arrest(
            suspect_id=data.suspect_id,
            officer_id=data.arrested_by_officer_id,
            case_id=data.case_id,
            booking_number=data.booking_number,
            location_id=data.arrest_location_id,
            bail_amount=data.bail_amount,
            date=data.arrest_datetime,
            notes=data.notes,
            created_at=datetime.utcnow(),
        )
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj

    async def get_by_id(self, arrest_id: int, session: AsyncSession) -> Arrest | None:
        result = await session.execute(
            select(Arrest).where(Arrest.arrest_id == arrest_id, Arrest.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def list_by_case(self, case_id: int, page: int, size: int,
                            session: AsyncSession) -> tuple[list[Arrest], int]:
        q = select(Arrest).where(Arrest.case_id == case_id, Arrest.deleted_at.is_(None))
        total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar()
        rows = (await session.execute(q.offset((page-1)*size).limit(size))).scalars().all()
        return rows, total

    async def update_arrest(self, arrest: Arrest, data: ArrestUpdateRequest,
                             session: AsyncSession) -> Arrest:
        if data.bail_amount is not None:
            arrest.bail_amount = data.bail_amount
        if data.notes is not None:
            arrest.notes = data.notes
        if data.released_at is not None:
            arrest.released_at = data.released_at
        arrest.updated_at = datetime.utcnow()
        await session.flush()
        await session.refresh(arrest)
        return arrest

    async def soft_delete(self, arrest: Arrest, session: AsyncSession) -> None:
        arrest.deleted_at = datetime.utcnow()
        await session.flush()

    async def get_by_booking_number(self, booking_number: str,
                                     session: AsyncSession) -> Arrest | None:
        result = await session.execute(
            select(Arrest).where(Arrest.booking_number == booking_number)
        )
        return result.scalars().first()

    async def suspect_linked_to_case(self, case_id: int, suspect_id: int,
                                      session: AsyncSession) -> bool:
        result = await session.execute(
            select(CaseSuspects).where(
                CaseSuspects.case_id == case_id,
                CaseSuspects.suspect_id == suspect_id,
            )
        )
        return result.scalars().first() is not None

    async def link_suspect_to_case(self, case_id: int, suspect_id: int,
                                    added_by: int, session: AsyncSession) -> None:
        obj = CaseSuspects(case_id=case_id, suspect_id=suspect_id,
                           added_by=added_by, added_at=datetime.utcnow())
        session.add(obj)
        await session.flush()
```

**Service** — create `app/services/arrest_service.py`:

Method: `create_arrest(requester, data: ArrestCreateRequest, session)`

Role check (before any DB access):
- Requester must be `investigator`, `department_head`, `admin`, or `superadmin`. Raise 403 if `readonly`, `forensic`, or `legal_officer`.

Logic:
1. Verify `data.arrest_datetime` is not in the future — raise 422 `"Arrest date cannot be in the future"`.
2. Verify `data.suspect_id` active — 404 if not.
3. Verify officer with `data.arrested_by_officer_id` active — 404 `"Arresting officer not found"` if not.
4. If `data.arrest_location_id`: verify Location exists — 404 if not.
5. If `data.booking_number`: call `arrest_repository.get_by_booking_number(...)` — raise 409 `"Booking number already assigned to another arrest"` if found.
6. If `data.case_id`:
   - Fetch case — 404 if not found/deleted.
   - Verify requester has write case access via `check_case_access(requester, case, 'write')` — 403 if denied.
7. Within one transaction:
   - Call `arrest_repository.create_arrest(data, requester.officer_id, session)`.
   - If `data.case_id`:
     - If suspect not already linked: call `arrest_repository.link_suspect_to_case(data.case_id, data.suspect_id, requester.officer_id, session)`.
     - Call `case_repository.create_case_update(data.case_id, requester.officer_id, 'arrest_recorded', f"Arrest recorded for Suspect #{data.suspect_id}", session)`.
8. Build and return `ArrestResponse` with joined display names.

Method: `get_arrest(arrest_id, requester, session)`

1. Fetch arrest — 404 if not found/deleted.
2. Requester role must be `investigator`, `department_head`, `admin`, or `superadmin` — 403 otherwise.
3. If `arrest.case_id is not None`: verify case read access — 403 if denied (unless admin/superadmin or dept_head of case's dept).
4. Return `ArrestResponse` with joined names.

Method: `list_arrests_for_case(case_id, requester, page, size, session)`

1. Fetch case — 404 if not found/deleted.
2. Check read access — 403 if denied.
3. Call `arrest_repository.list_by_case(case_id, page, size, session)`.
4. Return paginated response.

Method: `update_arrest(arrest_id, requester, data: ArrestUpdateRequest, session)`

Role check: `investigator`, `department_head`, `admin`, `superadmin` — 403 otherwise.

Logic:
1. Fetch arrest — 404 if not found/deleted.
2. If arrest has a `case_id`: verify write access — 403 if denied.
3. If `data.released_at` is set:
   - Verify `data.released_at >= arrest.date` — raise 422 `"Release date cannot be before arrest date"`.
   - Verify `arrest.released_at is None` — raise 409 `"Arrest already has a release date recorded"` if already set.
4. Call `arrest_repository.update_arrest(arrest, data, session)`.
5. Return updated `ArrestResponse`.

Method: `delete_arrest(arrest_id, requester, session)`

Role check: `admin` or `superadmin` only — 403 otherwise.

Logic:
1. Fetch arrest — 404 if not found/deleted.
2. Call `arrest_repository.soft_delete(arrest, session)`.
3. Return None (204).

**Router** — create `app/routers/arrest_router.py`:

```python
from fastapi import APIRouter, Depends, Query

arrests_router = APIRouter(prefix="/arrests", tags=["Investigation"])
case_arrests_router = APIRouter(prefix="/cases/{case_id}/arrests", tags=["Investigation"])

@arrests_router.post("", response_model=ArrestResponse, status_code=201,
                     summary="Record a new arrest")
async def create_arrest(data: ArrestCreateRequest,
                         current_officer=Depends(get_current_officer),
                         session=Depends(get_db)):
    return await arrest_service.create_arrest(current_officer, data, session)

@arrests_router.get("/{arrest_id}", response_model=ArrestResponse, status_code=200,
                    summary="Get a single arrest by ID")
async def get_arrest(arrest_id: int, current_officer=Depends(get_current_officer),
                      session=Depends(get_db)):
    return await arrest_service.get_arrest(arrest_id, current_officer, session)

@arrests_router.patch("/{arrest_id}", response_model=ArrestResponse, status_code=200,
                       summary="Update mutable arrest fields")
async def update_arrest(arrest_id: int, data: ArrestUpdateRequest,
                         current_officer=Depends(get_current_officer),
                         session=Depends(get_db)):
    return await arrest_service.update_arrest(arrest_id, current_officer, data, session)

@arrests_router.delete("/{arrest_id}", status_code=204, summary="Soft-delete an arrest")
async def delete_arrest(arrest_id: int, current_officer=Depends(get_current_officer),
                         session=Depends(get_db)):
    await arrest_service.delete_arrest(arrest_id, current_officer, session)

@case_arrests_router.get("", response_model=PaginatedResponse[ArrestResponse], status_code=200,
                          summary="List arrests for a case")
async def list_case_arrests(case_id: int, page: int = Query(1, ge=1),
                             size: int = Query(20, ge=1, le=100),
                             current_officer=Depends(get_current_officer),
                             session=Depends(get_db)):
    return await arrest_service.list_arrests_for_case(case_id, current_officer, page, size, session)
```

**Migration** — create a new Alembic revision file:
- Name: `add_arrest_interrogation_indexes` (or `add_arrest_table` if arrest table is also missing).
- Chain from the interrogation migration (Task D) as `down_revision`.
- Check existing migrations: if `arrest` table already exists (it may — the core logic doc shows `ALTER TABLE Arrest ADD COLUMN released_at` was a v3 addition), only add missing columns. If absent, create the full table.
- Check for `booking_number` unique constraint — add `uq_arrest_booking` if not present.
- Create indexes: `idx_arrest_case`, `idx_arrest_suspect`, `idx_arrest_deleted`, `idx_arrest_released`.
- Write complete `downgrade()` reversing all additions in reverse order.

**Register in main.py** — add both routers:

```python
from app.routers.arrest_router import arrests_router, case_arrests_router
app.include_router(arrests_router)
app.include_router(case_arrests_router)
```

Match the exact `include_router` call style (with or without explicit `prefix=` and `tags=`) used in the existing file. If existing routers declare prefix in `include_router` rather than in the `APIRouter()` constructor, move the prefix there.

---

## SECTION 5 — PERMISSIONS QUICK REFERENCE TABLE

| Endpoint | Minimum Permission Required |
|---|---|
| `POST /cases/{case_id}/updates` | write case access OR lead_investigator OR dept_head (own dept) OR admin/superadmin |
| `GET /cases/{case_id}/reports` | read case access |
| `POST /cases/{case_id}/reports` | write case access OR lead_investigator OR dept_head (own dept) OR admin/superadmin |
| `GET /cases/{case_id}/permissions` | admin case access OR dept_head (own dept) OR admin/superadmin |
| `POST /cases/{case_id}/permissions` | admin case access OR dept_head (own dept) OR admin/superadmin |
| `DELETE /cases/{case_id}/permissions/{permission_id}` | admin case access OR dept_head (own dept) OR admin/superadmin |
| `POST /cases/{case_id}/interrogations` | write case access OR lead_investigator OR dept_head (own dept) OR admin/superadmin |
| `GET /cases/{case_id}/interrogations` | read case access |
| `POST /arrests` | system role: investigator, dept_head, admin, or superadmin; PLUS write case access if case_id provided |
| `GET /arrests/{arrest_id}` | system role: investigator+; PLUS read case access if case_id on arrest is non-null (unless admin/superadmin) |
| `GET /cases/{case_id}/arrests` | read case access |
| `PATCH /arrests/{arrest_id}` | system role: investigator+; PLUS write case access if case_id non-null (unless admin/superadmin) |
| `DELETE /arrests/{arrest_id}` | admin or superadmin only |

`check_case_access` grants access automatically for `admin` and `superadmin` regardless of `Case_Permission` rows. `department_head` passes automatically if `case.department_id == requester.department_id`. Never re-implement this logic inline — always call the existing function.

---

## SECTION 6 — AUDIT & TRANSACTION RULES

### Append-only tables
`Case_Update`, `Chain_of_Custody`, `Officer_History`, `Person_History`, `Evidence_History` — these have DB-level triggers that reject `UPDATE` and `DELETE`. **Only INSERT.** Never call `.update()` or `session.delete()` on these objects.

### Mandatory Case_Update inserts
Every one of these operations MUST insert a `Case_Update` row **in the same transaction** as the primary operation. If the primary insert fails and rolls back, the `Case_Update` must also roll back.

| Operation | update_type value | Description string |
|---|---|---|
| Manual note posted | `'note'` | The submitted description verbatim |
| Report filed | `'report_filed'` | `f"Formal {report_type} report filed by Officer {officer_id}"` |
| Permission granted | `'permission_granted'` | `f"Access granted to Officer {officer_id} at level {access_level}"` |
| Permission revoked | `'permission_revoked'` | `f"Access revoked for Officer {officer_id}"` |
| Interrogation recorded | `'interrogation_recorded'` | `f"Interrogation of Suspect #{suspect_id} recorded by Officer {officer_name} on {date}"` |
| Arrest recorded (with case_id) | `'arrest_recorded'` | `f"Arrest recorded for Suspect #{suspect_id}"` |

### Mandatory Case_Permission_Audit inserts
On every permission grant AND revoke: insert one `CasePermissionAudit` row capturing: `permission_id`, `case_id`, `officer_id`, `action` (`'granted'` or `'revoked'`), `old_access_level`, `new_access_level`, `performed_by`, `performed_at`. On grant: `old_access_level = None`. On revoke: `new_access_level = None`.

### Transaction wrapping
Multi-table operations (e.g., arrest + case_suspects link + case_update) must be wrapped in a single transaction. Use whatever pattern the codebase confirms — `async with session.begin():` block, or `session.add()` + `await session.commit()` at the end of the service method, or a `begin_nested()` savepoint pattern. Match exactly what you found in the scan. Do not mix patterns.

---

## SECTION 7 — ROUTE REGISTRATION

After completing each task's router file, immediately open `app/main.py` and add the `include_router` call before moving to the next task. Do not batch all registrations at the end.

Rules for registration:
- Match the exact format of existing `include_router` calls in the file.
- If existing routers use `prefix=` in `include_router`, do the same. If they declare prefix inside `APIRouter(prefix=...)`, do the same.
- For `arrest_router.py`: two separate routers must be registered — one for `/arrests/*` and one for `/cases/{case_id}/arrests`. Register both.
- `tags=` must match the string used in the router's `APIRouter(tags=[...])` declaration.
- After adding each registration, confirm the file parses by reviewing the import block — ensure the import path matches the actual file path you created.

---

## SECTION 8 — HTTP STATUS CODE REFERENCE

| Situation | Status Code |
|---|---|
| Successful resource creation | 201 |
| Successful GET or PATCH (returns body) | 200 |
| Successful soft delete (no body) | 204 |
| Resource not found (or soft-deleted) | 404 |
| Field validation / immutable field / invalid enum value / date in future | 422 |
| Not authenticated | 401 |
| Permission denied (role or case access) | 403 |
| Business rule conflict (duplicate, already released, active resource blocking action) | 409 |

---

## SECTION 9 — MIGRATION CHECKLIST

Before writing any migration file, perform this exact sequence:

1. **List** all files in `alembic/versions/`. Note the filename of the current head (highest revision, or the one with no other migration pointing to it as `down_revision`).
2. **Open** the two most recent migration files. Record: the `down_revision` chain, the import block (what is imported from `alembic`, `sqlalchemy`, etc.), and how existing enum types are referenced.
3. **Search** all migration files for the strings `"report"`, `"interrogation"`, `"arrest"` — check whether `op.create_table('report', ...)` or equivalent appears. If a table already exists in migrations, do NOT recreate it. Add only missing columns via `op.add_column()`.
4. **Search** for index names `idx_report_case`, `idx_interrogation_case`, `idx_interrogation_suspect`, `idx_arrest_case`, `idx_arrest_suspect`, `idx_arrest_deleted`, `idx_arrest_released`, `uq_arrest_booking` — skip creation of any that already exist.
5. **Generate** a new revision file for Task D (`add_interrogation_table`) and a separate one for Task E (`add_arrest_table`), or one combined file (`add_investigation_module`) — your choice, but each must be a valid Alembic revision with a unique `revision` ID, correct `down_revision`, and both `upgrade()` and `downgrade()` fully written.
6. `upgrade()` structure:
   - `op.create_table(...)` for each missing table (with all columns exactly matching Section 3).
   - `op.create_index(...)` for each missing index.
   - `op.create_unique_constraint(...)` for `uq_arrest_booking` on `arrest.booking_number`.
7. `downgrade()` structure — reverse order:
   - `op.drop_constraint(...)` for unique constraints.
   - `op.drop_index(...)` for each index created in `upgrade()`.
   - `op.drop_table(...)` for each table created in `upgrade()`.
8. **Enum columns**: reference existing enum types with `create_type=False`. Example: `sa.Column('access_level', sa.Enum('read', 'write', 'admin', name='accesslevelenum', create_type=False))`. Match the exact enum name strings to what is confirmed in existing migrations.

---

## SECTION 10 — PROHIBITED ANTI-PATTERNS

These are explicit failure modes. If you find yourself doing any of the following, stop and correct course before proceeding.

1. **Business logic in a router function.** Routers contain only: dependency injection, calling one service method, returning the result. Validation and business rules belong in the service.
2. **Database queries in a service.** Services call repository methods. Services never call `session.execute(...)` directly. The only exception is looking up a join for a display name that the repository did not return — in that case, add a repository method instead.
3. **Raw SQL via `text(...)`**. All queries use SQLAlchemy ORM (`select(Model).where(...)`). No exceptions.
4. **Importing from a module that does not yet exist.** If file A imports from file B, create file B first.
5. **Creating a variant of `get_current_officer`**. One dependency, used everywhere, unchanged.
6. **Updating or deleting from `Case_Update`, `Chain_of_Custody`, `Officer_History`, `Person_History`, `Evidence_History`**. These are append-only. The database will reject it anyway — do not attempt it.
7. **Checking permissions inside a repository method.** Permission checks belong in the service layer only. Repositories are blind to who is calling them.
8. **Using synchronous SQLAlchemy** (`session.query(Model).filter(...).first()`). All database access must be async: `await session.execute(select(Model).where(...))`.
9. **Registering a router in the router file but not in `main.py`**. Every new router file must have a corresponding `include_router` call in `main.py`.
10. **Recreating an existing enum type in a migration.** Enum types (`accesslevelenum`, etc.) already exist in the database. Using `create_type=True` or `CREATE TYPE` for them will cause a migration failure on apply.

---

## SECTION 11 — COMPLETION CHECKLIST

Verify each item before marking a task complete. Do not proceed to the next task until all items for the current task are checked.

### Task A — POST /cases/{case_id}/updates
- [ ] `create_case_update` method added to case repository — async, no business logic
- [ ] `add_manual_case_update` method added to case service — validates `update_type == 'note'` and case not closed
- [ ] `CaseUpdateCreateRequest` and `CaseUpdateResponse` schemas exist
- [ ] `POST /{case_id}/updates` route added to existing case router — status 201, correct `response_model`, `Depends(get_current_officer)`, write access check
- [ ] No migration needed (table exists) — confirmed
- [ ] Route is part of existing case router — no new `main.py` registration needed — confirmed

### Task B — GET + POST /cases/{case_id}/reports
- [ ] `Report` ORM model created with all columns from Section 3
- [ ] `Report` model imported in models collection
- [ ] Relationship `Case.reports` added to Case model
- [ ] `ReportCreateRequest` and `ReportResponse` schemas exist
- [ ] `create_report`, `list_reports_by_case`, `get_final_report_by_case` added to case repository
- [ ] `create_case_report` and `list_case_reports` added to case service
- [ ] `final` report uniqueness check: 409 if existing final report found
- [ ] `CaseUpdate` inserted in same transaction as Report insert
- [ ] `GET /{case_id}/reports` route added — read access, paginated
- [ ] `POST /{case_id}/reports` route added — write access, status 201
- [ ] Alembic migration created for `report` table (if missing) and `idx_report_case`
- [ ] Migration has complete `downgrade()`

### Task C — Case Permissions endpoints
- [ ] `CasePermissionGrantRequest` and `CasePermissionResponse` schemas exist
- [ ] `list_case_permissions`, `get_active_permission`, `grant_case_permission`, `revoke_case_permission`, `write_permission_audit` added to case repository
- [ ] `list_case_permissions`, `grant_case_permission`, `revoke_case_permission` service methods added
- [ ] Duplicate active permission → 409 check present
- [ ] `permission.case_id == case_id` cross-case check → 403 present in revoke
- [ ] `CasePermissionAudit` row written on every grant and revoke
- [ ] `CaseUpdate` row written on every grant and revoke (same transaction)
- [ ] `GET /{case_id}/permissions` route — admin case access or dept_head or admin/superadmin
- [ ] `POST /{case_id}/permissions` route — same access
- [ ] `DELETE /{case_id}/permissions/{permission_id}` route — same access, status 204
- [ ] No migration needed (tables exist) — confirmed

### Task D — POST + GET /cases/{case_id}/interrogations
- [ ] `app/models/interrogation.py` created with all columns from Section 3
- [ ] `Interrogation` model imported in models collection
- [ ] `app/schemas/interrogation_schemas.py` created with `InterrogationCreateRequest` and `InterrogationResponse`
- [ ] `app/repositories/interrogation_repository.py` created with `create_interrogation`, `list_by_case`, `get_by_id`
- [ ] `app/services/interrogation_service.py` created with `create_interrogation`, `list_interrogations`
- [ ] Suspect-not-linked → 422 check present
- [ ] Suspect soft-deleted → 404 check present
- [ ] Date in future → 422 check present
- [ ] Case closed → 409 check present
- [ ] `CaseUpdate` inserted in same transaction as Interrogation
- [ ] `app/routers/interrogation_router.py` created with `POST` (201) and `GET` (200) routes
- [ ] Alembic migration created for `interrogation` table (if missing) and indexes
- [ ] Migration has complete `downgrade()`
- [ ] `interrogation_router` registered in `app/main.py`

### Task E — Arrests endpoints
- [ ] `app/models/arrest.py` created with all columns from Section 3 including `released_at`, `bail_set_at`, `booking_number`
- [ ] `Arrest` model imported in models collection
- [ ] `app/schemas/arrest_schemas.py` created with `ArrestCreateRequest` (extra fields forbidden), `ArrestUpdateRequest` (only `bail_amount`, `notes`, `released_at`; extra='forbid'), `ArrestResponse`
- [ ] `app/repositories/arrest_repository.py` created with all methods listed in Section 4 Task E
- [ ] `app/services/arrest_service.py` created with `create_arrest`, `get_arrest`, `list_arrests_for_case`, `update_arrest`, `delete_arrest`
- [ ] Role check (investigator+) enforced at start of create/update/get service methods
- [ ] Admin/superadmin-only role check on delete
- [ ] `arrest_datetime` not in future → 422
- [ ] `booking_number` uniqueness → 409
- [ ] Case write access check when `case_id` provided
- [ ] `released_at >= arrest.date` → 422
- [ ] `released_at` already set → 409
- [ ] Suspect auto-linked to case in same transaction as arrest insert (if case_id provided and not already linked)
- [ ] `CaseUpdate` inserted when `case_id` provided
- [ ] `app/routers/arrest_router.py` created with two routers: `arrests_router` (POST, GET/{id}, PATCH/{id}, DELETE/{id}) and `case_arrests_router` (GET)
- [ ] Alembic migration for `arrest` table and all indexes (checking for pre-existing table first)
- [ ] Migration has complete `downgrade()`
- [ ] Both `arrests_router` and `case_arrests_router` registered in `app/main.py`
- [ ] Soft-delete filter (`deleted_at IS NULL`) applied on all list and get-by-id queries