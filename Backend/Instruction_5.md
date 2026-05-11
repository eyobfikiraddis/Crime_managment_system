# CCMS — Cursor Agent Instruction File
# Centralized Crime Management System — Case Management Completion
# Version: 3.0 | Classification: Internal — Agent Operational Directive

---

## CRITICAL PREAMBLE — READ BEFORE WRITING ANY CODE

You are an AI coding agent continuing development of an existing enterprise backend system called **CCMS (Centralized Crime Management System)**. You did NOT originally build this system. You MUST study and mirror the existing architecture before writing a single line of code.

### Non-Negotiable Rules

- DO NOT generate any test files under any circumstances.
- DO NOT refactor, rename, or restructure any module that is already working.
- DO NOT modify any authentication or session management code.
- DO NOT break any existing endpoint.
- DO NOT introduce synchronous (non-async) database access anywhere.
- DO NOT generate placeholder implementations, stub functions, or TODO comments. Every feature must be fully implemented.
- DO NOT create any table, enum, index, or constraint that already exists. Always inspect existing migrations first.
- DO NOT introduce new libraries not already present in the project's requirements/dependency files unless strictly necessary, and only after confirming the existing stack cannot solve the problem.
- DO NOT produce partial implementations. Complete each feature fully before starting the next.

---

## STEP 0 — MANDATORY ARCHITECTURE STUDY (DO THIS FIRST)

Before writing any code, you must perform a full study of the existing project. Open and read the following:

### Files and Folders to Inspect

1. `alembic/versions/` — Read ALL existing migration files. Map every table, column, index, constraint, and enum that already exists. Build a mental model of the current schema before creating any migration.

2. `alembic/env.py` — Understand how migrations are configured, how the async engine is wired, and how model metadata is imported.

3. `app/models/` — Read every ORM model file. Understand column types, relationships, ForeignKey patterns, soft-delete conventions (`deleted_at`), and audit timestamp patterns.

4. `app/schemas/` — Read every Pydantic schema file. Understand Base/Create/Update/Response schema patterns, validator styles, field alias conventions, and how optional vs required fields are structured.

5. `app/repositories/` — Read every repository file. Understand how async SQLAlchemy sessions are used, how queries are structured, how soft deletes are filtered, how pagination is applied, and how transactions are scoped.

6. `app/services/` — Read every service file. Understand how orchestration is done, where validation occurs, how repositories are called, and how errors are raised.

7. `app/routers/` or `app/api/` — Read every router file. Understand how endpoints are structured, how dependencies are injected, how response models are declared, and how HTTP status codes are used.

8. `app/core/dependencies.py` (or equivalent) — Understand `get_current_officer`, how it is imported and used, and how role/permission checking is done.

9. `app/core/exceptions.py` (or equivalent) — Read all custom exception classes and their HTTP mappings. Mirror this pattern exactly.

10. `app/core/security.py` or `app/core/permissions.py` (or equivalent) — Understand the RBAC permission model and `check_case_access` logic.

11. `app/main.py` — Understand how routers are registered and included.

12. The **Personnel module** (`app/modules/personnel/` or equivalent path) — This is your primary reference implementation. Mirror its structure, file layout, naming, and patterns exactly.

13. The **Department module** (`app/modules/departments/` or equivalent path) — This is your secondary reference implementation.

14. The **Case module** (partial) — Read the existing Create/List/GetById implementation to understand the base patterns already established for cases.

### What You Are Looking For

- Exact file naming conventions (e.g., `case_repository.py`, `case_service.py`, `case_router.py`, `case_schemas.py`)
- Exact class naming conventions (e.g., `CaseRepository`, `CaseService`)
- How the async SQLAlchemy session is injected (e.g., `Depends(get_db)` or `Depends(get_async_session)`)
- How pagination is implemented (query params, response envelope)
- How soft deletes are queried (e.g., `filter(Model.deleted_at.is_(None))`)
- How audit log entries are written
- How exceptions are raised and caught
- How response models are structured
- How OpenAPI tags and summaries are applied to routes

**Only after completing this study should you write any code.**

---

## STEP 1 — SCHEMA AUDIT (DO THIS BEFORE CREATING ANY MIGRATION)

Run the following inspection before generating any Alembic migration:

1. Open `alembic/versions/` and list all migration files in order.
2. For each migration, identify every `op.create_table`, `op.add_column`, `op.create_index`, `op.create_unique_constraint`, and `sa.Enum` call.
3. Build a complete list of tables and columns that already exist.

### Tables Confirmed to Already Exist (DO NOT recreate)

- `person`
- `officer`
- `department`
- `role`
- `officer_history`
- `person_history`
- `auth_audit_log`
- `password_reset_audit`
- `location`
- `crime_type`
- `case_status`
- `suspect`
- `victim`
- `witness`
- `case_assignment` (may also be named `case_officers`)
- `case_charge` (may also be named `charge`)
- `arrest`
- `evidence`
- `evidence_chain_of_custody` (may also be named `chain_of_custody`)
- `case_note` (may also be named `case_notes`)

### Enums Confirmed to Already Exist (DO NOT recreate)

- `genderenum`
- `locationtypeenum`
- `severityenum`
- `risklevelenum`
- `accesslevelenum`
- `roleincaseenum`
- `chargestatusenum`
- `verdictenum`
- `autheventenum`

After your audit, identify only what is genuinely missing. Only create migrations for missing objects.

---

## STEP 2 — ORM MODEL AUDIT

After auditing migrations, open every file in `app/models/` (or the models directory as named in this project).

For each model:
- Confirm which columns and relationships are already defined.
- Identify missing columns, relationships, or constraints.
- Only add what is missing. Do not redefine anything that already exists.

Key ORM models that must exist and be complete before proceeding:

