# Instruction.md — CCMS Backend: Module 5 Completion & Module 6 Implementation

---

## 1. PROJECT CONTEXT

This is a FastAPI-based Centralized Crime Management System (CCMS) backend.
The database is PostgreSQL 15+. The session store and cache is Redis 7+.
Authentication uses JWT (HS256) with bcrypt password hashing.

The following modules are already fully implemented and must not be modified
unless explicitly required by these instructions:

- Module 0: Reference Data (locations, crime types, case statuses)
- Module 1: Auth & Session Management
- Module 2: Personnel (persons, officers, suspects, victims, witnesses)
- Module 3: Departments
- Module 4: Cases (cases, officer assignments, suspects, victims, witnesses,
  charges, arrests, evidence, chain of custody, notes, timelines, search,
  full details)

The Case Management Module is mostly implemented. The existing routes MUST NOT
be recreated. The agent must INSPECT and EXTEND the existing implementation.

The database schema is defined in V3_Relational_Diagram and CCMS_V3_CORE_LOGIC.
All schema decisions must be consistent with these documents.

---

## 2. EXISTING ARCHITECTURE RULES

Before writing any code, the agent MUST read and understand the existing
codebase structure. The following rules are non-negotiable and apply to every
task in this document.

ARCHITECTURE COMPLIANCE:

- Follow the existing project directory structure exactly.
- Inspect existing modules before writing any code.
- Preserve all existing coding patterns, naming conventions, and file layouts.
- Reuse all existing shared utilities without modification.
- Reuse the existing get_current_officer auth dependency on every protected
  endpoint.
- Reuse the existing pagination pattern: page (default 1, min 1), size
  (default 20, max 100). All paginated responses return:
  { "items": [...], "total": N, "page": N, "size": N }
- Reuse the existing repository and service layer structure.
- Reuse the existing schema structure with full DTO separation:
    - schemas/requests.py for all input schemas
    - schemas/responses.py for all output schemas
- Do not introduce architectural rewrites or structural changes to existing
  modules.
- Use Async SQLAlchemy consistently throughout. Do not introduce synchronous
  DB calls.
- Use Alembic for all schema changes. Never modify the database schema
  directly.
- Do not duplicate repository logic. If a method already exists in a
  repository, reuse it.
- Preserve the current router structure and router registration patterns.
- Preserve soft-delete behavior on all entity tables. Soft-deleted records
  use deleted_at TIMESTAMP NULL (NULL = active). Hard deletes are never
  performed on any table that participates in audit trails.
- Preserve append-only audit behavior. Case_Update, Chain_of_Custody,
  Officer_History, Person_History, and Evidence_History are append-only.
  Never update or delete rows in these tables.
- Preserve current permission patterns: role-based access and case-level
  permission checks using check_case_access(officer, case, minimum_level).
- Maintain production-grade validation on all inputs.
- Maintain transaction safety. All operations that touch multiple tables must
  be wrapped in a single database transaction.
- Maintain department-based authorization. Department heads are always scoped
  to their own department_id.
- Maintain role-based authorization using the existing role hierarchy:
  readonly < forensic < legal_officer < investigator < department_head
  < admin < superadmin

ERROR ENVELOPE:

All errors must return:
  { "detail": "message" }
Validation errors must return:
  { "detail": [{ "loc": ["field_name"], "msg": "error message" }] }

PROHIBITED ACTIONS (apply to all agents on all tasks):

- Do NOT generate any test files.
- Do NOT write pytest code.
- Do NOT create mock objects or mock utilities.
- Do NOT create a tests/ folder or any subdirectory of it.
- Do NOT generate test utilities, test fixtures, or test factories.
- Do NOT write conftest.py or any pytest configuration.
- Agents must produce only production source code.

---

## 3. EXISTING MODULE INSPECTION REQUIREMENTS

Before implementing any feature, the agent MUST perform the following
inspection steps and act on what it finds.

STEP 1 — Read the existing module structure:
- Identify the directory layout for an existing completed module (e.g., auth
  or personnel).
- Confirm the placement of: routers, services, repositories, schemas
  (requests and responses), models, and migrations.
- Apply this exact layout to all new and extended modules.

STEP 2 — Read the existing evidence module:
- Locate all existing evidence routes:
    POST /cases/{case_id}/evidence
    GET /cases/{case_id}/evidence
    PUT /cases/{case_id}/evidence/{evidence_id}
    POST /cases/{case_id}/evidence/{evidence_id}/chain
    GET /cases/{case_id}/evidence/{evidence_id}/chain
- Read the existing evidence router file completely.
- Read the existing evidence service file completely.
- Read the existing evidence repository file completely.
- Read the existing evidence schema files (requests.py and responses.py)
  completely.
