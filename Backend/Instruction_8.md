# Instruction.md — CCMS Gap Implementation Guide (Phase 2)

## SECTION 1 — PREAMBLE & HARD RULES

You are continuing implementation of an existing, working FastAPI + PostgreSQL + Redis backend called CCMS (Centralized Crime Management System). The previous agent successfully implemented:
- Task A: POST /cases/{case_id}/updates
- Task B: GET + POST /cases/{case_id}/reports
- Task C: Case Permissions endpoints
- Task D: Module 6 — Interrogations
- Task E: Module 6 — Arrests

You are now implementing:
- Task F: Cases Management module completeness audit and missing endpoint fixes (PATCH /cases/{case_id}, DELETE /cases/{case_id}, POST /cases/{case_id}/officers, DELETE /cases/{case_id}/officers/{officer_id}, POST/DELETE /cases/{case_id}/suspects|victims|witnesses, GET /cases/{case_id}/timeline)
- Task G: Module 7 — Legal (Court Cases, Charges, Sentences)

**Absolute non-negotiable rules. Violation of any of these is a critical error:**

1. **No test files.** Do not create any file in a `tests/` directory or named `test_*.py`.
2. **No refactoring.** Do not modify any existing working endpoint, service method, repository method, or model unless this file explicitly instructs you to add to that file.
3. **No new auth dependencies.** Reuse `get_current_officer` exactly as it exists. Do not create any wrapper, variant, or alternative.
4. **No new pagination utilities.** Reuse the existing pagination class and response wrapper exactly as found in the codebase.
5. **No new base exception classes.** Reuse the existing exception hierarchy exactly as found in `app/core/exceptions.py`.
6. **No synchronous DB access.** Every database call must use `await session.execute(select(...))` or similar async ORM calls. Never use `session.query(...)`.
7. **No stub functions or TODO comments.** Every method you write must be fully implemented. If you write a function signature, the body must be complete.
8. **No migrations that touch confirmed-existing tables beyond adding missing columns.** Do not recreate or drop tables confirmed to exist. Use `op.add_column()` only for missing columns. Check before writing.
9. **No raw SQL.** Use SQLAlchemy ORM exclusively. No `text(...)`, no `op.execute("SELECT ...")` for data manipulation.
10. **No new router registered only at end.** Register each new router in `app/main.py` immediately after completing that task, before starting the next task.
11. **Read before you write.** Open every file you will modify before writing a single line. Confirm what already exists. Do not assume.
12. **No duplicating what already exists.** If a method, class, schema, or route already exists in a file, do not re-add it. Add only what is missing.

---

## SECTION 2 — MANDATORY CODEBASE SCAN BEFORE ANY CODE

Perform this scan **before writing a single line of new code**. This is not optional.

### Step 1 — Confirm what the previous agent built

Open and read each of these files fully:
- `app/models/case.py` (or wherever the Case ORM model lives) — note every column, relationship, and whether `Report`, `Interrogation` relationships were added
- `app/models/report.py` (if it exists as a separate file)
- `app/models/interrogation.py`
- `app/models/arrest.py`
- `app/repositories/case_repository.py` — list every method that currently exists
- `app/services/case_service.py` — list every method that currently exists
- `app/routers/case_router.py` (or the equivalent case router file) — list every route that currently exists
- `app/routers/interrogation_router.py`
- `app/routers/arrest_router.py`
- `app/main.py` — list all `include_router` calls currently present

Write a summary of what exists before proceeding. This summary guides everything below.

### Step 2 — Confirm exception classes

Open `app/core/exceptions.py`. Record the **exact class name** for each of:
- 404 Not Found exception (e.g. `ResourceNotFoundError`, `CaseNotFoundError`, or a generic one)
- 403 Forbidden exception
- 409 Conflict exception
- 422 Unprocessable Entity / Validation exception
- Any domain-specific ones already defined (e.g. `CaseNotFoundError`, `OfficerNotFoundError`)

You will reuse these. Do not create new base classes.

### Step 3 — Confirm pagination

Open the file that defines the pagination wrapper (likely `app/core/pagination.py` or `app/schemas/common.py` or similar). Record:
- Exact class name of the paginated response wrapper (e.g. `PaginatedResponse`, `PagedResponse`)
- Exact constructor or factory pattern used to build one from a list and total count

### Step 4 — Confirm check_case_access

Open `app/core/permissions.py` or `app/core/security.py` (whichever contains `check_case_access`). Record:
- Exact function signature (parameters, types, whether it is async or sync)
- What it returns or raises on denied access — does it raise an exception or return bool?
- Whether it accepts `minimum_level` as a string or an enum

You will call this function verbatim in every service method that requires case access.

### Step 5 — Confirm get_db dependency

Open `app/core/dependencies.py` or wherever `get_db` is defined. Record the exact import path and function signature.

### Step 6 — Alembic migrations audit

List all files in `alembic/versions/`. Open the two most recent files. Record:
- Current head revision ID (the revision with no other migration pointing to it as `down_revision`)
- How enum columns are referenced in migrations (`sa.Enum(..., name='enumname', create_type=False)` or another pattern)
- The standard import block at the top of migration files
- Whether the `report` table, `interrogation` table, `arrest` table, `court_case` table, `charge` table, `sentence` table appear anywhere in existing migrations

### Step 7 — Confirm existing models collection

Open `app/models/__init__.py` (or wherever models are imported for Alembic). Note what is imported and what format is used. You will add new models here.

### Step 8 — Confirm case-related model names and relationships

Open the Case ORM model file. Note:
- The exact class name used for `Case`
- Whether `CaseUpdate`, `CasePermission`, `CasePermissionAudit`, `CaseSuspects`, `CaseVictims`, `CaseWitnesses`, `CaseOfficers` are already defined as models (they should be — they were existing tables)
- Whether any of those junction/association models exist as ORM classes you can import
- The exact `__tablename__` strings used

### Step 9 — Confirm role names

Open any existing service (e.g. `app/services/case_service.py`) to see how role names are compared. Note:
- Are roles compared as strings (e.g. `officer.role_name == 'admin'`) or via an enum?
- What attribute on the officer object holds the role (`role_name`, `role`, `role.role_name`)?

### Step 10 — Mental model summary

Before writing any new code, write the following as a comment block at the top of the first new file you create (then delete it before saving the final version):

```
# MENTAL MODEL:
# Session injection pattern: [exact pattern]
# Pagination class name: [exact class name]
# Paginated response builder: [how to construct one]
# 404 exception class: [exact name]
# 403 exception class: [exact name]
# 409 exception class: [exact name]
# 422 exception class: [exact name]
# CaseNotFoundError class: [exact name or same as 404 base]
# check_case_access signature: [exact signature]
# check_case_access raises on failure: [exception class name or bool]
# Officer role attribute: [officer.role_name or officer.role.role_name]
# Role comparison style: [string literal or enum]
# Soft-delete filter: [exact ORM expression]
# Transaction pattern: [async with session.begin() / session.add+flush+commit / other]
# Enum import style in migrations: [exact pattern from scan]
# Current alembic head revision ID: [the ID]
# Models collection file: [exact path]
# Case model class name: [exact class]
# CaseSuspects model class name: [exact class or None if not an ORM model]
```

---

## SECTION 3 — TASK F: CASES MANAGEMENT MODULE COMPLETENESS

### Goal

The previous agent added reports, permissions, updates, interrogations, and arrests — all nested under cases. However, the core case management endpoints for the case entity itself (status transitions, officer assignment, suspect/victim/witness linking, soft delete, timeline) were not yet implemented. This task adds them.

**Before writing anything for Task F:** Re-read `app/routers/case_router.py` (or the case router file). List every route currently registered. Only implement the routes listed below that are NOT already present. Do not re-implement what exists.

---

### TASK F.1 — PATCH /cases/{case_id} (update case fields and status)

**Confirm first:** If `PATCH /{case_id}` already exists in the case router, skip this task entirely.

**Repository** — add to `app/repositories/case_repository.py` only if not already present:

```python
async def get_case_by_id(self, case_id: int, session: AsyncSession) -> Case | None:
    result = await session.execute(
        select(Case).where(Case.case_id == case_id, Case.deleted_at.is_(None))
    )
    return result.scalars().first()

async def update_case(self, case: Case, session: AsyncSession) -> Case:
    await session.flush()
    await session.refresh(case)
    return case
```

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `patch_case(case_id, requester, data, session)`

Logic:
1. Fetch case via `get_case_by_id` — raise 404 if not found.
2. Check write access via `check_case_access(requester, case, 'write')` — raise 403 if denied.
3. If `data.status_id` is provided:
   - Fetch current status name and requested status name from `CaseStatus` table.
   - Validate status transition using this table (raise 422 if invalid):
     - `open` → `under_investigation` ✓
     - `under_investigation` → `referred_to_court` ✓
     - `referred_to_court` → `closed` ✓
     - `closed` → any ✗ (raise 422: `"Cannot change status of a closed case"`)
     - any → `archived` ✓ only if requester is `admin` or `superadmin` (raise 403 otherwise)
   - If transitioning to `closed`: query `Charge` table where `case_id = case_id` and `status NOT IN ('dropped', 'acquitted', 'convicted')` — raise 409 `"Cannot close case with unresolved charges"` if any found.
   - After applying the new status, insert a `CaseUpdate` row with `update_type='status_change'` and `description=f"Status changed to {new_status_name}"`.