- `Case` — must include `department_id`, `status_id`, `deleted_at`, `archived_at`, `closed_at`, `created_by`, `updated_by`, `archived_by`, `closed_by`
- `CaseOfficers` (or `CaseAssignment`) — must include `case_id`, `officer_id`, `role_in_case`, `assigned_at`, `removed_at`, `assigned_by`
- `CaseSuspects` — `case_id`, `suspect_id`, `notes`, `added_at`, `added_by`
- `CaseVictims` — `case_id`, `victim_id`, `added_at`, `added_by`
- `CaseWitnesses` — `case_id`, `witness_id`, `added_at`, `added_by`
- `Charge` — `charge_id`, `case_id`, `court_case_id`, `suspect_id`, `crime_type_id`, `description`, `filed_at`, `filed_by`, `status`, `created_at`, `updated_at`, `deleted_at`
- `Arrest` — `arrest_id`, `suspect_id`, `officer_id`, `case_id`, `booking_number`, `location_id`, `bail_amount`, `date`, `released_at`, `notes`, `created_at`, `updated_at`, `deleted_at`
- `Evidence` — `evidence_id`, `case_id`, `evidence_type_id`, `description`, `collected_at`, `collected_by`, `storage_location`, `is_sensitive`, `created_at`, `updated_at`, `deleted_at`
- `ChainOfCustody` — `chain_id`, `evidence_id`, `officer_id`, `action`, `transferred_to`, `location_id`, `notes`, `created_at`
- `CaseNote` — `note_id`, `case_id`, `officer_id`, `note_text`, `is_internal`, `created_at`, `updated_at`, `deleted_at`
- `CaseUpdate` — `update_id`, `case_id`, `officer_id`, `update_type`, `description`, `created_at`
- `CasePermission` — `permission_id`, `case_id`, `officer_id`, `access_level`, `granted_by`, `granted_at`, `revoked_at`, `revoked_by`

---

## STEP 3 — IMPLEMENTATION ORDER

Implement features in the following order. Complete each section fully (model → schema → repository → service → router → migration → route registration) before starting the next.

---

### FEATURE 1 — CASE UPDATE & LIFECYCLE

#### Endpoints to Implement

- `PUT /cases/{case_id}` — Full update of mutable case fields
- `PATCH /cases/{case_id}/status` — Status-only transition
- `DELETE /cases/{case_id}` — Soft delete (superadmin only)

#### ORM Changes

In the `Case` model, confirm all required columns exist. If any are missing, add them:
- `updated_by` (Integer, FK → officer)
- `archived_by` (Integer, FK → officer, nullable)
- `closed_by` (Integer, FK → officer, nullable)
- `archived_at` (DateTime, nullable)
- `closed_at` (DateTime, nullable)

#### Schema Requirements

Create (or extend) `CaseUpdateRequest` schema with all mutable fields optional:
- `title` (str, max 255, optional)
- `description` (str, optional)
- `crime_type_id` (int, optional)
- `location_id` (int, optional)

Create `CaseStatusUpdateRequest` schema:
- `status_id` (int, required)

Response schema must mirror existing `CaseResponse` pattern from the Personnel/Department modules.

#### Repository Requirements

Add to the existing case repository:
- `update_case(case_id, data, updated_by)` — async, applies partial updates, sets `updated_at = now()`, sets `updated_by`
- `update_case_status(case_id, new_status_id, updated_by)` — async, updates status and appends a `CaseUpdate` row in the same transaction
- `soft_delete_case(case_id, deleted_by)` — async, sets `deleted_at = now()`

#### Service Requirements

Add to the existing case service:
- Validate status transitions strictly:
  - `open` → `under_investigation` ✓
  - `under_investigation` → `referred_to_court` ✓
  - `referred_to_court` → `closed` ✓
  - `closed` → any ✗ (reject with 422 unless requester is superadmin)
  - any → `archived` ✓ (admin/superadmin only)
- Before closing: verify no `Charge` exists with status outside `['dropped', 'acquitted', 'convicted']`. Raise 409 if active charges found.
- Before archiving: verify requester role is `admin` or `superadmin`. Raise 403 if not.
- Before soft delete: verify role is `superadmin`. Verify no `Court_Case` with non-null verdict. Verify no `Arrest` where `released_at IS NULL`. Raise 409 if either check fails.
- Soft delete must insert a `CaseUpdate` row with `update_type='status_change'` and `description='Case soft-deleted by superadmin'`.
- Preserve immutable creation metadata: `created_at`, `created_by`, `date_reported` must never be modified.

#### Router Requirements

- `PUT /cases/{case_id}` — requires write or admin case permission, or lead investigator, or department_head, or admin/superadmin. Response: updated case. Status 200.
- `PATCH /cases/{case_id}/status` — same permission requirements as PUT. Response: updated case. Status 200.
- `DELETE /cases/{case_id}` — superadmin only. Response: 204 No Content.

#### Migration Requirements

Create a new Alembic migration. Only add columns that do not already exist on the `case` table. Include `downgrade()` that removes only what was added.

---

### FEATURE 2 — CASE ASSIGNMENTS

#### Endpoints to Implement

- `POST /cases/{case_id}/assignments` — Assign officer to case
- `GET /cases/{case_id}/assignments` — List all assignments for a case
- `DELETE /cases/{case_id}/assignments/{assignment_id}` — Remove assignment

#### ORM Changes

Verify `CaseOfficers` model is complete. It must include:
- `id` (PK)
- `case_id` (FK → case)
- `officer_id` (FK → officer)
- `role_in_case` (Enum: `roleincaseenum`)
- `assigned_at` (DateTime)
- `removed_at` (DateTime, nullable)
- `assigned_by` (FK → officer)

Add a DB-level partial unique index if not already present:
```sql
CREATE UNIQUE INDEX uq_case_lead_investigator
ON case_officers (case_id)
WHERE role_in_case = 'lead_investigator' AND removed_at IS NULL;
```

#### Schema Requirements

`CaseAssignmentCreate`:
- `officer_id` (int, required)
- `role_in_case` (roleincaseenum, required — one of: lead_investigator, co_investigator, support_officer, forensic_officer, supervisor)

`CaseAssignmentResponse`:
- All fields from `CaseOfficers`
- Include officer name (join Person)

#### Repository Requirements

- `assign_officer(case_id, officer_id, role_in_case, assigned_by)` — async
  - Check for existing active assignment (where `removed_at IS NULL`). Raise 409 if duplicate.
  - Check for existing `lead_investigator` if role is `lead_investigator`. Raise 409 if conflict.
  - Insert `CaseOfficers` row.
  - Insert `CasePermission` row with `access_level='write'` in same transaction.
  - Insert `CaseUpdate` row.