- Read the existing Evidence and Chain_of_Custody model definitions.
- Identify exactly what is implemented and what is missing.
- Do NOT recreate anything that already exists.

STEP 3 — Read the existing case timeline system:
- Locate the Case_Update model and its repository methods.
- Confirm the method signatures used to insert timeline entries.
- All new timeline events must use the same method signatures.

STEP 4 — Read the existing case access check utility:
- Locate check_case_access(officer, case, minimum_level).
- Confirm its import path.
- Use this exact function for all access checks in Module 5 and Module 6.

STEP 5 — Read the existing pagination utility:
- Locate the shared pagination helper or base query pattern.
- Apply it identically in all new list endpoints.

STEP 6 — Read the existing Alembic configuration:
- Confirm the migrations directory and naming convention.
- Confirm how models are imported into env.py.
- All new migrations must follow this exact pattern.

---

## 4. MODULE 5 OBJECTIVES

Module 5 is the Evidence Module. It is partially implemented. The objective is
to complete and harden the existing implementation. The agent must not rebuild
what exists. The agent must inspect, identify gaps, and fill only those gaps.

The existing endpoints that must be preserved as-is (unless hardening requires
changes to their logic, not their signatures):

    POST /cases/{case_id}/evidence
    GET /cases/{case_id}/evidence
    PUT /cases/{case_id}/evidence/{evidence_id}
    POST /cases/{case_id}/evidence/{evidence_id}/chain
    GET /cases/{case_id}/evidence/{evidence_id}/chain

The following endpoints are defined in CCMS_V3_CORE_LOGIC and must be
implemented if not already present:

    GET  /evidence/{evidence_id}
    PATCH /evidence/{evidence_id}
    DELETE /evidence/{evidence_id}
    POST /evidence/{evidence_id}/vehicle
    POST /evidence/{evidence_id}/weapon
    GET  /evidence/{evidence_id}/custody
    POST /evidence/{evidence_id}/custody
    POST /evidence/{evidence_id}/forensic-report
    GET  /evidence/{evidence_id}/forensic-report
    GET  /cases/{case_id}/photos
    POST /cases/{case_id}/photos

---

## 5. MODULE 5 IMPLEMENTATION TASKS

TASK 5.1 — EVIDENCE VALIDATION HARDENING

Inspect the existing POST /cases/{case_id}/evidence and
PUT /cases/{case_id}/evidence/{evidence_id} implementations.
For each, verify the following validations are present. If any are missing,
add them without altering the existing logic around them.

Required validations for evidence creation:
- evidence_type_id: must reference an existing Evidence_Type row. Return 404
  EvidenceTypeNotFoundError if not found.
- collected_at: required. Must not be in the future. Must not be before
  Case.date_reported. Return 422 FutureCollectionDateError or
  CollectionBeforeCaseReportedError as appropriate.
- Case must not be closed (is_terminal = true on Case_Status). Return 409
  ClosedCaseModificationError.
- Case must not be soft-deleted. Return 404 CaseNotFoundError.
- collected_by is always set to the requesting officer's officer_id. It is
  not accepted from the request body.
- storage_location: optional string. No uniqueness constraint.
- description: optional text.
- is_sensitive: optional boolean, defaults to false.

Required validations for evidence update (PATCH):
- evidence_type_id, case_id, collected_at, collected_by are immutable.
  If any of these fields are present in the request body, return 422
  ImmutableFieldError immediately. Do not process the rest of the request.
- Evidence must not be soft-deleted. Return 404.
- Parent case must not be closed. Return 409 ClosedCaseModificationError.
- description and storage_location are the only mutable fields.

TASK 5.2 — EVIDENCE LIFECYCLE LOGIC

Inspect the existing evidence service. If the following behaviors are missing,
implement them.

Update restrictions:
- Once evidence has a Chain_of_Custody entry with action = 'submitted_to_court',
  storage_location cannot be changed. Return 409
  EvidenceSubmittedToCourtError.

Archived evidence:
- Soft-deleted evidence (deleted_at IS NOT NULL) must be excluded from all
  list queries.
- Soft-deleted evidence must return 404 on detail, update, and delete
  endpoints.

Department isolation:
- Evidence is accessed through its parent case. All department-scoped access
  checks must use the parent case's department_id, not a direct evidence
  department field.

Authorization enforcement:
- POST /cases/{case_id}/evidence: requires case write or admin permission,
  OR lead investigator assignment, OR department_head of case's department,
  OR admin/superadmin.
- PATCH /evidence/{evidence_id}: same as above, plus forensic role with case
  read access.
- DELETE /evidence/{evidence_id}: admin or superadmin only.
- GET /evidence/{evidence_id}: case read access, OR department_head of parent
  case's department.
- All access checks must use check_case_access with the appropriate
  minimum_level.