4. Apply all other provided fields (title, description, crime_type_id, location_id) with partial update semantics — only update fields that are not None in `data`.
5. Set `case.updated_at = datetime.utcnow()` and `case.updated_by = requester.officer_id`.
6. Call `case_repository.update_case(case, session)`.
7. Return updated case.

**Schema** — add to case schemas file only if not already present:

```python
class CasePatchRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    status_id: Optional[int] = None
    crime_type_id: Optional[int] = None
    location_id: Optional[int] = None

class CaseResponse(BaseModel):
    # Match the fields of the Case ORM model exactly.
    # If CaseResponse already exists, do not redefine it.
    case_id: int
    title: str
    description: Optional[str]
    date_reported: date
    crime_type_id: int
    location_id: int
    status_id: int
    department_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)
```

**Router** — add to existing case router only if not already present:

```python
@router.patch(
    "/{case_id}",
    response_model=CaseResponse,
    status_code=200,
    summary="Update mutable case fields including status transitions",
    tags=["Cases"],
)
async def patch_case(
    case_id: int,
    data: CasePatchRequest,
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await case_service.patch_case(case_id, current_officer, data, session)
```

---

### TASK F.2 — DELETE /cases/{case_id} (soft delete)

**Confirm first:** If `DELETE /{case_id}` already exists in the case router, skip this task entirely.

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `delete_case(case_id, requester, session)`

Logic:
1. Verify requester's role is `superadmin` — raise 403 `"Only superadmins can delete cases"` if not.
2. Fetch case via `get_case_by_id` — raise 404 if not found.
3. Query `CourtCase` table where `case_id = case_id` and `verdict IS NOT NULL` — raise 409 `"Cannot delete a case with a recorded court verdict"` if found.
4. Query `Arrest` table where `case_id = case_id` and `released_at IS NULL` and `deleted_at IS NULL` — raise 409 `"Cannot delete a case with unreleased arrests"` if found.
5. Set `case.deleted_at = datetime.utcnow()`, `case.updated_at = datetime.utcnow()`.
6. Insert `CaseUpdate` with `update_type='status_change'` and `description='Case soft-deleted by superadmin'`.
7. Flush session.
8. Return None (204).

**Router** — add to existing case router only if not already present:

```python
@router.delete(
    "/{case_id}",
    status_code=204,
    summary="Soft-delete a case (superadmin only)",
    tags=["Cases"],
)
async def delete_case(
    case_id: int,
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    await case_service.delete_case(case_id, current_officer, session)
```

---

### TASK F.3 — POST /cases/{case_id}/officers (assign officer to case)

**Confirm first:** If `POST /{case_id}/officers` already exists in the case router, skip this task entirely.

You will need the `CaseOfficers` ORM model. If it does not already exist as an ORM class, add it to `app/models/case.py` (or the appropriate model file):

```python
class CaseOfficers(Base):
    __tablename__ = "case_officers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officer.officer_id"), nullable=False)
    role_in_case = Column(String(50), nullable=False)   # role_in_case_enum values as string
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    removed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_by = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)
```

**Repository** — add to `app/repositories/case_repository.py` only if not already present:

```python
async def get_case_officer_assignment(
    self, case_id: int, officer_id: int, session: AsyncSession
) -> CaseOfficers | None:
    result = await session.execute(
        select(CaseOfficers).where(
            CaseOfficers.case_id == case_id,
            CaseOfficers.officer_id == officer_id,
            CaseOfficers.removed_at.is_(None),
        )
    )
    return result.scalars().first()

async def create_case_officer(
    self, case_id: int, officer_id: int, role_in_case: str,
    assigned_by: int, session: AsyncSession
) -> CaseOfficers:
    obj = CaseOfficers(
        case_id=case_id,
        officer_id=officer_id,
        role_in_case=role_in_case,
        assigned_by=assigned_by,
        assigned_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj

async def count_lead_investigators(self, case_id: int, session: AsyncSession) -> int:
    result = await session.execute(
        select(func.count()).select_from(
            select(CaseOfficers).where(
                CaseOfficers.case_id == case_id,
                CaseOfficers.role_in_case == 'lead_investigator',
                CaseOfficers.removed_at.is_(None),
            ).subquery()
        )
    )
    return result.scalar()
```

**Schema** — add to case schemas file only if not already present:

```python
VALID_ROLES_IN_CASE = {'lead_investigator', 'co_investigator', 'support_officer', 'forensic_officer', 'supervisor'}

class AssignOfficerRequest(BaseModel):
    officer_id: int
    role_in_case: str  # validated in service

class CaseOfficerResponse(BaseModel):
    id: int
    case_id: int
    officer_id: int
    role_in_case: str
    assigned_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `assign_officer_to_case(case_id, requester, data, session)`

Logic:
1. Fetch case — raise 404 if not found.
2. Check admin case access via `check_case_access(requester, case, 'admin')` OR requester is `admin` or `superadmin` OR requester is `department_head` and `case.department_id == requester.department_id` — raise 403 if denied.
3. Validate `data.role_in_case` is one of: `lead_investigator`, `co_investigator`, `support_officer`, `forensic_officer`, `supervisor` — raise 422 if not.
4. Fetch case status — raise 409 `"Cannot assign officers to a closed case"` if status name is `closed`.
5. Verify target officer exists and `deleted_at IS NULL` — raise 404 `"Officer not found"` if not.
6. If requester is `department_head`: verify `case.department_id == requester.department_id` — raise 403 if not. Verify target officer's `department_id == requester.department_id` — raise 403 `"Department heads may only assign officers from their own department"` if not.
7. Check for existing assignment via `get_case_officer_assignment` — raise 409 `"Officer is already assigned to this case"` if found.
8. If `data.role_in_case == 'lead_investigator'`: call `count_lead_investigators` — raise 409 `"This case already has a lead investigator. Reassign the existing lead first."` if count > 0.
9. Within one transaction:
   - Call `create_case_officer(case_id, data.officer_id, data.role_in_case, requester.officer_id, session)`.
   - Call `grant_case_permission(case_id, data.officer_id, 'write', requester.officer_id, session)` — only if no active permission already exists for that officer.
   - Fetch officer name (Person join) for the update description.
   - Call `create_case_update(case_id, requester.officer_id, 'officer_assigned', f"Officer {officer_name} assigned as {data.role_in_case}", session)`.
10. Return created `CaseOfficers` object.

**Router** — add to existing case router only if not already present:

```python
@router.post(
    "/{case_id}/officers",
    response_model=CaseOfficerResponse,
    status_code=201,
    summary="Assign an officer to a case",
    tags=["Cases"],
)
async def assign_officer(
    case_id: int,
    data: AssignOfficerRequest,
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await case_service.assign_officer_to_case(case_id, current_officer, data, session)
```

---

### TASK F.4 — DELETE /cases/{case_id}/officers/{officer_id} (remove officer from case)

**Confirm first:** If `DELETE /{case_id}/officers/{officer_id}` already exists in the case router, skip this task entirely.

**Repository** — add to `app/repositories/case_repository.py` only if not already present:

```python
async def remove_case_officer(
    self, assignment: CaseOfficers, session: AsyncSession
) -> None:
    assignment.removed_at = datetime.utcnow()
    await session.flush()
```

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `remove_officer_from_case(case_id, officer_id, requester, session)`

Logic:
1. Fetch case — raise 404 if not found.
2. Check admin case access — raise 403 if denied.
3. If requester is `department_head`: verify `case.department_id == requester.department_id` — raise 403 if not. Also verify the target officer's department matches — raise 403 if not.
4. Fetch assignment via `get_case_officer_assignment(case_id, officer_id, session)` — raise 404 `"Officer is not assigned to this case"` if not found.
5. If assignment `role_in_case == 'lead_investigator'`: count remaining non-removed officers for this case. If only one officer remains (the one being removed), raise 409 `"Cannot remove the lead investigator when they are the only officer on this case"`.
6. Within one transaction:
   - Call `remove_case_officer(assignment, session)`.
   - Fetch officer name and call `create_case_update(case_id, requester.officer_id, 'officer_removed', f"Officer {officer_name} removed from case", session)`.
7. Return 204.

**Router** — add to existing case router only if not already present:

```python
@router.delete(
    "/{case_id}/officers/{officer_id}",
    status_code=204,
    summary="Remove an officer from a case",
    tags=["Cases"],
)
async def remove_officer(
    case_id: int,
    officer_id: int,
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    await case_service.remove_officer_from_case(case_id, officer_id, current_officer, session)
```

---

### TASK F.5 — POST /cases/{case_id}/suspects, /victims, /witnesses

**Confirm first:** Check if these routes exist. Skip any that already exist.

You will need `CaseSuspects`, `CaseVictims`, `CaseWitnesses` ORM models. If they do not already exist as ORM classes, add them to the appropriate model file. Match the column names from the relational diagram exactly:

```python
class CaseSuspects(Base):
    __tablename__ = "case_suspects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    suspect_id = Column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    added_by = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)

class CaseVictims(Base):
    __tablename__ = "case_victims"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    victim_id = Column(Integer, ForeignKey("victim.victim_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    added_by = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)

class CaseWitnesses(Base):
    __tablename__ = "case_witnesses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    witness_id = Column(Integer, ForeignKey("witness.witness_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    added_by = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)
```

**IMPORTANT:** These tables already exist in the database (confirmed by the relational diagram). Do NOT create a migration for them. Only create ORM models if they are missing as Python classes.

**Repository** — add to `app/repositories/case_repository.py` only if not already present:

```python
async def get_case_suspect_link(
    self, case_id: int, suspect_id: int, session: AsyncSession
) -> CaseSuspects | None:
    result = await session.execute(
        select(CaseSuspects).where(
            CaseSuspects.case_id == case_id,
            CaseSuspects.suspect_id == suspect_id,
        )
    )
    return result.scalars().first()

async def link_suspect_to_case(
    self, case_id: int, suspect_id: int, notes: str | None,
    added_by: int, session: AsyncSession
) -> CaseSuspects:
    obj = CaseSuspects(
        case_id=case_id, suspect_id=suspect_id,
        notes=notes, added_by=added_by, added_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj

async def get_case_victim_link(
    self, case_id: int, victim_id: int, session: AsyncSession
) -> CaseVictims | None:
    result = await session.execute(
        select(CaseVictims).where(
            CaseVictims.case_id == case_id,
            CaseVictims.victim_id == victim_id,
        )
    )
    return result.scalars().first()

async def link_victim_to_case(
    self, case_id: int, victim_id: int,
    added_by: int, session: AsyncSession
) -> CaseVictims:
    obj = CaseVictims(
        case_id=case_id, victim_id=victim_id,
        added_by=added_by, added_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj

async def get_case_witness_link(
    self, case_id: int, witness_id: int, session: AsyncSession
) -> CaseWitnesses | None:
    result = await session.execute(
        select(CaseWitnesses).where(
            CaseWitnesses.case_id == case_id,
            CaseWitnesses.witness_id == witness_id,
        )
    )
    return result.scalars().first()

async def link_witness_to_case(
    self, case_id: int, witness_id: int,
    added_by: int, session: AsyncSession
) -> CaseWitnesses:
    obj = CaseWitnesses(
        case_id=case_id, witness_id=witness_id,
        added_by=added_by, added_at=datetime.utcnow(),
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return obj
```

**Schema** — add to case schemas file only if not already present:

```python
class LinkSuspectRequest(BaseModel):
    suspect_id: int
    notes: Optional[str] = None

class LinkPersonRequest(BaseModel):
    # Used for both victim and witness linking
    victim_id: Optional[int] = None
    witness_id: Optional[int] = None

class CaseSuspectLinkResponse(BaseModel):
    id: int
    case_id: int
    suspect_id: int
    notes: Optional[str]
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CaseVictimLinkResponse(BaseModel):
    id: int
    case_id: int
    victim_id: int
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CaseWitnessLinkResponse(BaseModel):
    id: int
    case_id: int
    witness_id: int
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `link_suspect(case_id, requester, data, session)`
1. Fetch case — 404 if not found.
2. Check write access — 403 if denied.
3. Verify `data.suspect_id` exists and `deleted_at IS NULL` on `Suspect` table — 404 `"Suspect not found"` if not.
4. Check for existing link via `get_case_suspect_link` — 409 `"Suspect is already linked to this case"` if found.
5. Within one transaction:
   - Call `link_suspect_to_case(case_id, data.suspect_id, data.notes, requester.officer_id, session)`.
   - Call `create_case_update(case_id, requester.officer_id, 'suspect_linked', f"Suspect #{data.suspect_id} linked to case", session)`.
6. Return the created link object.

Method: `link_victim(case_id, requester, victim_id, session)`
1. Fetch case — 404 if not found.
2. Check write access — 403 if denied.
3. Verify `victim_id` exists and `deleted_at IS NULL` on `Victim` table — 404 `"Victim not found"` if not.
4. Check for existing link — 409 `"Victim is already linked to this case"` if found.
5. Within one transaction:
   - Call `link_victim_to_case(...)`.
   - Call `create_case_update(case_id, requester.officer_id, 'victim_linked', f"Victim #{victim_id} linked to case", session)`.
6. Return the created link object.

Method: `link_witness(case_id, requester, witness_id, session)`
Same pattern as `link_victim`, substituting witness.

**Router** — add to existing case router only if not already present:

```python
@router.post("/{case_id}/suspects", response_model=CaseSuspectLinkResponse, status_code=201, tags=["Cases"])
async def link_suspect(case_id: int, data: LinkSuspectRequest,
                        current_officer=Depends(get_current_officer), session=Depends(get_db)):
    return await case_service.link_suspect(case_id, current_officer, data, session)

@router.post("/{case_id}/victims", response_model=CaseVictimLinkResponse, status_code=201, tags=["Cases"])
async def link_victim(case_id: int, victim_id: int,
                       current_officer=Depends(get_current_officer), session=Depends(get_db)):
    return await case_service.link_victim(case_id, current_officer, victim_id, session)

@router.post("/{case_id}/witnesses", response_model=CaseWitnessLinkResponse, status_code=201, tags=["Cases"])
async def link_witness(case_id: int, witness_id: int,
                        current_officer=Depends(get_current_officer), session=Depends(get_db)):
    return await case_service.link_witness(case_id, current_officer, witness_id, session)
```

---

### TASK F.6 — GET /cases/{case_id}/timeline

**Confirm first:** If `GET /{case_id}/timeline` already exists in the case router, skip this task entirely.

**Repository** — add to `app/repositories/case_repository.py` only if not already present:

```python
async def list_case_timeline(
    self, case_id: int, update_type_filter: str | None,
    page: int, size: int, session: AsyncSession
) -> tuple[list[CaseUpdate], int]:
    q = select(CaseUpdate).where(CaseUpdate.case_id == case_id)
    if update_type_filter:
        q = q.where(CaseUpdate.update_type == update_type_filter)
    q = q.order_by(CaseUpdate.created_at.desc())
    total = (await session.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar()
    rows = (await session.execute(q.offset((page - 1) * size).limit(size))).scalars().all()
    return rows, total
```

**Schema** — add to case schemas file only if not already present:

```python
class CaseUpdateResponse(BaseModel):
    update_id: int
    case_id: int
    officer_id: int
    update_type: str
    description: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

(If `CaseUpdateResponse` was already created in Task A by the previous agent, do not redefine it.)

**Service** — add to `app/services/case_service.py` only if not already present:

Method: `get_case_timeline(case_id, requester, update_type_filter, page, size, session)`
1. Fetch case — 404 if not found.
2. Check read access — 403 if denied.
3. Call `case_repository.list_case_timeline(case_id, update_type_filter, page, size, session)`.
4. Return paginated response using the existing pagination wrapper.

**Router** — add to existing case router only if not already present:

```python
@router.get(
    "/{case_id}/timeline",
    response_model=PaginatedResponse[CaseUpdateResponse],
    status_code=200,
    summary="Get chronological timeline of all case updates",
    tags=["Cases"],
)
async def get_timeline(
    case_id: int,
    update_type: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer: Officer = Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await case_service.get_case_timeline(
        case_id, current_officer, update_type, page, size, session
    )
```

---

### TASK F.7 — Migration for Cases Module

**Before creating any migration for Task F:**

1. Open all files in `alembic/versions/` and search for these strings: `case_officers`, `case_suspects`, `case_victims`, `case_witnesses`. These tables already exist in the live database per the relational diagram. Do NOT create them in a migration.
2. Search for `department_id` on the `case` table. The core logic doc confirms `ALTER TABLE Case ADD COLUMN IF NOT EXISTS department_id` was a v3 addition. Check if this column already appears in an existing migration. If it does, skip it.
3. The only new columns that may be needed on existing tables based on this task are:
   - `case.updated_by` — if not already in the Case ORM model and not in existing migrations, add via `op.add_column('case', sa.Column('updated_by', sa.Integer(), sa.ForeignKey('officer.officer_id'), nullable=True))`.

**Create one new migration file only if there is at least one column confirmed missing.** Name it `add_cases_module_missing_columns`. Chain `down_revision` from the current alembic head. Write a complete `downgrade()` that reverses only what `upgrade()` adds.

If no columns are confirmed missing, do not create a migration file for Task F.

---

## SECTION 4 — TASK G: MODULE 7 — LEGAL

Complete Task F fully before starting Task G.

### Overview

Module 7 implements the legal proceedings layer: court cases, charges, and sentences. These are the final endpoints in the CCMS system. Because this is the last module, extra care must be taken to ensure:
- All imports are from files that actually exist
- All model class names match what is confirmed in the codebase scan
- All exception class names match what is confirmed in `app/core/exceptions.py`
- All role comparisons use the exact pattern confirmed during the scan
- No circular imports are introduced

---

### TASK G.1 — Models

**Check first:** Open `app/models/__init__.py` (or the models collection file). Check if `CourtCase`, `Charge`, `Sentence` ORM classes already exist anywhere. If they do, do not recreate them.

Create `app/models/legal.py`:

```python
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime,
    ForeignKey, Boolean, UniqueConstraint, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base  # use whatever base class the codebase uses — confirmed in scan

class CourtCase(Base):
    __tablename__ = "court_case"

    __table_args__ = (
        UniqueConstraint("case_id", name="uq_court_case_per_case"),
    )

    court_case_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    court_name = Column(String(255), nullable=False)
    court_reference = Column(String(100), nullable=True)
    judge_name = Column(String(255), nullable=True)
    prosecutor_name = Column(String(255), nullable=True)
    hearing_date = Column(Date, nullable=True)
    verdict = Column(String(50), nullable=True)   # verdict_enum values stored as string
    verdict_notes = Column(Text, nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    case = relationship("Case")
    charges = relationship("Charge", back_populates="court_case")


class Charge(Base):
    __tablename__ = "charge"

    charge_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case.case_id"), nullable=False)
    court_case_id = Column(Integer, ForeignKey("court_case.court_case_id"), nullable=True)
    suspect_id = Column(Integer, ForeignKey("suspect.suspect_id"), nullable=False)
    crime_type_id = Column(Integer, ForeignKey("crime_type.crime_type_id"), nullable=False)
    description = Column(Text, nullable=False)
    filed_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    filed_by = Column(Integer, ForeignKey("officer.officer_id"), nullable=True)
    status = Column(String(50), nullable=False, default='filed')
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    case = relationship("Case")
    court_case = relationship("CourtCase", back_populates="charges")
    suspect = relationship("Suspect")
    crime_type = relationship("CrimeType")  # use the exact class name from the scan
    sentence = relationship("Sentence", back_populates="charge", uselist=False)


class Sentence(Base):
    __tablename__ = "sentence"

    sentence_id = Column(Integer, primary_key=True, autoincrement=True)
    charge_id = Column(Integer, ForeignKey("charge.charge_id"), nullable=False)
    court_case_id = Column(Integer, ForeignKey("court_case.court_case_id"), nullable=False)
    description = Column(Text, nullable=False)
    duration = Column(String(100), nullable=False)
    duration_days = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    sentence_type = Column(String(100), nullable=True)
    is_suspended = Column(Boolean, nullable=True, default=False)
    sentenced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    charge = relationship("Charge", back_populates="sentence")
    court_case = relationship("CourtCase")
```

**IMPORTANT:** After creating this file, immediately add it to the models collection file (`app/models/__init__.py` or equivalent):

```python
from app.models.legal import CourtCase, Charge, Sentence
```

Also add `court_cases = relationship("CourtCase")` to the `Case` model if not already present, and `charges = relationship("Charge")` to the `Case` model if not already present. Open the Case model file, confirm what is missing, and add only what is missing.

---

### TASK G.2 — Schemas

Create `app/schemas/legal_schemas.py`:

```python
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, date


# ─── Court Case ─────────────────────────────────────────────────────────────

class CourtCaseCreateRequest(BaseModel):
    court_name: str = Field(..., min_length=1, max_length=255)
    court_reference: Optional[str] = Field(default=None, max_length=100)
    judge_name: Optional[str] = Field(default=None, max_length=255)
    prosecutor_name: Optional[str] = Field(default=None, max_length=255)
    hearing_date: Optional[date] = None  # validated in service: must be future if provided


class CourtCasePatchRequest(BaseModel):
    court_name: Optional[str] = Field(default=None, max_length=255)
    court_reference: Optional[str] = Field(default=None, max_length=100)
    judge_name: Optional[str] = Field(default=None, max_length=255)
    prosecutor_name: Optional[str] = Field(default=None, max_length=255)
    hearing_date: Optional[date] = None   # must be future if provided
    verdict: Optional[str] = None         # validated in service: guilty|not_guilty|dismissed|mistrial|pending
    verdict_notes: Optional[str] = None


class SentenceResponse(BaseModel):
    sentence_id: int
    charge_id: int
    court_case_id: int
    description: str
    duration: str
    duration_days: Optional[int]
    start_date: Optional[date]
    end_date: Optional[date]
    sentence_type: Optional[str]
    is_suspended: Optional[bool]
    sentenced_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ChargeResponse(BaseModel):
    charge_id: int
    case_id: int
    court_case_id: Optional[int]
    suspect_id: int
    crime_type_id: int
    description: str
    filed_at: datetime
    filed_by: Optional[int]
    status: str
    created_at: datetime
    sentence: Optional[SentenceResponse] = None
    model_config = ConfigDict(from_attributes=True)


class CourtCaseResponse(BaseModel):
    court_case_id: int
    case_id: int
    court_name: str
    court_reference: Optional[str]
    judge_name: Optional[str]
    prosecutor_name: Optional[str]
    hearing_date: Optional[date]
    verdict: Optional[str]
    verdict_notes: Optional[str]
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    charges: list[ChargeResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── Charges ─────────────────────────────────────────────────────────────────

class ChargeCreateRequest(BaseModel):
    suspect_id: int
    crime_type_id: int
    description: str = Field(..., min_length=1)
    court_case_id: Optional[int] = None


class ChargePatchRequest(BaseModel):
    status: str   # validated in service for valid transition


# ─── Sentences ───────────────────────────────────────────────────────────────

class SentenceCreateRequest(BaseModel):
    court_case_id: int
    description: str = Field(..., min_length=1)
    duration: str = Field(..., min_length=1)
    duration_days: Optional[int] = Field(default=None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sentence_type: Optional[str] = None
    is_suspended: Optional[bool] = False
    sentenced_at: Optional[datetime] = None
```

---

### TASK G.3 — Repositories

Create `app/repositories/legal_repository.py`:

```python
from datetime import datetime, date as date_type
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.legal import CourtCase, Charge, Sentence
# Import CaseSuspects from wherever it was confirmed to live in the codebase scan
# Import CaseUpdate from wherever it was confirmed to live in the codebase scan


class LegalRepository:

    # ─── Court Case ────────────────────────────────────────────────────────

    async def get_court_case_by_case_id(
        self, case_id: int, session: AsyncSession
    ) -> CourtCase | None:
        result = await session.execute(
            select(CourtCase).where(
                CourtCase.case_id == case_id,
                CourtCase.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def get_court_case_by_id(
        self, court_case_id: int, session: AsyncSession
    ) -> CourtCase | None:
        result = await session.execute(
            select(CourtCase).where(
                CourtCase.court_case_id == court_case_id,
                CourtCase.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def create_court_case(
        self,
        case_id: int,
        court_name: str,
        court_reference: Optional[str],
        judge_name: Optional[str],
        prosecutor_name: Optional[str],
        hearing_date: Optional[date_type],
        session: AsyncSession,
    ) -> CourtCase:
        obj = CourtCase(
            case_id=case_id,
            court_name=court_name,
            court_reference=court_reference,
            judge_name=judge_name,
            prosecutor_name=prosecutor_name,
            hearing_date=hearing_date,
            created_at=datetime.utcnow(),
        )
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj

    async def update_court_case(
        self, court_case: CourtCase, session: AsyncSession
    ) -> CourtCase:
        await session.flush()
        await session.refresh(court_case)
        return court_case

    # ─── Charges ───────────────────────────────────────────────────────────

    async def get_charge_by_id(
        self, charge_id: int, session: AsyncSession
    ) -> Charge | None:
        result = await session.execute(
            select(Charge).where(
                Charge.charge_id == charge_id,
                Charge.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def list_charges_by_case(
        self,
        case_id: int,
        suspect_id_filter: Optional[int],
        status_filter: Optional[str],
        page: int,
        size: int,
        session: AsyncSession,
    ) -> tuple[list[Charge], int]:
        q = select(Charge).where(
            Charge.case_id == case_id,
            Charge.deleted_at.is_(None),
        )
        if suspect_id_filter:
            q = q.where(Charge.suspect_id == suspect_id_filter)
        if status_filter:
            q = q.where(Charge.status == status_filter)
        total = (await session.execute(
            select(func.count()).select_from(q.subquery())
        )).scalar()
        rows = (await session.execute(
            q.offset((page - 1) * size).limit(size)
        )).scalars().all()
        return rows, total

    async def create_charge(
        self,
        case_id: int,
        court_case_id: Optional[int],
        suspect_id: int,
        crime_type_id: int,
        description: str,
        filed_by: int,
        session: AsyncSession,
    ) -> Charge:
        obj = Charge(
            case_id=case_id,
            court_case_id=court_case_id,
            suspect_id=suspect_id,
            crime_type_id=crime_type_id,
            description=description,
            filed_at=datetime.utcnow(),
            filed_by=filed_by,
            status='filed',
            created_at=datetime.utcnow(),
        )
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj

    async def update_charge_status(
        self, charge: Charge, new_status: str, session: AsyncSession
    ) -> Charge:
        charge.status = new_status
        charge.updated_at = datetime.utcnow()
        await session.flush()
        await session.refresh(charge)
        return charge

    async def drop_charge(
        self, charge: Charge, session: AsyncSession
    ) -> Charge:
        charge.status = 'dropped'
        charge.updated_at = datetime.utcnow()
        await session.flush()
        await session.refresh(charge)
        return charge

    async def count_unresolved_charges_for_case(
        self, case_id: int, session: AsyncSession
    ) -> int:
        """Count charges that are not in terminal status (dropped, acquitted, convicted)."""
        terminal = ('dropped', 'acquitted', 'convicted')
        result = await session.execute(
            select(func.count()).select_from(
                select(Charge).where(
                    Charge.case_id == case_id,
                    Charge.deleted_at.is_(None),
                    Charge.status.notin_(terminal),
                ).subquery()
            )
        )
        return result.scalar()

    async def count_unresolved_charges_for_court_case(
        self, court_case_id: int, session: AsyncSession
    ) -> int:
        terminal = ('dropped', 'acquitted', 'convicted')
        result = await session.execute(
            select(func.count()).select_from(
                select(Charge).where(
                    Charge.court_case_id == court_case_id,
                    Charge.deleted_at.is_(None),
                    Charge.status.notin_(terminal),
                ).subquery()
            )
        )
        return result.scalar()

    # ─── Sentences ─────────────────────────────────────────────────────────

    async def get_sentence_by_charge_id(
        self, charge_id: int, session: AsyncSession
    ) -> Sentence | None:
        result = await session.execute(
            select(Sentence).where(Sentence.charge_id == charge_id)
        )
        return result.scalars().first()

    async def create_sentence(
        self,
        charge_id: int,
        court_case_id: int,
        description: str,
        duration: str,
        duration_days: Optional[int],
        start_date: Optional[date_type],
        end_date: Optional[date_type],
        sentence_type: Optional[str],
        is_suspended: Optional[bool],
        sentenced_at: Optional[datetime],
        session: AsyncSession,
    ) -> Sentence:
        obj = Sentence(
            charge_id=charge_id,
            court_case_id=court_case_id,
            description=description,
            duration=duration,
            duration_days=duration_days,
            start_date=start_date,
            end_date=end_date,
            sentence_type=sentence_type,
            is_suspended=is_suspended,
            sentenced_at=sentenced_at or datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj

    # ─── Case Suspect Link Check (used by Charge service) ──────────────────

    async def suspect_linked_to_case(
        self, case_id: int, suspect_id: int, session: AsyncSession
    ) -> bool:
        """
        Import CaseSuspects from wherever it is confirmed to live.
        Use the exact model class name from the codebase scan.
        """
        # Replace CaseSuspects with the exact ORM class name found in the scan.
        result = await session.execute(
            select(CaseSuspects).where(
                CaseSuspects.case_id == case_id,
                CaseSuspects.suspect_id == suspect_id,
            )
        )
        return result.scalars().first() is not None
```

**CRITICAL NOTE on `CaseSuspects` import in this file:** During your codebase scan you confirmed the exact ORM class name and file for `CaseSuspects`. Import it from that exact location. Do not guess. If it is `app.models.case.CaseSuspects`, import from there.

---

### TASK G.4 — Services

Create `app/services/legal_service.py`:

```python
from datetime import datetime, date as date_type
from typing import Optional
import os

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.legal_repository import LegalRepository
from app.repositories.case_repository import CaseRepository
# Import check_case_access from wherever it was confirmed during the scan
# Import the pagination wrapper class from wherever it was confirmed
# Import exception classes from app.core.exceptions — use exact names from scan

legal_repository = LegalRepository()
case_repository = CaseRepository()

VALID_VERDICTS = {'guilty', 'not_guilty', 'dismissed', 'mistrial', 'pending'}
TERMINAL_VERDICTS = {'guilty', 'not_guilty', 'dismissed'}

VALID_CHARGE_STATUSES = {'filed', 'pending', 'dismissed', 'convicted', 'acquitted', 'appealed'}
TERMINAL_CHARGE_STATUSES = {'convicted', 'acquitted', 'dropped'}

# Valid status transitions for charges
CHARGE_TRANSITIONS = {
    'filed': {'pending', 'dismissed'},
    'pending': {'dropped', 'convicted', 'acquitted'},
    'dismissed': set(),
    'convicted': set(),
    'acquitted': set(),
    'dropped': set(),
    'appealed': set(),
}

AUTO_CLOSE_ON_VERDICT = os.getenv("AUTO_CLOSE_ON_VERDICT", "true").lower() == "true"


class LegalService:

    # ─── Court Case ────────────────────────────────────────────────────────

    async def create_court_case(self, case_id: int, requester, data, session: AsyncSession):
        """
        POST /cases/{case_id}/court-case
        Role required: legal_officer, admin, superadmin
        """
        # Role check
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can open court cases"
            )

        # Fetch case
        case = await case_repository.get_case_by_id(case_id, session)
        if not case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Case not found")

        # Verify case status is referred_to_court
        # Fetch the status name by joining or using the status_id
        # You must query CaseStatus to get the status_name string
        case_status = await self._get_case_status_name(case.status_id, session)
        if case_status != 'referred_to_court':
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "Case must be in 'referred_to_court' status to open court proceedings"
            )

        # Check for existing court case
        existing = await legal_repository.get_court_case_by_case_id(case_id, session)
        if existing:
            raise [USE_THE_409_EXCEPTION_CLASS_FROM_SCAN](
                "A court case already exists for this case"
            )

        # Validate hearing_date is in the future if provided
        if data.hearing_date and data.hearing_date <= datetime.utcnow().date():
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "Hearing date must be in the future"
            )

        # Create court case and log update in one transaction
        court_case = await legal_repository.create_court_case(
            case_id=case_id,
            court_name=data.court_name,
            court_reference=data.court_reference,
            judge_name=data.judge_name,
            prosecutor_name=data.prosecutor_name,
            hearing_date=data.hearing_date,
            session=session,
        )
        await case_repository.create_case_update(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type='court_case_opened',
            description=f"Court case opened at {data.court_name}",
            session=session,
        )
        return court_case

    async def get_court_case(self, case_id: int, requester, session: AsyncSession):
        """
        GET /cases/{case_id}/court-case
        Role: legal_officer, or case read access
        """
        case = await case_repository.get_case_by_id(case_id, session)
        if not case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Case not found")

        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            check_case_access(requester, case, 'read')

        court_case = await legal_repository.get_court_case_by_case_id(case_id, session)
        if not court_case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN](
                "No court case has been opened for this case"
            )

        # Load charges with sentences for the response
        charges = await legal_repository.list_charges_by_case(
            case_id=case_id,
            suspect_id_filter=None,
            status_filter=None,
            page=1,
            size=1000,
            session=session,
        )
        court_case.charges = charges[0]  # assign for ORM serialization
        return court_case

    async def patch_court_case(
        self, court_case_id: int, requester, data, session: AsyncSession
    ):
        """
        PATCH /court-cases/{court_case_id}
        Role: legal_officer, admin, superadmin
        """
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can update court cases"
            )

        court_case = await legal_repository.get_court_case_by_id(court_case_id, session)
        if not court_case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Court case not found")

        # Validate verdict
        if data.verdict is not None:
            if data.verdict not in VALID_VERDICTS:
                raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                    f"Invalid verdict. Must be one of: {', '.join(VALID_VERDICTS)}"
                )
            # Check if current verdict is terminal — immutable once set
            if court_case.verdict in TERMINAL_VERDICTS:
                raise [USE_THE_409_EXCEPTION_CLASS_FROM_SCAN](
                    "Verdict is immutable once a terminal verdict has been recorded"
                )

        # Validate hearing_date
        if data.hearing_date is not None and data.hearing_date <= datetime.utcnow().date():
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN]("Hearing date must be in the future")

        # Apply partial updates
        if data.court_name is not None:
            court_case.court_name = data.court_name
        if data.court_reference is not None:
            court_case.court_reference = data.court_reference
        if data.judge_name is not None:
            court_case.judge_name = data.judge_name
        if data.prosecutor_name is not None:
            court_case.prosecutor_name = data.prosecutor_name
        if data.hearing_date is not None:
            court_case.hearing_date = data.hearing_date
        if data.verdict_notes is not None:
            court_case.verdict_notes = data.verdict_notes

        verdict_changed = False
        if data.verdict is not None and data.verdict != court_case.verdict:
            court_case.verdict = data.verdict
            verdict_changed = True
            if data.verdict in TERMINAL_VERDICTS:
                court_case.closed_at = datetime.utcnow()

        court_case.updated_at = datetime.utcnow()
        await legal_repository.update_court_case(court_case, session)

        if verdict_changed:
            await case_repository.create_case_update(
                case_id=court_case.case_id,
                officer_id=requester.officer_id,
                update_type='verdict_recorded',
                description=f"Verdict recorded: {data.verdict}",
                session=session,
            )

        # Auto-close case if terminal verdict and all charges resolved and flag is on
        if verdict_changed and data.verdict in TERMINAL_VERDICTS and AUTO_CLOSE_ON_VERDICT:
            unresolved = await legal_repository.count_unresolved_charges_for_court_case(
                court_case.court_case_id, session
            )
            if unresolved == 0:
                case = await case_repository.get_case_by_id(court_case.case_id, session)
                if case:
                    closed_status = await self._get_closed_status_id(session)
                    if closed_status:
                        case.status_id = closed_status
                        case.closed_at = datetime.utcnow()
                        case.closed_by = requester.officer_id
                        case.updated_at = datetime.utcnow()
                        await session.flush()
                        await case_repository.create_case_update(
                            case_id=court_case.case_id,
                            officer_id=requester.officer_id,
                            update_type='status_change',
                            description='Case automatically closed — all charges resolved',
                            session=session,
                        )

        return court_case

    # ─── Charges ───────────────────────────────────────────────────────────

    async def create_charge(self, case_id: int, requester, data, session: AsyncSession):
        """
        POST /cases/{case_id}/charges
        Role: legal_officer, admin, superadmin
        """
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can file charges"
            )

        case = await case_repository.get_case_by_id(case_id, session)
        if not case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Case not found")

        # Verify suspect is linked to this case
        suspect_linked = await legal_repository.suspect_linked_to_case(
            case_id, data.suspect_id, session
        )
        if not suspect_linked:
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "Suspect is not linked to this case. Link the suspect first."
            )

        # Verify crime_type exists
        crime_type = await self._get_crime_type(data.crime_type_id, session)
        if not crime_type:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Crime type not found")

        # Verify court_case_id belongs to this case if provided
        if data.court_case_id is not None:
            court_case = await legal_repository.get_court_case_by_id(
                data.court_case_id, session
            )
            if not court_case or court_case.case_id != case_id:
                raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                    "Court case does not belong to this case"
                )

        charge = await legal_repository.create_charge(
            case_id=case_id,
            court_case_id=data.court_case_id,
            suspect_id=data.suspect_id,
            crime_type_id=data.crime_type_id,
            description=data.description,
            filed_by=requester.officer_id,
            session=session,
        )
        await case_repository.create_case_update(
            case_id=case_id,
            officer_id=requester.officer_id,
            update_type='charge_filed',
            description=f"Charge filed against Suspect #{data.suspect_id}: {crime_type.name}",
            session=session,
        )
        return charge

    async def list_charges(
        self, case_id: int, requester, suspect_id: Optional[int],
        status: Optional[str], page: int, size: int, session: AsyncSession
    ):
        """
        GET /cases/{case_id}/charges
        Role: legal_officer, or case read access
        """
        case = await case_repository.get_case_by_id(case_id, session)
        if not case:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Case not found")

        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            check_case_access(requester, case, 'read')

        charges, total = await legal_repository.list_charges_by_case(
            case_id=case_id,
            suspect_id_filter=suspect_id,
            status_filter=status,
            page=page,
            size=size,
            session=session,
        )
        # Return using the existing paginated response wrapper — match exact constructor
        return [USE_PAGINATION_WRAPPER](items=charges, total=total, page=page, size=size)

    async def patch_charge(
        self, charge_id: int, requester, data, session: AsyncSession
    ):
        """
        PATCH /charges/{charge_id}
        Role: legal_officer, admin, superadmin
        """
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can update charges"
            )

        charge = await legal_repository.get_charge_by_id(charge_id, session)
        if not charge:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Charge not found")

        # Check current status is not terminal
        if charge.status in TERMINAL_CHARGE_STATUSES:
            raise [USE_THE_409_EXCEPTION_CLASS_FROM_SCAN](
                "Charge status is immutable — this charge has reached a terminal state"
            )

        # Validate transition
        allowed_next = CHARGE_TRANSITIONS.get(charge.status, set())
        if data.status not in allowed_next:
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                f"Invalid status transition from '{charge.status}' to '{data.status}'. "
                f"Allowed: {', '.join(allowed_next) or 'none'}"
            )

        updated_charge = await legal_repository.update_charge_status(
            charge, data.status, session
        )
        await case_repository.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type='charge_updated',
            description=f"Charge #{charge_id} status updated to {data.status}",
            session=session,
        )

        warnings = []
        if data.status == 'convicted':
            existing_sentence = await legal_repository.get_sentence_by_charge_id(
                charge_id, session
            )
            if not existing_sentence:
                warnings.append(
                    "Charge marked convicted but no sentence has been recorded"
                )

        # Return charge; attach warnings as a response field if your response schema supports it
        return updated_charge

    async def drop_charge(self, charge_id: int, requester, session: AsyncSession):
        """
        DELETE /charges/{charge_id}
        Sets status = 'dropped'. Only valid from 'filed' status.
        Role: legal_officer, admin, superadmin
        """
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can drop charges"
            )

        charge = await legal_repository.get_charge_by_id(charge_id, session)
        if not charge:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Charge not found")

        if charge.status != 'filed':
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "Only charges in 'filed' status can be dropped"
            )

        existing_sentence = await legal_repository.get_sentence_by_charge_id(
            charge_id, session
        )
        if existing_sentence:
            raise [USE_THE_409_EXCEPTION_CLASS_FROM_SCAN](
                "Cannot drop a charge that already has a sentence recorded"
            )

        dropped = await legal_repository.drop_charge(charge, session)
        await case_repository.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type='charge_dropped',
            description=f"Charge #{charge_id} dropped",
            session=session,
        )
        return dropped

    # ─── Sentences ─────────────────────────────────────────────────────────

    async def create_sentence(
        self, charge_id: int, requester, data, session: AsyncSession
    ):
        """
        POST /charges/{charge_id}/sentence
        Role: legal_officer, admin, superadmin
        """
        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            raise [USE_THE_403_EXCEPTION_CLASS_FROM_SCAN](
                "Only legal officers, admins, and superadmins can record sentences"
            )

        charge = await legal_repository.get_charge_by_id(charge_id, session)
        if not charge:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Charge not found")

        if charge.status != 'convicted':
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "A sentence can only be recorded for a convicted charge"
            )

        if charge.court_case_id != data.court_case_id:
            raise [USE_THE_422_EXCEPTION_CLASS_FROM_SCAN](
                "Court case ID does not match the charge's associated court case"
            )

        existing = await legal_repository.get_sentence_by_charge_id(charge_id, session)
        if existing:
            raise [USE_THE_409_EXCEPTION_CLASS_FROM_SCAN](
                "A sentence already exists for this charge"
            )

        sentence = await legal_repository.create_sentence(
            charge_id=charge_id,
            court_case_id=data.court_case_id,
            description=data.description,
            duration=data.duration,
            duration_days=data.duration_days,
            start_date=data.start_date,
            end_date=data.end_date,
            sentence_type=data.sentence_type,
            is_suspended=data.is_suspended,
            sentenced_at=data.sentenced_at,
            session=session,
        )
        await case_repository.create_case_update(
            case_id=charge.case_id,
            officer_id=requester.officer_id,
            update_type='sentence_recorded',
            description=f"Sentence recorded for Charge #{charge_id}: {data.duration}",
            session=session,
        )

        # Auto-close check
        if AUTO_CLOSE_ON_VERDICT:
            court_case = await legal_repository.get_court_case_by_id(
                data.court_case_id, session
            )
            if court_case and court_case.verdict in TERMINAL_VERDICTS:
                unresolved = await legal_repository.count_unresolved_charges_for_court_case(
                    data.court_case_id, session
                )
                if unresolved == 0:
                    case = await case_repository.get_case_by_id(charge.case_id, session)
                    if case:
                        closed_status_id = await self._get_closed_status_id(session)
                        if closed_status_id:
                            case.status_id = closed_status_id
                            case.closed_at = datetime.utcnow()
                            case.closed_by = requester.officer_id
                            case.updated_at = datetime.utcnow()
                            await session.flush()
                            await case_repository.create_case_update(
                                case_id=charge.case_id,
                                officer_id=requester.officer_id,
                                update_type='status_change',
                                description='Case automatically closed — all charges resolved',
                                session=session,
                            )

        return sentence

    async def get_sentence(
        self, charge_id: int, requester, session: AsyncSession
    ):
        """
        GET /charges/{charge_id}/sentence
        Role: legal_officer, or case read access
        """
        charge = await legal_repository.get_charge_by_id(charge_id, session)
        if not charge:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN]("Charge not found")

        if requester.role_name not in ('legal_officer', 'admin', 'superadmin'):
            case = await case_repository.get_case_by_id(charge.case_id, session)
            if case:
                check_case_access(requester, case, 'read')

        sentence = await legal_repository.get_sentence_by_charge_id(charge_id, session)
        if not sentence:
            raise [USE_THE_404_EXCEPTION_CLASS_FROM_SCAN](
                "No sentence has been recorded for this charge"
            )
        return sentence

    # ─── Private helpers ───────────────────────────────────────────────────

    async def _get_case_status_name(self, status_id: int, session: AsyncSession) -> str:
        """
        Fetch status_name from CaseStatus table by status_id.
        Use the exact CaseStatus model class name from your codebase scan.
        """
        from app.models.case import CaseStatus  # adjust import to match actual location
        result = await session.execute(
            select(CaseStatus).where(CaseStatus.status_id == status_id)
        )
        status = result.scalars().first()
        return status.status_name if status else ''

    async def _get_closed_status_id(self, session: AsyncSession) -> int | None:
        """Fetch the status_id for the 'closed' case status."""
        from app.models.case import CaseStatus  # adjust import to match actual location
        result = await session.execute(
            select(CaseStatus).where(CaseStatus.status_name == 'closed')
        )
        status = result.scalars().first()
        return status.status_id if status else None

    async def _get_crime_type(self, crime_type_id: int, session: AsyncSession):
        """
        Fetch a CrimeType by ID. Use exact model class name from scan.
        """
        from app.models.reference import CrimeType  # adjust import to match actual location
        result = await session.execute(
            select(CrimeType).where(CrimeType.crime_type_id == crime_type_id)
        )
        return result.scalars().first()