- `list_assignments(case_id)` — returns active assignments (where `removed_at IS NULL`)
- `remove_assignment(assignment_id)` — sets `removed_at = now()`, revokes corresponding `CasePermission`, inserts `CaseUpdate`

#### Service Requirements

- Validate officer exists and is active (`deleted_at IS NULL`)
- Validate case is not closed or soft-deleted
- If requester is `department_head`: verify the officer being assigned belongs to requester's department AND the case belongs to requester's department
- Enforce lead investigator uniqueness (only one active lead per case)

#### Router Requirements

- `POST /cases/{case_id}/assignments` — requires admin case permission, or lead investigator, or department_head, or admin/superadmin. Status 201.
- `GET /cases/{case_id}/assignments` — requires read case access. Status 200.
- `DELETE /cases/{case_id}/assignments/{assignment_id}` — requires admin case permission, or department_head, or admin/superadmin. Status 200 with confirmation message.

#### Migration Requirements

Create migration for the partial unique index on `case_officers` if not already present. Include `downgrade()`.

---

### FEATURE 3 — SUSPECT CASE RELATIONS

#### Endpoints to Implement

- `POST /cases/{case_id}/suspects/{suspect_id}` — Link suspect to case
- `DELETE /cases/{case_id}/suspects/{suspect_id}` — Unlink suspect from case
- `GET /cases/{case_id}/suspects` — List suspects linked to this case

#### ORM Changes

Verify `CaseSuspects` model exists with:
- `id` (PK)
- `case_id` (FK → case)
- `suspect_id` (FK → suspect)
- `notes` (Text, optional)
- `added_at` (DateTime)
- `added_by` (FK → officer)
- `deleted_at` (DateTime, nullable) — if project uses soft delete on relations

#### Schema Requirements

`CaseSuspectLinkRequest`:
- `notes` (str, optional)

`CaseSuspectResponse`:
- All `CaseSuspects` fields
- Include suspect detail (person name, risk_level, criminal_record)

#### Repository Requirements

- `add_suspect_to_case(case_id, suspect_id, added_by, notes)` — check for existing active link (404/409 as appropriate), insert row
- `remove_suspect_from_case(case_id, suspect_id)` — soft delete the relation if architecture uses soft delete; otherwise hard delete
- `list_case_suspects(case_id)` — return active relations with suspect and person joins

#### Service Requirements

- Validate suspect exists and is active (`deleted_at IS NULL`)
- Validate case exists and is not soft-deleted
- Prevent duplicate active links (409 if already linked)
- Require write case access (`check_case_access(officer, case, 'write')`)

#### Router Requirements

- `POST /cases/{case_id}/suspects/{suspect_id}` — write access required. Status 201.
- `DELETE /cases/{case_id}/suspects/{suspect_id}` — write access required. Status 200 with message.
- `GET /cases/{case_id}/suspects` — read access required. Status 200 with paginated list.

---

### FEATURE 4 — VICTIM & WITNESS CASE RELATIONS

#### Endpoints to Implement

- `POST /cases/{case_id}/victims/{victim_id}`
- `DELETE /cases/{case_id}/victims/{victim_id}`
- `GET /cases/{case_id}/victims`
- `POST /cases/{case_id}/witnesses/{witness_id}`
- `DELETE /cases/{case_id}/witnesses/{witness_id}`
- `GET /cases/{case_id}/witnesses`

#### Implementation Requirements

Mirror the implementation of Feature 3 (Suspect Case Relations) exactly, substituting:
- `Victim` model and `CaseVictims` join table for victims
- `Witness` model and `CaseWitnesses` join table for witnesses

Victim response must include: `victim_id`, person name, `notes`
Witness response must include: `witness_id`, person name, `credibility_notes`, `is_protected`

Same access control as suspects: write access required for POST/DELETE, read access for GET.

Validation: victim must exist and not be soft-deleted before linking. Witness must exist and not be soft-deleted before linking. Prevent duplicate active links.

---

### FEATURE 5 — CHARGE MANAGEMENT

#### Endpoints to Implement

- `POST /cases/{case_id}/charges` — File a new charge
- `GET /cases/{case_id}/charges` — List all charges for a case
- `GET /charges/{charge_id}` — Get single charge detail
- `PUT /charges/{charge_id}` — Update charge fields
- `PATCH /charges/{charge_id}/status` — Advance charge status
- `DELETE /charges/{charge_id}` — Drop a filed charge

#### ORM Changes

Verify `Charge` model exists with all required columns. If any are missing, add via migration:
- `charge_id` (PK)
- `case_id` (FK → case)
- `court_case_id` (FK → court_case, nullable)
- `suspect_id` (FK → suspect)
- `crime_type_id` (FK → crime_type)
- `description` (Text, required)
- `filed_at` (DateTime)
- `filed_by` (FK → officer)
- `status` (chargestatusenum)
- `created_at` (DateTime)
- `updated_at` (DateTime, nullable)
- `deleted_at` (DateTime, nullable)

#### Schema Requirements

`ChargeCreateRequest`:
- `suspect_id` (int, required)
- `crime_type_id` (int, required)
- `description` (str, required)
- `court_case_id` (int, optional)

`ChargeUpdateRequest` (all fields optional):
- `description` (str)
- `crime_type_id` (int)
- `court_case_id` (int)

`ChargeStatusUpdateRequest`:
- `status` (chargestatusenum, required)

`ChargeResponse`:
- All charge fields
- Include: `suspect` (person name), `crime_type` (name), `verdict` (if applicable)

#### Repository Requirements

- `create_charge(case_id, data, filed_by)` — inserts Charge, inserts CaseUpdate in same transaction
- `list_charges_by_case(case_id, filters)` — joins Suspect, Person, CrimeType; supports optional filters for `suspect_id` and `status`
- `get_charge_by_id(charge_id)` — 404 if not found or `deleted_at IS NOT NULL`
- `update_charge(charge_id, data)` — partial update, sets `updated_at`
- `update_charge_status(charge_id, new_status, updated_by)` — updates status, inserts CaseUpdate
- `drop_charge(charge_id)` — sets `status = 'dropped'` (NOT `deleted_at`), inserts CaseUpdate