TASK 5.3 — CHAIN OF CUSTODY INTEGRITY

Inspect the existing chain of custody implementation. If the following
behaviors are missing, implement them.

Append-only behavior:
- Chain_of_Custody rows must never be updated or deleted. This is enforced
  at the database level by the existing trigger trg_chain_of_custody_immutable.
  The service layer must never attempt to update or delete these rows.

Chronological validation:
- Each new Chain_of_Custody entry must have a timestamp >= the timestamp of
  the most recent existing entry for the same evidence_id. Return 422
  ChronologyViolationError if this constraint is violated.

Action validation:
- The action field must be one of: collected, transferred, analyzed, stored,
  returned, destroyed, submitted_to_court, relocated, decommissioned.
- The action 'collected' is reserved for system use and must be rejected if
  submitted manually via POST /evidence/{evidence_id}/custody. Return 422
  ReservedCustodyActionError.

Transfer integrity:
- If action = 'transferred', the service must verify the receiving officer
  exists and is active (Officer.deleted_at IS NULL). Return 404
  OfficerNotFoundError if not.
- transferred_to officer_id must reference an active Officer row.

Duplicate transfer prevention:
- Do not add uniqueness constraints on custody actions. Multiple transfers
  are valid. However, the same action submitted within the same second by the
  same officer should be checked at the service level and rejected with 409
  DuplicateCustodyEntryError if an identical (evidence_id, officer_id, action,
  timestamp within 1 second) entry already exists.

Evidence existence validation:
- All custody operations must verify the evidence_id exists and is not
  soft-deleted before proceeding. Return 404 EvidenceNotFoundError.

TASK 5.4 — EVIDENCE QUERY OPTIMIZATION

Inspect all existing evidence query methods in the evidence repository.
Apply the following optimizations wherever they are missing.

- Use selectinload or joinedload for all relationship loading. Do not allow
  lazy loading on any evidence query that returns related objects.
- The GET /evidence/{evidence_id} endpoint must load in a single query or
  controlled set of queries: Evidence_Type, Chain_of_Custody (ordered ASC by
  timestamp), Forensic_Report, Vehicle, Weapon.
- The GET /cases/{case_id}/evidence list endpoint must not produce N+1 queries.
  Load evidence_type relationship eagerly.
- Chain_of_Custody list queries must join Officer and Person for officer name
  resolution in a single query.
- All repository query methods must be centralized in the evidence repository.
  Do not write inline query logic in the service or router layers.

TASK 5.5 — MISSING PERSISTENCE COMPONENTS

Inspect the following components. If any are missing, create them using the
existing module's style, structure, and naming conventions.

Evidence repository — verify these methods exist:
- get_evidence_by_id(evidence_id, include_deleted=False)
- get_evidence_by_case(case_id, pagination_params)
- create_evidence(data, session)
- update_evidence(evidence_id, data, changed_by, session)
- soft_delete_evidence(evidence_id, session)
- get_evidence_with_full_detail(evidence_id)

Evidence service — verify these methods exist:
- create_evidence(case_id, request_data, requesting_officer, session)
- update_evidence(evidence_id, request_data, requesting_officer, session)
- delete_evidence(evidence_id, requesting_officer, session)
- get_evidence_detail(evidence_id, requesting_officer, session)
- list_case_evidence(case_id, requesting_officer, pagination, session)

Chain of custody repository — verify these methods exist:
- get_custody_chain(evidence_id)
- add_custody_entry(data, session)
- get_latest_custody_entry(evidence_id)

Chain of custody service — verify these methods exist:
- add_custody_event(evidence_id, action, requesting_officer, notes, session)
- get_full_custody_chain(evidence_id, requesting_officer, session)

Evidence schemas — verify the following exist in schemas/requests.py:
- EvidenceCreateRequest
- EvidenceUpdateRequest
- CustodyEntryCreateRequest
- ForensicReportCreateRequest
- VehicleDetailCreateRequest
- WeaponDetailCreateRequest
- CrimeScenePhotoCreateRequest

Evidence schemas — verify the following exist in schemas/responses.py:
- EvidenceResponse
- EvidenceDetailResponse (includes custody chain, forensic report, vehicle,
  weapon)
- CustodyEntryResponse
- CustodyChainResponse
- ForensicReportResponse
- VehicleDetailResponse
- WeaponDetailResponse
- CrimeScenePhotoResponse

If any of the above are missing, create them following the existing schema
pattern exactly.

TASK 5.6 — TIMELINE INTEGRATION

All evidence-related events must be written to Case_Update using the existing
timeline insertion method. Inspect the existing Case_Update insertion utility
and use it for the following events:

- Evidence created:
  update_type = 'evidence_added'
  description = 'Evidence item #{evidence_id} ({type_name}) added'