legal_service = LegalService()
```

**CRITICAL — Replace all `[USE_THE_XXX_EXCEPTION_CLASS_FROM_SCAN]` and `[USE_PAGINATION_WRAPPER]` placeholders** with the exact class names you recorded during the mandatory codebase scan in Section 2. Do not leave any placeholder in the final file.

**CRITICAL — Fix all private helper imports** (`CaseStatus`, `CrimeType`, `CaseSuspects`) to use the exact module paths confirmed during the scan.

---

### TASK G.5 — Router

Create `app/routers/legal_router.py`:

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

# Import get_current_officer from exact path confirmed in scan
# Import get_db from exact path confirmed in scan
# Import schemas from app.schemas.legal_schemas
# Import legal_service from app.services.legal_service

from app.schemas.legal_schemas import (
    CourtCaseCreateRequest,
    CourtCasePatchRequest,
    CourtCaseResponse,
    ChargeCreateRequest,
    ChargePatchRequest,
    ChargeResponse,
    SentenceCreateRequest,
    SentenceResponse,
)
from app.services.legal_service import legal_service

# Use the exact import paths for get_current_officer and get_db
# confirmed during the mandatory scan — do not guess
from app.core.dependencies import get_current_officer, get_db  # adjust if path differs


court_cases_router = APIRouter(
    prefix="/cases/{case_id}",
    tags=["Legal"],
)

charges_router = APIRouter(
    prefix="/cases/{case_id}",
    tags=["Legal"],
)

court_case_patch_router = APIRouter(
    prefix="/court-cases",
    tags=["Legal"],
)

standalone_charges_router = APIRouter(
    prefix="/charges",
    tags=["Legal"],
)


# ─── Court Cases ─────────────────────────────────────────────────────────────

@court_cases_router.post(
    "/court-case",
    response_model=CourtCaseResponse,
    status_code=201,
    summary="Open a formal court proceeding for a case",
)
async def create_court_case(
    case_id: int,
    data: CourtCaseCreateRequest,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.create_court_case(case_id, current_officer, data, session)


@court_cases_router.get(
    "/court-case",
    response_model=CourtCaseResponse,
    status_code=200,
    summary="Get the court case for a case including all charges",
)
async def get_court_case(
    case_id: int,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.get_court_case(case_id, current_officer, session)


@court_case_patch_router.patch(
    "/{court_case_id}",
    response_model=CourtCaseResponse,
    status_code=200,
    summary="Update court case — record verdict, update hearing date",
)
async def patch_court_case(
    court_case_id: int,
    data: CourtCasePatchRequest,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.patch_court_case(court_case_id, current_officer, data, session)


# ─── Charges ─────────────────────────────────────────────────────────────────

@charges_router.post(
    "/charges",
    response_model=ChargeResponse,
    status_code=201,
    summary="File a formal charge against a suspect",
)
async def create_charge(
    case_id: int,
    data: ChargeCreateRequest,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.create_charge(case_id, current_officer, data, session)


@charges_router.get(
    "/charges",
    status_code=200,
    summary="List all charges for a case",
)
async def list_charges(
    case_id: int,
    suspect_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.list_charges(
        case_id, current_officer, suspect_id, status, page, size, session
    )


@standalone_charges_router.patch(
    "/{charge_id}",
    response_model=ChargeResponse,
    status_code=200,
    summary="Update the status of a charge",
)
async def patch_charge(
    charge_id: int,
    data: ChargePatchRequest,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.patch_charge(charge_id, current_officer, data, session)


@standalone_charges_router.delete(
    "/{charge_id}",
    response_model=ChargeResponse,
    status_code=200,
    summary="Drop a charge in 'filed' status",
)
async def drop_charge(
    charge_id: int,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.drop_charge(charge_id, current_officer, session)


# ─── Sentences ───────────────────────────────────────────────────────────────

@standalone_charges_router.post(
    "/{charge_id}/sentence",
    response_model=SentenceResponse,
    status_code=201,
    summary="Record a sentence for a convicted charge",
)
async def create_sentence(
    charge_id: int,
    data: SentenceCreateRequest,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.create_sentence(charge_id, current_officer, data, session)


@standalone_charges_router.get(
    "/{charge_id}/sentence",
    response_model=SentenceResponse,
    status_code=200,
    summary="Get the sentence for a specific charge",
)
async def get_sentence(
    charge_id: int,
    current_officer=Depends(get_current_officer),
    session: AsyncSession = Depends(get_db),
):
    return await legal_service.get_sentence(charge_id, current_officer, session)
```