#### Service Requirements

- `POST /cases/{case_id}/charges` — roles: `legal_officer`, `admin`, `superadmin` only
  - Verify suspect is linked to case via `CaseSuspects`
  - Verify `crime_type_id` exists
  - If `court_case_id` provided: verify it belongs to this case
  - Status initialized to `'filed'` — reject if status field submitted at creation
- `PATCH /charges/{charge_id}/status` — roles: `legal_officer`, `admin`, `superadmin` only
  - Valid transitions: `filed` → `pending` ✓, `filed` → `dismissed` ✓, `pending` → `convicted` ✓, `pending` → `acquitted` ✓, `pending` → `dismissed` ✓
  - Terminal statuses (`convicted`, `acquitted`, `dismissed`): reject any further transition with 409
  - If status → `convicted` and no `Sentence` exists: include `warnings: ["Charge marked convicted but no sentence has been recorded"]` in response
- `DELETE /charges/{charge_id}` — roles: `legal_officer`, `admin`, `superadmin` only
  - Charge must be in `'filed'` status — 422 if not
  - No Sentence linked — 409 if found
  - Sets `status = 'dropped'` (soft status change, not hard delete, not `deleted_at`)

#### Router Requirements

- `POST /cases/{case_id}/charges` — Status 201
- `GET /cases/{case_id}/charges` — Status 200, paginated
- `GET /charges/{charge_id}` — Status 200
- `PUT /charges/{charge_id}` — Status 200
- `PATCH /charges/{charge_id}/status` — Status 200
- `DELETE /charges/{charge_id}` — Status 200 with updated charge object

---

### FEATURE 6 — ARREST MANAGEMENT

#### Endpoints to Implement

- `POST /cases/{case_id}/arrests` — Record an arrest linked to a case
- `GET /cases/{case_id}/arrests` — List all arrests for a case
- `GET /arrests/{arrest_id}` — Get single arrest detail
- `PUT /arrests/{arrest_id}` — Update mutable arrest fields
- `DELETE /arrests/{arrest_id}` — Soft delete an arrest record

#### ORM Changes

Verify `Arrest` model has all columns. If any are missing, add via migration:
- `arrest_id` (PK)
- `suspect_id` (FK → suspect)
- `officer_id` (FK → officer) — arresting officer
- `case_id` (FK → case, nullable)
- `booking_number` (varchar(100), unique, nullable)
- `location_id` (FK → location, nullable)
- `bail_amount` (Decimal(12,2), nullable)
- `bail_set_at` (DateTime, nullable)
- `date` (DateTime, required) — arrest datetime
- `released_at` (DateTime, nullable)
- `notes` (Text, nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime, nullable)
- `deleted_at` (DateTime, nullable)

#### Schema Requirements

`ArrestCreateRequest`:
- `suspect_id` (int, required)
- `arrested_by_officer_id` (int, required)
- `arrest_location_id` (int, optional)
- `arrest_datetime` (datetime, required — must not be in the future)
- `arrest_reason` (str, optional)
- `booking_number` (str, optional — globally unique)
- `bail_amount` (Decimal, optional, non-negative)
- `notes` (str, optional)

`ArrestUpdateRequest` (all optional):
- `bail_amount` (Decimal)
- `notes` (str)
- `released_at` (datetime)

Immutable fields: `suspect_id`, `officer_id`, `date`, `booking_number`, `case_id` — reject with 422 if submitted in update request.

`ArrestResponse`:
- All arrest fields
- Include: suspect person name, arresting officer name, location name

#### Repository Requirements

- `create_arrest(case_id, data, created_by)` — inserts Arrest; if case_id provided, also auto-links suspect to case if not already linked via CaseSuspects; inserts CaseUpdate
- `list_arrests_by_case(case_id)` — paginated, joins Suspect, Person, Officer, Location
- `get_arrest_by_id(arrest_id)` — 404 if not found or soft-deleted
- `update_arrest(arrest_id, data)` — partial update of mutable fields only; sets `updated_at`
- `soft_delete_arrest(arrest_id)` — sets `deleted_at = now()`

#### Service Requirements

- Validate suspect exists and is active
- Validate officer (`arrested_by_officer_id`) exists and is active
- Validate location exists if `arrest_location_id` provided
- If case_id provided: validate case exists and requester has write access
- `booking_number` uniqueness check (409 if duplicate)
- `arrest_datetime` must not be in the future (422)
- On update: `released_at` must not be before `arrest.date` (422); once set cannot be unset (409)
- Roles for create/update: `investigator`, `department_head`, `admin`, `superadmin`
- Roles for delete: `admin` or `superadmin`

#### Router Requirements

- `POST /cases/{case_id}/arrests` — Status 201
- `GET /cases/{case_id}/arrests` — Status 200, paginated
- `GET /arrests/{arrest_id}` — Status 200
- `PUT /arrests/{arrest_id}` — Status 200
- `DELETE /arrests/{arrest_id}` — Status 204

---

### FEATURE 7 — EVIDENCE MANAGEMENT

#### Endpoints to Implement

- `POST /cases/{case_id}/evidence` — Add evidence to a case
- `GET /cases/{case_id}/evidence` — List all evidence for a case
- `GET /evidence/{evidence_id}` — Get single evidence detail
- `PUT /evidence/{evidence_id}` — Update mutable evidence fields
- `DELETE /evidence/{evidence_id}` — Soft delete evidence

#### ORM Changes

Verify `Evidence` model has all required columns. If any are missing, add via migration:
- `evidence_id` (PK)
- `case_id` (FK → case)
- `evidence_type_id` (FK → evidence_type)
- `description` (Text, optional)
- `collected_at` (DateTime, required)
- `collected_by` (FK → officer)
- `storage_location` (varchar(255), optional)
- `is_sensitive` (Boolean, default False)
- `created_at` (DateTime)
- `updated_at` (DateTime, nullable)
- `deleted_at` (DateTime, nullable)