- Evidence updated:
  update_type = 'evidence_updated'
  description = 'Evidence item #{evidence_id} updated by Officer {name}'

- Evidence storage location changed:
  update_type = 'evidence_updated'
  description = 'Evidence #{evidence_id} relocated from {old_location} to
  {new_location}'

- Evidence soft-deleted:
  update_type = 'evidence_updated'
  description = 'Evidence #{evidence_id} marked as decommissioned'

- Custody transfer recorded:
  update_type = 'evidence_custody_transfer'
  description = 'Custody of Evidence #{evidence_id} transferred. Action:
  {action}'

- Evidence submitted to court:
  update_type = 'evidence_submitted_to_court'
  description = 'Evidence #{evidence_id} submitted to court'

- Forensic report filed:
  update_type = 'forensic_report_filed'
  description = 'Forensic report filed for Evidence #{evidence_id} by Officer
  {name}'

All Case_Update inserts must be part of the same database transaction as the
triggering operation.

TASK 5.7 — AUDIT REQUIREMENTS

- Evidence_History must be written for every field that changes on an evidence
  update. One row per changed field. Fields: evidence_id, changed_by,
  field_name, old_value, new_value, changed_at = now().
- Evidence_History is append-only. The database trigger
  trg_evidence_history_immutable enforces this. Do not attempt to update or
  delete Evidence_History rows.
- Chain_of_Custody is append-only. Never update or delete custody rows.
- All custody entries must record officer_id = requesting officer's officer_id.
- The full audit trail from collection to decommission must be reconstructable
  from Chain_of_Custody alone for any evidence item.

---

## 6. MODULE 5 VALIDATION RULES

The following validation rules must be present in the evidence service or
enforced via Pydantic schemas. Apply them exactly.

Evidence creation:
- evidence_type_id: required. 404 if not found.
- collected_at: required. 422 if in the future. 422 if before
  Case.date_reported.
- Case must not be closed (Case_Status.is_terminal = true). 409.
- Case must not be soft-deleted. 404.
- collected_by: always requester.officer_id. Never from request body.

Evidence update:
- Immutable fields (evidence_type_id, case_id, collected_at, collected_by):
  422 ImmutableFieldError if present in request body.
- Evidence must not be soft-deleted. 404.
- Case must not be closed. 409.

Evidence deletion:
- Evidence with Chain_of_Custody action = 'submitted_to_court': 409 for any
  role. Cannot be deleted under any circumstance.
- Evidence with a Forensic_Report and requester is not superadmin: 409.
- Evidence already soft-deleted: 404.

Chain of custody:
- action = 'collected' submitted manually: 422 ReservedCustodyActionError.
- Invalid action value: 422.
- Evidence soft-deleted: 404.
- Timestamp chronology violation: 422 ChronologyViolationError.

Forensic report:
- findings: required, non-empty. 422 if missing.
- report_date: required, must be >= Evidence.collected_at. 422 if not.
- Duplicate forensic report for same evidence_id: 409
  DuplicateForensicReportError.

Vehicle detail:
- Evidence type must be 'vehicle'. 422 if not.
- Vehicle row for this evidence_id already exists: 409.
- plate_number: unique across Vehicle table if provided. 409 if duplicate.

Weapon detail:
- Evidence type must be 'weapon'. 422 if not.
- Weapon row for this evidence_id already exists: 409.
- serial_number: unique across Weapon table if provided. 409 if duplicate.

---

## 7. MODULE 5 DATABASE REQUIREMENTS

Inspect the existing Alembic migration history before creating any new
migrations.

Verify the following tables already exist. If any are missing, create an
Alembic migration:
- Evidence (evidence_id, case_id, evidence_type_id, description, collected_at,
  collected_by, storage_location, is_sensitive, created_at, updated_at,
  deleted_at)
- Evidence_Type (evidence_type_id, name, description, created_at)
- Chain_of_Custody (chain_id, evidence_id, officer_id, action, transferred_to,
  location_id, notes, created_at)
- Forensic_Report (report_id, evidence_id, officer_id, findings, methodology,
  report_date, lab_reference, created_at, updated_at)
- Vehicle (vehicle_id, evidence_id, plate_number, type, make, model, color,
  year, vin, description)
- Weapon (weapon_id, evidence_id, type, make, serial_number, caliber,
  description)
- Crime_Scene_Photo (photo_id, case_id, evidence_id, image_url, description,
  captured_at, captured_by, created_at, deleted_at)
- Evidence_History (history_id, evidence_id, changed_by, field_name,
  old_value, new_value, changed_at)