---

### TASK G.6 — Register Legal Routers in main.py

Open `app/main.py`. Immediately after adding the legal router file, add these registrations **in this exact order** using the same `include_router` style as every other existing registration in the file:

```python
from app.routers.legal_router import (
    court_cases_router,
    charges_router,
    court_case_patch_router,
    standalone_charges_router,
)

app.include_router(court_cases_router)
app.include_router(charges_router)
app.include_router(court_case_patch_router)
app.include_router(standalone_charges_router)
```

If existing `include_router` calls in the file use explicit `prefix=` and `tags=` kwargs, move them there and remove them from the `APIRouter()` constructor. Match whatever style is already used — do not introduce a different style.

---

### TASK G.7 — Migration for Legal Module

**Before writing this migration, perform Section 2 Step 6 again:**

1. List all files in `alembic/versions/`.
2. Search all migration files for `court_case`, `charge`, `sentence`. If any of those tables already appear in an existing migration (`op.create_table('court_case', ...)`), do NOT recreate them. Only add missing columns.
3. If all three tables are absent from existing migrations, create one migration file that creates all three.
4. Chain `down_revision` from the arrest/interrogation migration that was the previous agent's last migration.

Create migration file. Name it: `add_legal_module_tables`.

```python
"""add_legal_module_tables

Revision ID: <generate a unique 12-char hex string>
Revises: <exact down_revision from the current head — confirmed in scan>
Create Date: <current date>
"""
from alembic import op
import sqlalchemy as sa

# Use the exact import block style from the two most recent migration files you opened.

revision = '<unique 12-char hex string>'
down_revision = '<current head revision ID from scan>'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── court_case table ─────────────────────────────────────────────────
    # Only create if confirmed absent from all existing migrations
    op.create_table(
        'court_case',
        sa.Column('court_case_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('case.case_id'), nullable=False),
        sa.Column('court_name', sa.String(255), nullable=False),
        sa.Column('court_reference', sa.String(100), nullable=True),
        sa.Column('judge_name', sa.String(255), nullable=True),
        sa.Column('prosecutor_name', sa.String(255), nullable=True),
        sa.Column('hearing_date', sa.Date(), nullable=True),
        sa.Column('verdict', sa.String(50), nullable=True),
        sa.Column('verdict_notes', sa.Text(), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('court_case_id'),
        sa.UniqueConstraint('case_id', name='uq_court_case_per_case'),
    )

    # ─── charge table ─────────────────────────────────────────────────────
    op.create_table(
        'charge',
        sa.Column('charge_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('case.case_id'), nullable=False),
        sa.Column('court_case_id', sa.Integer(),
                  sa.ForeignKey('court_case.court_case_id'), nullable=True),
        sa.Column('suspect_id', sa.Integer(),
                  sa.ForeignKey('suspect.suspect_id'), nullable=False),
        sa.Column('crime_type_id', sa.Integer(),
                  sa.ForeignKey('crime_type.crime_type_id'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('filed_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('filed_by', sa.Integer(),
                  sa.ForeignKey('officer.officer_id'), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='filed'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('charge_id'),
    )

    # ─── sentence table ───────────────────────────────────────────────────
    op.create_table(
        'sentence',
        sa.Column('sentence_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('charge_id', sa.Integer(),
                  sa.ForeignKey('charge.charge_id'), nullable=False),
        sa.Column('court_case_id', sa.Integer(),
                  sa.ForeignKey('court_case.court_case_id'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('duration', sa.String(100), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('sentence_type', sa.String(100), nullable=True),
        sa.Column('is_suspended', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('sentenced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('sentence_id'),
    )

    # ─── Indexes ──────────────────────────────────────────────────────────
    op.create_index('idx_court_case_case', 'court_case', ['case_id'])
    op.create_index('idx_charge_case', 'charge', ['case_id'])
    op.create_index('idx_charge_suspect', 'charge', ['suspect_id'])
    op.create_index('idx_charge_court_case', 'charge', ['court_case_id'])
    op.create_index('idx_sentence_charge', 'sentence', ['charge_id'])


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_index('idx_sentence_charge', table_name='sentence')
    op.drop_index('idx_charge_court_case', table_name='charge')
    op.drop_index('idx_charge_suspect', table_name='charge')
    op.drop_index('idx_charge_case', table_name='charge')
    op.drop_index('idx_court_case_case', table_name='court_case')
    op.drop_table('sentence')
    op.drop_table('charge')
    op.drop_table('court_case')
```