Add `EvidenceHistory` model if not already present (append-only audit):
- `history_id` (PK)
- `evidence_id` (FK → evidence)
- `changed_by` (FK → officer)
- `field_name` (varchar(100))
- `old_value` (Text)
- `new_value` (Text)
- `changed_at` (DateTime)

#### Schema Requirements

`EvidenceCreateRequest`:
- `evidence_type_id` (int, required)
- `description` (str, optional)
- `collected_at` (datetime, required — not in future, not before case date_reported)
- `storage_location` (str, optional)
- `is_sensitive` (bool, default False)

`EvidenceUpdateRequest` (all optional):
- `description` (str)
- `storage_location` (str)
- `is_sensitive` (bool)

Immutable fields (reject with 422 if submitted in update): `evidence_type_id`, `case_id`, `collected_at`, `collected_by`

`EvidenceResponse`:
- All evidence fields
- Include: `evidence_type` name, `collected_by` officer name

#### Repository Requirements

- `create_evidence(case_id, data, collected_by)` — inserts Evidence, inserts first ChainOfCustody entry with `action='collected'`, inserts CaseUpdate; all in one transaction
- `list_evidence_by_case(case_id)` — paginated; joins EvidenceType
- `get_evidence_by_id(evidence_id)` — 404 if not found or soft-deleted
- `update_evidence(evidence_id, data, updated_by)` — partial update; writes EvidenceHistory row per changed field; if `storage_location` changed, also inserts ChainOfCustody with `action='relocated'`; all in one transaction
- `soft_delete_evidence(evidence_id, deleted_by)` — sets `deleted_at = now()`, inserts ChainOfCustody with `action='decommissioned'`, inserts CaseUpdate

#### Service Requirements

- `POST`: require write case access; case must not be closed or soft-deleted; verify evidence_type_id exists
- `collected_at` must not be in the future (422) and must not be before `case.date_reported` (422)
- `PUT`: require write case access or forensic role; immutable field protection
- `DELETE`: require admin or superadmin role; if ChainOfCustody has `action='submitted_to_court'` → 409 unconditionally; if EvidenceHistory or Forensic_Report exists and requester is not superadmin → 409

#### Router Requirements

- `POST /cases/{case_id}/evidence` — Status 201
- `GET /cases/{case_id}/evidence` — Status 200, paginated
- `GET /evidence/{evidence_id}` — Status 200
- `PUT /evidence/{evidence_id}` — Status 200
- `DELETE /evidence/{evidence_id}` — Status 204

---

### FEATURE 8 — CHAIN OF CUSTODY

#### Endpoints to Implement

- `POST /evidence/{evidence_id}/chain` — Append a custody event
- `GET /evidence/{evidence_id}/chain` — Return full chain in chronological order

#### ORM Changes

Verify `ChainOfCustody` (or `EvidenceChainOfCustody`) model has:
- `chain_id` (PK)
- `evidence_id` (FK → evidence)
- `officer_id` (FK → officer) — officer recording the event
- `action` (varchar(100)) — one of: collected, transferred, analyzed, stored, returned, destroyed, submitted_to_court, relocated, decommissioned
- `transferred_to` (FK → officer, nullable)
- `location_id` (FK → location, nullable)
- `notes` (Text, nullable)
- `created_at` (DateTime)

**This table is append-only. No updates or deletes are ever permitted.** Enforce with a DB trigger as described in the migration requirements below.

#### Schema Requirements

`ChainOfCustodyCreateRequest`:
- `action` (str, required — validated against allowed list; `'collected'` is reserved and must be rejected with 422 if submitted)
- `transferred_to` (int, optional — officer FK, required if action = 'transferred')
- `location_id` (int, optional)
- `notes` (str, optional)

`ChainOfCustodyResponse`:
- All fields
- Include: officer name, transferred_to officer name (if present), location name (if present)

#### Repository Requirements

- `append_custody_event(evidence_id, action, officer_id, data)` — inserts one row; never updates
- `get_full_chain(evidence_id)` — returns all rows ordered by `created_at ASC`; no pagination (full chain must always be visible)

#### Service Requirements

- Validate action is not `'collected'` — 422 if so
- Validate evidence exists and is not soft-deleted
- Validate officer has read access to parent case
- Validate `transferred_to` officer exists if provided
- Validate `location_id` exists if provided
- If `action='submitted_to_court'`: also insert a `CaseUpdate` row on the parent case
- Require case write access or forensic role for POST

#### Migration Requirements

If the append-only trigger does not already exist, create it in the migration:
```sql
CREATE OR REPLACE FUNCTION prevent_audit_table_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modifications to this table are not permitted. It is append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chain_of_custody_immutable
BEFORE UPDATE OR DELETE ON chain_of_custody
FOR EACH ROW EXECUTE FUNCTION prevent_audit_table_modification();
```
Include corresponding `DROP TRIGGER` and `DROP FUNCTION` in `downgrade()`.

#### Router Requirements

- `POST /evidence/{evidence_id}/chain` — Status 201
- `GET /evidence/{evidence_id}/chain` — Status 200, full list (no pagination)

---

### FEATURE 9 — CASE NOTES

#### Endpoints to Implement

- `POST /cases/{case_id}/notes` — Create a note
- `GET /cases/{case_id}/notes` — List notes for a case
- `PUT /notes/{note_id}` — Update a note
- `DELETE /notes/{note_id}` — Soft delete a note

#### ORM Changes

Verify `CaseNote` model has:
- `note_id` (PK)
- `case_id` (FK → case)
- `officer_id` (FK → officer)
- `note_text` (Text, required)
- `is_internal` (Boolean, default False)
- `created_at` (DateTime)
- `updated_at` (DateTime, nullable)
- `deleted_at` (DateTime, nullable)

#### Schema Requirements

`CaseNoteCreateRequest`:
- `note_text` (str, required, non-empty)
- `is_internal` (bool, default False)

`CaseNoteUpdateRequest`:
- `note_text` (str, optional)
- `is_internal` (bool, optional)

`CaseNoteResponse`:
- All fields
- Include: officer name

#### Repository Requirements