Verify the following indexes exist. If missing, include them in the migration:
- idx_evidence_history_evidence ON Evidence_History (evidence_id)
- idx_chain_of_custody_evidence ON Chain_of_Custody (evidence_id)
- idx_evidence_case ON Evidence (case_id) WHERE deleted_at IS NULL
- idx_evidence_type ON Evidence (evidence_type_id)

Verify the following append-only trigger exists on Chain_of_Custody:
- trg_chain_of_custody_immutable (prevents UPDATE and DELETE)
If missing, include the trigger creation in the migration.

Verify the following append-only trigger exists on Evidence_History:
- trg_evidence_history_immutable (prevents UPDATE and DELETE)
If missing, include the trigger creation in the migration.

---

## 8. MODULE 6 OBJECTIVES

Module 6 is the Reporting and Analytics Module. It is a new module that does
not currently exist. The agent must build it from scratch following the exact
same architecture patterns as the existing completed modules.

The module must be fully self-contained with:
- A dedicated router file registered with the main application router
- A dedicated service layer
- A dedicated repository layer
- Separate schemas/requests.py and schemas/responses.py
- Model definitions if new tables are required
- Alembic migrations for any new tables
- Role-based and department-scoped authorization

The reporting module prefix is /reports. All endpoints in this module are
nested under /reports.

---

## 9. MODULE 6 IMPLEMENTATION TASKS

TASK 6.1 — MODULE SCAFFOLDING

Create the reporting module directory following the same structure as an
existing module. Register the reporting router in the main application router.
Do not modify any other existing router file beyond adding the registration
line.

TASK 6.2 — CASE STATISTICS ENDPOINTS

Implement the following endpoints:

GET /reports/cases/summary
- Returns aggregate totals: total_cases, open_cases, closed_cases,
  archived_cases, under_investigation_cases, referred_to_court_cases.
- Supports filters: date_from, date_to, department_id.
- Uses a single aggregation query with conditional counts. Do not load
  individual case rows.

GET /reports/cases/by-status
- Returns case counts grouped by status_id and status_name.
- Supports filters: date_from, date_to, department_id.
- Returns a list of { status_id, status_name, case_count }.

GET /reports/cases/by-crime-type
- Returns case counts grouped by crime_type_id and crime type name.
- Supports filters: date_from, date_to, department_id.
- Returns a list of { crime_type_id, crime_type_name, case_count }.

GET /reports/cases/by-department
- Returns case counts grouped by department_id and department name.
- Supports filters: date_from, date_to, status_id.
- admin and superadmin: see all departments.
- department_head: see only their own department.
- investigator and below: 403 Forbidden.

GET /reports/cases/monthly
- Returns case counts grouped by year and month.
- Supports filters: date_from, date_to, department_id.
- Returns a list of { year, month, case_count } ordered by year ASC,
  month ASC.
- Apply pagination. Default size 24 (24 months).

TASK 6.3 — ARREST ANALYTICS ENDPOINTS

Implement the following endpoints:

GET /reports/arrests/summary
- Returns aggregate totals: total_arrests, active_arrests (released_at IS
  NULL), released_arrests, arrests_with_bail.
- Supports filters: date_from, date_to, department_id, officer_id.

GET /reports/arrests/monthly
- Returns arrest counts grouped by year and month.
- Supports filters: date_from, date_to, department_id.
- Returns a list of { year, month, arrest_count } ordered chronologically.
- Apply pagination.

GET /reports/arrests/by-department
- Returns arrest counts grouped by department, joined through the arresting
  officer's department.
- Supports filters: date_from, date_to.
- admin and superadmin: see all departments.
- department_head: see only their own department.
- investigator and below: 403 Forbidden.

TASK 6.4 — EVIDENCE ANALYTICS ENDPOINTS

Implement the following endpoints:

GET /reports/evidence/summary
- Returns aggregate totals: total_evidence_items, sensitive_items,
  items_submitted_to_court, items_with_forensic_reports.
- Supports filters: date_from, date_to, department_id, case_id.

GET /reports/evidence/by-status
- Returns evidence counts grouped by the most recent Chain_of_Custody action
  for each evidence item.
- Supports filters: date_from, date_to, department_id.
- Returns a list of { custody_action, item_count }.

GET /reports/evidence/storage-utilization
- Returns evidence counts grouped by storage_location.
- Excludes soft-deleted evidence.
- Supports filters: department_id.
- Returns a list of { storage_location, item_count }.

TASK 6.5 — OFFICER PERFORMANCE ANALYTICS ENDPOINTS

Implement the following endpoints:

GET /reports/officers/performance
- Returns per-officer statistics: officer_id, officer_name, cases_assigned,
  cases_as_lead, arrests_made, evidence_collected, reports_filed.
- Supports filters: date_from, date_to, department_id, officer_id.
- admin and superadmin: see all officers.
- department_head: see only officers in their department.
- investigator and below: see only their own record.
- Apply pagination.