**CRITICAL migration rules:**
- The `verdict` column uses `sa.String(50)` — do NOT use `sa.Enum(...)` for it because `verdictenum` already exists in the database as a type, but if you reference it with `create_type=False` and it was defined differently (e.g., PostgreSQL `ENUM` vs SQLAlchemy `Enum`), you risk a mismatch. Store verdict values as strings at the application layer and validate them in the service. This is safer and avoids enum creation conflicts.
- Same applies to `charge.status` — use `sa.String(50)` and validate values in the service.
- Do NOT use `sa.text(...)` for any DML. `sa.text('now()')` is only used as a `server_default` in column definitions, which is an Alembic DDL operation — this is permitted and does not violate the no-raw-SQL rule.
- If your existing migrations use `server_default=sa.text('now()')` for timestamps, match that pattern. If they use `server_default='now()'` (a plain string), match that instead.

---

## SECTION 5 — IMPORT CORRECTNESS RULES

This section applies to every file you create or modify. Read it before writing any import statement.

1. **Only import from files that exist.** Before writing `from app.models.X import Y`, open `app/models/X.py` and confirm `Y` is defined there.
2. **The `CaseSuspects` model** must be imported from wherever the codebase scan confirmed it lives. This could be `app/models/case.py`, `app/models/associations.py`, or a file you created in Task F. Use the confirmed path.
3. **The `CaseUpdate` model** must be imported from wherever the codebase scan confirmed it lives. The previous agent used it in case_repository — check what it imported and replicate it exactly.
4. **The `CrimeType` model** — find it during the scan. It was an existing model (Module 0 reference data). Use the exact class name and import path.
5. **The `CaseStatus` model** — find it during the scan. It was an existing model. Use the exact class name.
6. **`check_case_access`** — import from the exact file confirmed in scan Step 4.
7. **`get_current_officer` and `get_db`** — import from the exact file confirmed in scan Step 5.
8. **The pagination wrapper** — import from the exact file confirmed in scan Step 3.
9. **Circular import prevention:** If `legal_service.py` imports from `case_repository.py`, and `case_repository.py` imports from `case models`, there must be no cycle. Legal models should not import from service files. Services import from repositories and models only.