- `create_note(case_id, officer_id, data)` — inserts CaseNote
- `list_notes_by_case(case_id, requester_role, requester_officer_id)` — returns active notes; for non-admin roles, filter `is_internal=True` notes to only those created by the requesting officer
- `get_note_by_id(note_id)` — 404 if not found or soft-deleted
- `update_note(note_id, data)` — partial update; sets `updated_at`
- `soft_delete_note(note_id)` — sets `deleted_at = now()`

#### Service Requirements

- `POST`: require read case access (any officer with case access can add a note); case must not be soft-deleted
- `GET`: `is_internal=True` notes are visible only to the note author and officers with admin case access, department_head of case dept, admin, superadmin
- `PUT` / `DELETE`: only the officer who created the note may update/delete it, OR admin/superadmin may do so

#### Router Requirements

- `POST /cases/{case_id}/notes` — Status 201
- `GET /cases/{case_id}/notes` — Status 200, paginated
- `PUT /notes/{note_id}` — Status 200
- `DELETE /notes/{note_id}` — Status 204

---

### FEATURE 10 — ADVANCED CASE QUERIES

#### Endpoints to Implement

- `GET /cases/{case_id}/timeline` — Chronological case event log
- `GET /cases/{case_id}/full-details` — Full composite case detail
- `GET /cases/search` — Advanced case search

#### 10a — Case Timeline

Endpoint: `GET /cases/{case_id}/timeline`

Returns all `CaseUpdate` rows for a case in chronological order.

Schema `CaseTimelineResponse`:
- `update_id`, `update_type`, `description`, `created_at`
- Include: officer name (first_name + last_name from Person join)

Repository:
- `get_case_timeline(case_id, update_type_filter)` — query CaseUpdate where `case_id = ?`, join Officer and Person for officer name; optional `update_type` filter; order by `created_at DESC`; apply pagination

Access control: any officer with read case access, or department_head, or admin/superadmin.

#### 10b — Full Case Details

Endpoint: `GET /cases/{case_id}/full-details`

Returns a composite object containing all available case data in a single response:

```
{
  "case": { ...all case fields... },
  "status": { ...case status... },
  "department": { ...department... },
  "crime_type": { ...crime type... },
  "location": { ...location... },
  "created_by": { ...officer name... },
  "officers": [ ...list of active assignments with roles... ],
  "suspects": [ ...linked suspects with person detail... ],
  "victims": [ ...linked victims with person detail... ],
  "witnesses": [ ...linked witnesses with person detail... ],
  "charges": [ ...charges with crime type and status... ],
  "arrests": [ ...arrests with officer and location... ],
  "evidence": [ ...evidence items with type... ],
  "notes": [ ...public notes only, unless requester has admin access... ],
  "recent_updates": [ ...last 10 CaseUpdate rows... ]
}
```

Repository:
- `get_full_case_details(case_id, requester)` — runs all sub-queries efficiently (use `selectinload` or `joinedload` where appropriate); assembles and returns composite dict

Access control: same as `GET /cases/{case_id}` — requires read case access.

#### 10c — Case Search

Endpoint: `GET /cases/search`

Query parameters (all optional):
- `q` — free-text search on case title (ILIKE)
- `case_number` — exact match on `case_id`
- `suspect_name` — ILIKE match on Person first_name or last_name, joined via Suspect → CaseSuspects
- `officer_id` — filter by assigned officer (CaseOfficers)
- `department_id` — filter by case department (admin/superadmin only; department_head sees only their dept)
- `crime_type_id` — filter by crime_type_id
- `status_id` — filter by status_id
- `severity` — filter by crime_type.severity (join Crime_Type)
- `date_from` — filter `date_reported >= date_from`
- `date_to` — filter `date_reported <= date_to`
- `page` (default 1)
- `size` (default 20, max 100)
- `sort_by` — one of: `date_reported`, `created_at`, `title`, `status` (default: `created_at`)
- `sort_order` — `asc` or `desc` (default: `desc`)

Response: paginated case list matching the standard pagination envelope (`items`, `total`, `page`, `size`).

Repository:
- `search_cases(filters, requester)` — builds a dynamic SQLAlchemy query applying only the filters that are provided; applies role-based visibility scoping (same rules as `GET /cases`); applies sort and pagination

**IMPORTANT**: Register `GET /cases/search` BEFORE `GET /cases/{case_id}` in the router to prevent FastAPI route conflict. The search route must be declared first.

Access control: same visibility scoping as `GET /cases` — role-based, as described in the specification.

---

## STEP 4 — MIGRATION REQUIREMENTS

### General Rules for All Migrations

- Before writing any migration, inspect all existing migrations to confirm what already exists.
- Use `op.create_table()` only for tables confirmed to be missing.
- Use `op.add_column()` only for columns confirmed to be missing from existing tables.
- Use `op.create_index()` and `op.create_unique_constraint()` only for constraints confirmed to be missing.
- Every migration MUST have a working `downgrade()` function that reverses every change.
- Use `IF NOT EXISTS` checks where possible to make migrations idempotent.
- Preserve enum naming convention already in use across the project.
- Use the same import style for `sa`, `op` as existing migration files.

### Required Indexes (create only if missing)

```sql
-- Search performance
CREATE INDEX idx_case_suspects_case ON case_suspects (case_id);
CREATE INDEX idx_case_suspects_suspect ON case_suspects (suspect_id);
CREATE INDEX idx_case_victims_case ON case_victims (case_id);
CREATE INDEX idx_case_witnesses_case ON case_witnesses (case_id);
CREATE INDEX idx_charge_case ON charge (case_id);
CREATE INDEX idx_charge_suspect ON charge (suspect_id);
CREATE INDEX idx_arrest_case ON arrest (case_id);
CREATE INDEX idx_arrest_suspect ON arrest (suspect_id);
CREATE INDEX idx_evidence_case ON evidence (case_id);
CREATE INDEX idx_chain_of_custody_evidence ON chain_of_custody (evidence_id);
CREATE INDEX idx_case_note_case ON case_note (case_id);
CREATE INDEX idx_case_update_case ON case_update (case_id);

-- Soft delete filtering
CREATE INDEX idx_charge_deleted ON charge (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_arrest_deleted ON arrest (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_evidence_deleted ON evidence (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_note_deleted ON case_note (deleted_at) WHERE deleted_at IS NULL;

-- Active arrest tracking
CREATE INDEX idx_arrest_released ON arrest (case_id) WHERE released_at IS NULL;
```