GET /reports/officers/case-load
- Returns current active case count per officer.
- Active cases are those where Case_Status.is_terminal = false.
- Returns: officer_id, officer_name, active_case_count, lead_case_count.
- Supports filters: department_id.
- department_head: see only their department.
- admin/superadmin: see all.
- Apply pagination.

GET /reports/officers/activity
- Returns recent activity for officers: timeline of Case_Update entries
  authored by officers within the requested date range.
- Returns: officer_id, officer_name, activity_date, activity_count (grouped
  by officer and day).
- Supports filters: date_from, date_to, department_id, officer_id.
- Apply pagination.

TASK 6.6 — DASHBOARD SUMMARY ENDPOINT

Implement the following endpoint:

GET /reports/dashboard
- Returns a single aggregated dashboard object. This is a high-level summary
  for the authenticated officer's visible scope.
- Response schema:
    {
      "total_cases": integer,
      "open_cases": integer,
      "closed_cases": integer,
      "active_investigations": integer,
      "total_arrests": integer,
      "active_arrests": integer,
      "total_evidence_items": integer,
      "sensitive_evidence_items": integer,
      "recent_activities": [ list of last 10 Case_Update entries visible
                              to the requester ],
      "department_statistics": [
        {
          "department_id": integer,
          "department_name": string,
          "case_count": integer,
          "open_case_count": integer,
          "officer_count": integer
        }
      ]
    }
- Scope rules:
    admin/superadmin: all departments in department_statistics.
    department_head: only their own department in department_statistics.
    investigator and below: department_statistics is an empty list; totals
    are scoped to cases they have access to via Case_Permission or
    Case_Officers.
- This endpoint must use efficient aggregation queries. Do not load individual
  rows to compute totals.
- recent_activities must respect the same case visibility rules as
  GET /cases. Do not return Case_Update entries for cases the officer cannot
  see.

---

## 10. REPORTING ENDPOINT REQUIREMENTS

All reporting endpoints must conform to the following requirements:

FILTER PARAMETERS:
All reporting endpoints that accept filters must accept these query parameters
where applicable:
- date_from: optional ISO date string. Filters on the primary date column of
  the resource (created_at or date_reported or date).
- date_to: optional ISO date string. Filters on the same primary date column.
- department_id: optional integer. Filters by department. Enforced against
  the requester's authorization scope.
- officer_id: optional integer. Filters by a specific officer.
- crime_type_id: optional integer. Filters by crime type.
- status_id: optional integer. Filters by case status.

DATE RANGE VALIDATION:
- If date_from and date_to are both provided, date_from must be <= date_to.
  Return 422 InvalidDateRangeError if not.
- Date filters must be applied using >= and <= comparisons on the relevant
  timestamp column.

RESPONSE FORMAT:
- Summary endpoints (single aggregate object) return a direct JSON object,
  not a paginated wrapper.
- List endpoints (grouped analytics, monthly trends, officer lists) return
  the standard paginated envelope:
    { "items": [...], "total": N, "page": N, "size": N }
- The dashboard endpoint returns a direct JSON object.

NULL HANDLING:
- All aggregate fields in summary responses must return 0 (integer) rather
  than null when there are no matching records.
- storage_location values that are NULL must be grouped under the label
  "unassigned" in storage-utilization responses.

---

## 11. REPORTING QUERY RULES

The agent must apply the following query rules to every reporting repository
method.

AGGREGATION FIRST:
- Use SQLAlchemy func.count(), func.sum(), func.avg(), func.extract() for all
  aggregate computations.
- Never load ORM model instances and compute aggregates in Python.
- Use GROUP BY at the database level for all grouped statistics.

N+1 PREVENTION:
- No reporting query may produce N+1 database calls.
- Use subqueries, CTEs (via SQLAlchemy text or select constructs), or joined
  aggregations instead of iterating over result sets and making additional
  queries.

JOIN EFFICIENCY:
- Only join tables that contribute columns to the response.
- Do not join unnecessary relationship tables.
- When joining Case to Department for department-scoped queries, use
  Case.department_id directly. Do not join through Officer unless the
  officer's department is the scoping dimension.

INDEX AWARENESS:
- All WHERE clauses on reporting queries must use indexed columns where
  possible.
- The following indexes already exist and must be used:
    idx_case_department ON Case (department_id)
    idx_officer_department ON Officer (department_id)
    idx_arrest_released ON Arrest (case_id) WHERE released_at IS NULL
    idx_officer_deleted ON Officer (deleted_at) WHERE deleted_at IS NULL
- If a new reporting query requires a column filter that is not currently
  indexed and the table is expected to contain large volumes of data, add the
  index in the migration.