---

## SECTION 6 — HTTP STATUS CODE REFERENCE

| Situation | Status Code |
|---|---|
| Successful resource creation | 201 |
| Successful GET or PATCH (returns body) | 200 |
| Successful soft delete or revoke (no body) | 204 |
| Resource not found (or soft-deleted) | 404 |
| Field validation / immutable field / invalid enum / date error | 422 |
| Not authenticated | 401 |
| Permission denied | 403 |
| Business rule conflict (duplicate, terminal state, already set) | 409 |

---

## SECTION 7 — PERMISSIONS QUICK REFERENCE

| Endpoint | Minimum Requirement |
|---|---|
| `PATCH /cases/{case_id}` | write case access OR lead_investigator OR dept_head (own dept) OR admin/superadmin |
| `DELETE /cases/{case_id}` | superadmin only |
| `POST /cases/{case_id}/officers` | admin case access OR dept_head (own dept) OR admin/superadmin |
| `DELETE /cases/{case_id}/officers/{officer_id}` | admin case access OR dept_head (own dept) OR admin/superadmin |
| `POST /cases/{case_id}/suspects\|victims\|witnesses` | write case access OR dept_head (own dept) OR admin/superadmin |
| `GET /cases/{case_id}/timeline` | read case access |
| `POST /cases/{case_id}/court-case` | system role: legal_officer, admin, superadmin |
| `GET /cases/{case_id}/court-case` | case read access OR legal_officer |
| `PATCH /court-cases/{court_case_id}` | system role: legal_officer, admin, superadmin |
| `POST /cases/{case_id}/charges` | system role: legal_officer, admin, superadmin |
| `GET /cases/{case_id}/charges` | case read access OR legal_officer |
| `PATCH /charges/{charge_id}` | system role: legal_officer, admin, superadmin |
| `DELETE /charges/{charge_id}` | system role: legal_officer, admin, superadmin |
| `POST /charges/{charge_id}/sentence` | system role: legal_officer, admin, superadmin |
| `GET /charges/{charge_id}/sentence` | case read access OR legal_officer |