### Required Unique Constraints (create only if missing)

```sql
-- One lead investigator per case
CREATE UNIQUE INDEX uq_case_lead_investigator
ON case_officers (case_id)
WHERE role_in_case = 'lead_investigator' AND removed_at IS NULL;

-- Unique booking number
ALTER TABLE arrest ADD CONSTRAINT uq_arrest_booking_number UNIQUE (booking_number);
```

### Append-Only Triggers

Apply append-only enforcement to: `case_update`, `chain_of_custody`, `officer_history`, `person_history`, `evidence_history`.

If triggers already exist, skip. Do not recreate existing triggers.

---

## STEP 5 — PERMISSIONS & RBAC REQUIREMENTS

### Use the Existing Permission Infrastructure

Do NOT create a new permission system. Use `check_case_access(officer, case, minimum_level)` exactly as defined in the existing codebase.

### Permission Matrix for New Endpoints

| Endpoint | Required Permission |
|---|---|
| PUT /cases/{case_id} | write or admin case access, OR lead_investigator, OR department_head (own dept), OR admin/superadmin |
| PATCH /cases/{case_id}/status | same as PUT |
| DELETE /cases/{case_id} | superadmin only |
| POST /cases/{case_id}/assignments | admin case access, OR lead_investigator, OR department_head, OR admin/superadmin |
| GET /cases/{case_id}/assignments | read case access |
| DELETE /cases/{case_id}/assignments/{id} | admin case access, OR department_head, OR admin/superadmin |
| POST /cases/{case_id}/suspects/{id} | write case access |
| DELETE /cases/{case_id}/suspects/{id} | write case access |
| GET /cases/{case_id}/suspects | read case access |
| POST /cases/{case_id}/victims/{id} | write case access |
| DELETE /cases/{case_id}/victims/{id} | write case access |
| GET /cases/{case_id}/victims | read case access |
| POST /cases/{case_id}/witnesses/{id} | write case access |
| DELETE /cases/{case_id}/witnesses/{id} | write case access |
| GET /cases/{case_id}/witnesses | read case access |
| POST /cases/{case_id}/charges | legal_officer, admin, superadmin |
| GET /cases/{case_id}/charges | read case access OR legal_officer |
| GET /charges/{charge_id} | read case access OR legal_officer |
| PUT /charges/{charge_id} | legal_officer, admin, superadmin |
| PATCH /charges/{charge_id}/status | legal_officer, admin, superadmin |
| DELETE /charges/{charge_id} | legal_officer, admin, superadmin |
| POST /cases/{case_id}/arrests | investigator, department_head (own dept), admin, superadmin |
| GET /cases/{case_id}/arrests | read case access |
| GET /arrests/{arrest_id} | investigator+ with read case access, OR admin/superadmin |
| PUT /arrests/{arrest_id} | investigator+ with write case access, OR admin/superadmin |
| DELETE /arrests/{arrest_id} | admin or superadmin |
| POST /cases/{case_id}/evidence | write case access |
| GET /cases/{case_id}/evidence | read case access |
| GET /evidence/{evidence_id} | read case access |
| PUT /evidence/{evidence_id} | write case access OR forensic role |
| DELETE /evidence/{evidence_id} | admin or superadmin |
| POST /evidence/{evidence_id}/chain | write case access OR forensic role |
| GET /evidence/{evidence_id}/chain | read case access |
| POST /cases/{case_id}/notes | read case access (any officer with access) |
| GET /cases/{case_id}/notes | read case access |
| PUT /notes/{note_id} | note author, OR admin/superadmin |
| DELETE /notes/{note_id} | note author, OR admin/superadmin |
| GET /cases/{case_id}/timeline | read case access |
| GET /cases/{case_id}/full-details | read case access |
| GET /cases/search | authenticated officer (scoped by role) |

### JWT Dependency

All new endpoints MUST use the same `get_current_officer` dependency already used by the Personnel and Department modules. Do not create a new authentication dependency.

### Active User Validation

All new endpoints inherit active user validation through `get_current_officer`. Do not add redundant checks.

---

## STEP 6 — REPOSITORY & SERVICE LAYERING REQUIREMENTS

### Repository Layer Rules

- Repositories contain ONLY database access logic (queries, inserts, updates).
- Repositories NEVER contain business rule validation.
- All methods must be `async`.
- All methods must accept a SQLAlchemy `AsyncSession` as a parameter (or via dependency injection as already done in the project).
- Use `select()`, `update()`, `insert()` via SQLAlchemy ORM (not raw SQL) unless the existing codebase already uses raw SQL — mirror whatever is already in use.
- Soft delete filtering: ALL list queries MUST filter `deleted_at IS NULL` unless the method is explicitly a "get including deleted" variant.
- Pagination: use the same paginator function/utility already in use (e.g., `Paginator`, `paginate_query`, or equivalent). Do not implement a new pagination helper.

### Service Layer Rules

- Services contain ALL business logic, validation, orchestration, and cross-entity checks.
- Services call repositories — never access the database directly.
- Services raise typed exceptions using the same exception classes already defined in the project.
- Transactions that span multiple inserts (e.g., create case + create case update + create case permission) must use a single `async with session.begin()` block or the equivalent pattern already used in the project.
- Services NEVER return HTTP responses — they return domain objects or raise exceptions.

### Router Layer Rules

- Routers contain ONLY request parsing, dependency injection, and response formatting.
- All business logic lives in the service layer.
- Routers call services and convert results to response schemas.
- All new routers must be registered in `app/main.py` (or the equivalent router aggregation file) with the same `prefix` and `tags` convention used by existing modules.
- Use the same `Depends(get_current_officer)` injection pattern already in use.
- Use the same `response_model=...` declaration pattern already in use.

---

## STEP 7 — RESPONSE FORMAT REQUIREMENTS