QUERY CENTRALIZATION:
- All reporting queries must be defined in the reporting repository layer.
- The reporting service layer calls repository methods and applies
  authorization scoping logic.
- The reporting router layer calls service methods only.
- Do not write inline query logic in the service or router layers.

SOFT DELETE AWARENESS:
- All reporting queries must exclude soft-deleted records.
- Apply WHERE deleted_at IS NULL on Case, Evidence, Officer, Suspect,
  Victim, Witness, Charge, and Arrest in all reporting queries.

---

## 12. AUTHORIZATION RULES

The following authorization rules apply to all Module 6 endpoints.

AUTHENTICATION:
- All /reports/* endpoints require a valid JWT and an active session resolved
  via get_current_officer. There are no public reporting endpoints.

ROLE-BASED ACCESS:
- readonly role: 403 Forbidden on all /reports/* endpoints.
- forensic role: 403 Forbidden on all /reports/* endpoints except
  GET /reports/evidence/summary and GET /reports/evidence/by-status, which
  are accessible to forensic officers scoped to their visible cases.
- legal_officer role: 403 Forbidden on all /reports/* endpoints.
- investigator role: may access GET /reports/dashboard and
  GET /reports/officers/performance (own record only). 403 on all other
  endpoints.
- department_head role: may access all /reports/* endpoints scoped to their
  department.
- admin role: may access all /reports/* endpoints across all departments.
- superadmin role: unrestricted access to all /reports/* endpoints.

DEPARTMENT SCOPING ENFORCEMENT:
- When a department_head makes a request to any reporting endpoint, the
  service layer must enforce department_id = requester.department_id
  regardless of any department_id query parameter provided. The query
  parameter is ignored for department_head requesters.
- When an admin or superadmin provides a department_id filter, it is applied
  as a standard filter.
- When an investigator accesses permitted endpoints, data is scoped to cases
  the officer has access to via Case_Permission or Case_Officers.

OFFICER FILTER SCOPING:
- department_head: officer_id filter is only valid for officers within their
  department. Return 403 if officer_id belongs to another department.
- admin/superadmin: officer_id filter is unrestricted.
- investigator: officer_id filter is only valid for their own officer_id.

AUTHORIZATION ERROR RESPONSES:
- 401 Unauthorized if not authenticated.
- 403 Forbidden if authenticated but role does not permit access.
- Use the same error envelope as the rest of the system:
    { "detail": "Insufficient permissions to access this report." }

---

## 13. PERFORMANCE RULES

The following performance rules apply to Module 6 and to any changes made to
Module 5.

QUERY EFFICIENCY:
- Every repository method that produces a list result must use a single
  database round-trip for the data query and a single round-trip for the
  count query (for pagination). Two round-trips maximum per paginated list.
- Aggregate endpoints (summary, dashboard) must complete in a single database
  round-trip using a single query with multiple func.count() expressions or
  multiple subqueries in a single SELECT.

INDEXES:
- Inspect the query plan for all new reporting queries.
- If a new query filters on a column that does not have an index and the
  table has or is expected to have more than 10,000 rows, add an index in
  the migration.
- Suggested new indexes to evaluate:
    ON Case_Update (case_id, created_at)
    ON Chain_of_Custody (evidence_id, created_at)
    ON Arrest (officer_id)
    ON Arrest (date)
    ON Evidence (created_at)

AVOID DENORMALIZATION:
- Do not create materialized summary tables unless a query cannot meet
  acceptable performance without them.
- Prioritize query optimization with indexes and efficient joins before
  considering materialization.
- If materialization is required for a specific aggregate (e.g., monthly
  case trend table), create it as a separate analytics snapshot table with
  a clearly named Alembic migration and a refresh mechanism. Document the
  refresh trigger in the migration file's comments.

PAGINATION ON LARGE RESULT SETS:
- All analytics list endpoints must apply the standard pagination pattern.
- Never return unbounded result sets.
- The maximum page size is 100 (consistent with the existing system-wide
  pagination rule).

---

## 14. MIGRATION RULES

All database schema changes must be implemented as Alembic migrations. The
following rules are mandatory.

INSPECT BEFORE CREATING:
- Before writing any migration, inspect the current migration history to
  identify the latest revision.
- Check whether the required table, column, or index already exists.
- Never create a migration that duplicates an existing schema element.
- Use IF NOT EXISTS on all CREATE TABLE and CREATE INDEX statements in
  migration upgrade() functions.

NAMING CONVENTION:
- Follow the existing migration file naming convention exactly.
- Migration message strings must describe the change concisely:
  e.g., "add_evidence_history_table", "add_reporting_indexes".

DOWN MIGRATIONS:
- Every migration must implement a complete downgrade() function that fully
  reverses the upgrade() function.

MODULE 5 MIGRATIONS — inspect and create only if missing:
- Evidence_History table and its immutability trigger.
- Any missing indexes listed in Section 7.

MODULE 6 MIGRATIONS — create only if the reporting module requires new tables:
- If analytics snapshot tables are needed for performance, create them in a
  separate migration from the reporting module's initial migration.
- Do not add columns to existing tables for reporting purposes unless
  absolutely required. Use query-time aggregation first.

TRANSACTION SAFETY IN MIGRATIONS:
- All DDL statements in migrations must be wrapped in a transaction where
  the database supports transactional DDL (PostgreSQL supports this).
- Do not use op.execute() for DML inside migrations unless seeding reference
  data that is required for system startup.

---

## 15. REQUIRED DELIVERABLES

Upon completion of all tasks, the following files must exist in the codebase.
The agent must produce all of them. Deliverables that already exist and are
complete do not need to be recreated but must be verified against the
requirements in this document.

MODULE 5 DELIVERABLES:

- modules/evidence/router.py (or equivalent path per existing structure)
  Complete router with all evidence and custody endpoints.

- modules/evidence/service.py
  Complete service with all evidence lifecycle methods.

- modules/evidence/repository.py
  Complete repository with all evidence and custody query methods.

- modules/evidence/schemas/requests.py
  All evidence input schemas listed in Task 5.5.

- modules/evidence/schemas/responses.py
  All evidence output schemas listed in Task 5.5.

- modules/evidence/models.py (or equivalent)
  Evidence, Chain_of_Custody, Evidence_History, Forensic_Report, Vehicle,
  Weapon, Crime_Scene_Photo model definitions.

- alembic/versions/{revision}_evidence_module_hardening.py
  Migration for any missing tables, columns, indexes, or triggers.

MODULE 6 DELIVERABLES:

- modules/reporting/router.py
  Complete router with all /reports/* endpoints.

- modules/reporting/service.py
  Complete service with authorization scoping logic for all report types.

- modules/reporting/repository.py
  Complete repository with all aggregation query methods.

- modules/reporting/schemas/requests.py
  Filter parameter schemas for all reporting endpoints.

- modules/reporting/schemas/responses.py
  Response schemas for all reporting endpoints including dashboard.

- alembic/versions/{revision}_reporting_module_initial.py
  Migration for any new tables or indexes required by Module 6.

---

## 16. FINAL VERIFICATION CHECKLIST

Before marking any task complete, the agent must verify each item in this
checklist against the implemented code.

MODULE 5 CHECKLIST:

[ ] All existing evidence routes are preserved and still functional.
[ ] No existing evidence route signatures have been changed.
[ ] Evidence creation validates: evidence_type_id, collected_at (future and
    before-case-reported), closed case, soft-deleted case.
[ ] Evidence update rejects all immutable fields with 422.
[ ] Evidence deletion enforces submitted_to_court block (any role) and
    forensic report block (non-superadmin).
[ ] Chain of custody is append-only. No update or delete calls exist in the
    service or repository.
[ ] Manual submission of action = 'collected' returns 422.
[ ] Custody timestamp chronology is validated before insert.
[ ] All evidence queries use selectinload or joinedload. No lazy loading.
[ ] No N+1 queries exist in the evidence list endpoint.
[ ] Evidence_History is written for every changed field on update.
[ ] All evidence lifecycle events are written to Case_Update.
[ ] All operations touching multiple tables use a single transaction.
[ ] The evidence repository contains all methods listed in Task 5.5.
[ ] The evidence schemas contain all request and response models listed in
    Task 5.5.
[ ] All migrations for Module 5 are complete and include downgrade().
[ ] No test files, pytest files, mock files, or test utilities were created.

MODULE 6 CHECKLIST:

[ ] All 13 /reports/* endpoints are implemented and registered.
[ ] readonly, forensic, and legal_officer roles receive 403 on restricted
    endpoints.
[ ] investigator role is scoped to own data on permitted endpoints.
[ ] department_head scope enforcement ignores department_id query parameter
    and uses requester.department_id.
[ ] admin and superadmin have unrestricted access.
[ ] Dashboard response includes all required fields and respects visibility
    scoping.
[ ] All summary endpoints return 0 for empty aggregates, not null.
[ ] All list endpoints return the standard paginated envelope.
[ ] All aggregate queries use SQLAlchemy func expressions, not Python-side
    computation.
[ ] No N+1 queries exist in any reporting repository method.
[ ] All reporting queries exclude soft-deleted records.
[ ] date_from > date_to returns 422 InvalidDateRangeError.
[ ] All new indexes are included in migrations.
[ ] All migrations include downgrade().
[ ] No test files, pytest files, mock files, or test utilities were created.
[ ] The reporting module is registered in the main application router.
[ ] No existing module files were modified except to register the new router.