---

## SECTION 8 — AUDIT RULES

### Mandatory CaseUpdate inserts — Legal Module

Every one of these operations MUST insert a `CaseUpdate` row **in the same transaction** as the primary operation.

| Operation | update_type | Description |
|---|---|---|
| Court case opened | `'court_case_opened'` | `f"Court case opened at {court_name}"` |
| Verdict recorded | `'verdict_recorded'` | `f"Verdict recorded: {verdict}"` |
| Case auto-closed after verdict | `'status_change'` | `'Case automatically closed — all charges resolved'` |
| Charge filed | `'charge_filed'` | `f"Charge filed against Suspect #{suspect_id}: {crime_type_name}"` |
| Charge status updated | `'charge_updated'` | `f"Charge #{charge_id} status updated to {new_status}"` |
| Charge dropped | `'charge_dropped'` | `f"Charge #{charge_id} dropped"` |
| Sentence recorded | `'sentence_recorded'` | `f"Sentence recorded for Charge #{charge_id}: {duration}"` |

### Transaction wrapping

All multi-table operations must be in a single transaction. Use the same pattern the codebase already uses — whether that is `async with session.begin()` or `session.add()` + `await session.flush()` + `await session.commit()` at the service boundary. Do not mix patterns.

---

## SECTION 9 — PROHIBITED ANTI-PATTERNS

1. **Business logic in a router function.** Routers call one service method and return. No validation, no DB access, no conditionals in routers.
2. **Database access in a service.** Services call repository methods only. Services never call `session.execute(...)` directly — except in the `_get_case_status_name`, `_get_closed_status_id`, and `_get_crime_type` private helpers shown above, which are thin lookup helpers. If the codebase has existing repository methods for these lookups, use those instead and delete the private helpers.
3. **Raw SQL.** No `text(...)` for data manipulation. DDL `server_default=sa.text('now()')` in migrations is the only permitted exception.
4. **Importing from a file that does not exist.** Confirm every import target exists before writing the import.
5. **Recreating existing enum types.** `verdictenum`, `chargestatusenum`, and all other confirmed existing enums must never appear with `create_type=True` in any migration.
6. **Registering a router without adding it to main.py.** Every new router must have a corresponding `include_router` call added to `main.py` immediately.
7. **Synchronous SQLAlchemy.** All DB access is `await session.execute(select(...))`. No `session.query(...)`.
8. **Duplicating existing code.** Read the file before you write to it. If a method exists, do not add it again.
9. **Leaving placeholder comments.** Replace all `[USE_THE_XXX_EXCEPTION_CLASS_FROM_SCAN]` and similar placeholders with actual class names before saving any file.
10. **Guessing import paths.** Confirm every import path by opening the target file first.

---

## SECTION 10 — COMPLETION CHECKLIST

Verify every item before considering a task complete.

### Task F — Cases Module Completeness

- [ ] Scanned case router — listed all existing routes before writing anything
- [ ] `PATCH /cases/{case_id}` — only added if not already present
- [ ] `DELETE /cases/{case_id}` — only added if not already present
- [ ] `POST /cases/{case_id}/officers` — only added if not already present
- [ ] `DELETE /cases/{case_id}/officers/{officer_id}` — only added if not already present
- [ ] `POST /cases/{case_id}/suspects` — only added if not already present
- [ ] `POST /cases/{case_id}/victims` — only added if not already present
- [ ] `POST /cases/{case_id}/witnesses` — only added if not already present
- [ ] `GET /cases/{case_id}/timeline` — only added if not already present
- [ ] `CaseOfficers` ORM model added to model file only if not already present
- [ ] `CaseSuspects`, `CaseVictims`, `CaseWitnesses` ORM models added only if missing
- [ ] All new models imported in models collection file
- [ ] Migration created only if confirmed-missing columns were found — no migration if nothing new
- [ ] No existing working code was modified (only additions)

### Task G — Legal Module

- [ ] `app/models/legal.py` created with `CourtCase`, `Charge`, `Sentence`
- [ ] Legal models imported in models collection file
- [ ] `Case` model updated with `court_cases` and `charges` relationships if missing
- [ ] `app/schemas/legal_schemas.py` created with all schemas
- [ ] `app/repositories/legal_repository.py` created with all methods
- [ ] `CaseSuspects` import in legal_repository points to confirmed actual location
- [ ] `app/services/legal_service.py` created with all service methods
- [ ] All `[USE_THE_XXX_EXCEPTION_CLASS_FROM_SCAN]` placeholders replaced with actual class names
- [ ] `[USE_PAGINATION_WRAPPER]` placeholder replaced with actual wrapper class and constructor
- [ ] All private helper imports (`CaseStatus`, `CrimeType`) point to confirmed actual file paths
- [ ] `check_case_access` import points to confirmed actual file path
- [ ] `app/routers/legal_router.py` created with all four router objects
- [ ] All four legal routers registered in `app/main.py`
- [ ] `app/alembic/versions/add_legal_module_tables_*.py` migration created
- [ ] Migration `down_revision` chains correctly from the previous agent's last migration
- [ ] Migration `upgrade()` creates only tables confirmed absent from existing migrations
- [ ] Migration `downgrade()` drops tables in reverse dependency order (sentence → charge → court_case)
- [ ] No enum types created in migration (`verdict` and `status` stored as `String(50)`)
- [ ] Auto-close logic fires only when `AUTO_CLOSE_ON_VERDICT` env var is true
- [ ] All `CaseUpdate` audit rows inserted in same transaction as primary operation
- [ ] No circular imports introduced
- [ ] Application starts without import errors after all changes