All new endpoints MUST use the existing response envelope conventions. Study the Personnel and Department module response schemas and mirror them exactly.

### Pagination Response Envelope

All list endpoints must return:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 20
}
```

Use the same pagination schema class already defined in the project. Do not create a new one.

### Error Response Format

All errors must use the existing error format:
```json
{ "detail": "Error message here" }
```

Validation errors:
```json
{ "detail": [{ "loc": ["field_name"], "msg": "error message" }] }
```

Do not create new exception handlers. Use the existing ones.

### HTTP Status Codes

| Action | Status Code |
|---|---|
| Successful creation | 201 Created |
| Successful retrieval | 200 OK |
| Successful update | 200 OK |
| Successful soft delete (no body returned) | 204 No Content |
| Successful soft delete (body returned) | 200 OK |
| Not found | 404 Not Found |
| Validation failure | 422 Unprocessable Entity |
| Auth failure | 401 Unauthorized |
| Permission failure | 403 Forbidden |
| Business logic conflict | 409 Conflict |

---

## STEP 8 — OPENAPI DOCUMENTATION REQUIREMENTS

All new endpoints must be fully documented through Pydantic schemas and FastAPI route declarations. Do not write separate documentation.

### Requirements

- Every router must declare `tags=["Case Management"]` (or the tag convention already in use for the case module).
- Every route must declare a `summary` parameter with a concise human-readable description.
- Every Pydantic schema used as `response_model` must have field-level `description` annotations.
- All enums used in request/response schemas must use the existing Python enum classes — not string literals.
- FastAPI generates OpenAPI automatically from schemas — ensure all schemas are correctly typed so the generated docs are accurate.

---

## STEP 9 — AUDIT & HISTORY REQUIREMENTS

### CaseUpdate (Append-Only Event Log)

The following operations MUST insert a `CaseUpdate` row:
- Case status change
- Case soft delete
- Officer assigned or removed
- Suspect/victim/witness linked or unlinked
- Charge filed, status changed, or dropped
- Arrest recorded
- Evidence added, relocated, or decommissioned
- Chain of custody event recorded
- Evidence submitted to court
- Case note added (optional — add if existing patterns do so)

`CaseUpdate` is append-only. Its DB trigger must prevent any UPDATE or DELETE operation.

### EvidenceHistory (Append-Only Field Audit)

Every field change on `Evidence` that is mutable (`description`, `storage_location`, `is_sensitive`) must insert a row into `EvidenceHistory` capturing:
- `field_name`
- `old_value` (cast to string)
- `new_value` (cast to string)
- `changed_by` (officer_id)
- `changed_at` (now())

`EvidenceHistory` is append-only.

---

## STEP 10 — ROUTE REGISTRATION

After implementing each feature, ensure its router is registered. Open `app/main.py` (or equivalent) and add the include statement using the exact pattern already used for Personnel and Department routers.

Example pattern (mirror exactly what is already there):
```python
app.include_router(case_assignments_router, prefix="/api/v1", tags=["Case Management"])
app.include_router(case_suspects_router, prefix="/api/v1", tags=["Case Management"])
# ... etc
```

Verify that `GET /cases/search` is registered BEFORE `GET /cases/{case_id}` to prevent FastAPI routing conflicts (static routes must precede parameterized routes).

---

## STEP 11 — FINAL CHECKLIST BEFORE MARKING COMPLETE

Before considering any feature complete, verify all of the following:

### Database Layer
- [ ] All required columns exist in ORM models
- [ ] All required migrations created with working `upgrade()` and `downgrade()`
- [ ] All required indexes and constraints created
- [ ] Append-only triggers applied where required

### ORM Layer
- [ ] All models updated with correct column types and relationships
- [ ] No duplicate model definitions
- [ ] Soft delete columns present on all required models
- [ ] Audit timestamp columns present on all required models

### Schema Layer
- [ ] Create, Update, and Response schemas defined for every entity
- [ ] All immutable fields protected (422 on attempt to modify)
- [ ] Enums use existing Python enum classes
- [ ] Pagination schemas reuse existing class

### Repository Layer
- [ ] All CRUD operations implemented as async methods
- [ ] Soft delete filter applied on all list queries
- [ ] Pagination applied on all list queries
- [ ] No business logic in repositories

### Service Layer
- [ ] All business rule validations implemented
- [ ] All cross-entity checks implemented
- [ ] Multi-insert operations wrapped in single transactions
- [ ] CaseUpdate rows inserted for all required operations
- [ ] Audit history rows inserted for all required operations

### Router Layer
- [ ] All endpoints declared with correct HTTP methods and paths
- [ ] All endpoints use `get_current_officer` dependency
- [ ] All endpoints use correct `response_model`
- [ ] All endpoints have `summary` and `tags`
- [ ] All routers registered in main.py
- [ ] Search route registered before parameterized case route

### Permissions Layer
- [ ] `check_case_access` used for all case-scoped endpoints
- [ ] Department head scoping enforced for cross-department operations
- [ ] Superadmin-only operations protected correctly
- [ ] No endpoint accessible without authentication

---

## APPENDIX — ARCHITECTURE DRIFT PREVENTION

The following anti-patterns are strictly prohibited. If you find yourself doing any of these, stop and re-read this instruction file:

1. Defining business logic inside a router function
2. Querying the database directly from a router or service without going through the repository
3. Creating a new base exception class when one already exists
4. Creating a new pagination utility when one already exists
5. Creating a new `get_current_officer` dependency variant
6. Using `session.execute(text(...))` raw SQL when ORM queries already exist in the project
7. Importing models or schemas from a module that doesn't yet exist (create it first)
8. Using synchronous SQLAlchemy session methods (`session.query(...)`) when the project uses async sessions
9. Inserting data into an append-only table via UPDATE instead of INSERT
10. Checking permissions inside a repository
11. Registering a router but forgetting to add it to `app/main.py`
12. Creating a new Alembic migration without first inspecting existing migrations for conflicts

---

End of Instruction.md
CCMS Backend — Case Management Completion Directive
Version 3.0 | For use with Cursor Agents (Gemini, Antigravity, Auto, Planning Mode)