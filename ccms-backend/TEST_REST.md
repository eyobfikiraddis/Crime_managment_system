# FastAPI Backend — Automated API Contract Testing Instruction

**Document Version:** 1.0.0
**Target Agent:** Autonomous VS Code AI Coding Agent
**Execution Environment:** VS Code + REST Client Extension
**Backend Stack:** FastAPI + SQLAlchemy + JWT Auth + Modular Monolith

---

## 1. SYSTEM OVERVIEW

### 1.1 Project Architecture Assumptions

The backend is a **modular monolith** built with FastAPI. Each business domain lives in its own module directory under `app/modules/`. Each module is self-contained and exposes its own `APIRouter` instance, which is registered in a central router aggregator or directly in `app/main.py`.

Expected top-level structure:

```
app/
  main.py
  core/
    security.py
    dependencies.py
    config.py
  config/
    settings.py
  modules/
    auth/
      routes.py
      schemas.py
      models.py
      dependencies.py
    personnel/
      routes.py
      schemas.py
      models.py
      dependencies.py
    cases/
      routes.py
      schemas.py
      models.py
      dependencies.py
    evidence/
      routes.py
      schemas.py
      models.py
      dependencies.py
    departments/
      routes.py
      schemas.py
      models.py
      dependencies.py
    [additional modules follow same pattern]
scripts/
  seed.py
  initial_data.py
seeders/
  [seed files]
tests/
  http/
    [generated .http files go here]
alembic/
  versions/
```

### 1.2 FastAPI Conventions

- Routers are created with `APIRouter(prefix="/some-prefix", tags=["TagName"])`
- Routers are included in a parent router or in `app.include_router(...)` inside `main.py`
- Auth is enforced via `Depends()` injection, typically wrapping a JWT decode function
- Pydantic v2 schemas are used for request body validation and response serialization
- Endpoint functions are `async def` or `def`; both must be treated identically for HTTP testing purposes
- Route status codes are declared explicitly via `status_code=` or default to 200

### 1.3 Router Registration Conventions

Scan `app/main.py` for all `app.include_router(...)` calls. Each call may specify:

```python
app.include_router(router, prefix="/api/v1", tags=["Auth"])
app.include_router(router, prefix="/api/v1/personnel")
```

Also scan for intermediate aggregator routers, e.g. `app/api/v1/router.py`, which may do:

```python
api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(personnel_router, prefix="/personnel")
```

**Full URL reconstruction rule:**

```
full_path = main_prefix + aggregator_prefix + module_router_prefix + route_path
```

Example:

- `main.py` registers with prefix `/api/v1`
- `auth/routes.py` has `APIRouter(prefix="/auth")`
- Route is `@router.post("/login")`
- Full URL = `/api/v1/auth/login`

### 1.4 Schema Discovery Logic

- For each endpoint, inspect the function signature for parameters typed with Pydantic `BaseModel` subclasses
- These are the request body schemas
- Query params are function arguments typed with Python primitives (`str`, `int`, `bool`, `Optional[str]`, etc.) without being `Body()` types
- Path params are function arguments whose names appear inside `{}` in the route path string
- Response models are declared in the `@router.get(..., response_model=SomeSchema)` decorator

### 1.5 Dependency Injection Assumptions

- `Depends(get_current_user)` or `Depends(get_current_active_user)` = authenticated endpoint
- `Depends(require_role("admin"))` or `Security(...)` = role-restricted endpoint
- `Depends(get_db)` = database session injection (not auth-related)
- `Annotated[CurrentUser, Depends(get_current_user)]` = modern FastAPI annotated dependency syntax; treat the same as direct `Depends()`

### 1.6 Auth Middleware Assumptions

- JWT tokens are passed as `Authorization: Bearer <token>` headers
- Login endpoint returns `{"access_token": "...", "token_type": "bearer", "refresh_token": "..."}`
- Tokens may also be in nested structures like `{"data": {"access_token": "..."}}`; scan login response shape to determine extraction path
- Token expiry should be handled by refresh flow if a refresh endpoint exists

---

## 2. DIRECTORY SCANNING STRATEGY

### 2.1 Files to Scan

Execute a recursive filesystem scan targeting the following file patterns. Scan ALL of them before generating any test files.

```
app/main.py                              ← router registration root
app/core/*.py                            ← global deps, security, config
app/config/*.py                          ← settings, env vars
app/modules/**/routes.py                 ← endpoint definitions
app/modules/**/schemas.py                ← Pydantic request/response schemas
app/modules/**/models.py                 ← SQLAlchemy models (for field inference)
app/modules/**/dependencies.py           ← per-module dependency functions
scripts/**/*.py                          ← seed scripts
seeders/**/*.py                          ← seeders
fixtures/**/*.py                         ← fixtures
initial_data/**/*.py                     ← initial data
alembic/versions/*.py                    ← migrations (for schema inference)
tests/**/*.py                            ← existing tests (for credentials/IDs)
```

### 2.2 Discovering APIRouter Instances

In each `routes.py`, locate lines matching:

```python
router = APIRouter(...)
```

Also handle aliased names:

```python
auth_router = APIRouter(...)
personnel_router = APIRouter(...)
```

Extract the `prefix` and `tags` keyword arguments from the `APIRouter(...)` constructor call.

If `prefix` is absent, the module contributes no prefix beyond what the parent registration specifies.

### 2.3 Resolving Included Routers

In `app/main.py` and any intermediate aggregator files, find:

```python
app.include_router(some_router, prefix="/api/v1", tags=["..."])
```

or:

```python
api_router.include_router(module_router, prefix="/module-name")
```

Build a prefix resolution tree:

```
root_prefix (from main.py include_router call)
  └── aggregator_prefix (from intermediate include_router)
        └── module_router_prefix (from APIRouter(prefix=...))
              └── route_path (from @router.get("/path"))
```

Concatenate all non-None prefix segments. Strip double slashes.

### 2.4 Full URL Reconstruction Algorithm

```python
def reconstruct_full_url(base_url, root_prefix, aggregator_prefix, router_prefix, route_path):
    segments = [
        base_url.rstrip("/"),
        root_prefix.strip("/") if root_prefix else "",
        aggregator_prefix.strip("/") if aggregator_prefix else "",
        router_prefix.strip("/") if router_prefix else "",
        route_path.strip("/"),
    ]
    full = "/".join(s for s in segments if s)
    # Re-add leading slash after base_url
    return full
```

Example:

```
base_url         = http://localhost:8000
root_prefix      = /api/v1
aggregator_prefix= (none)
router_prefix    = /auth
route_path       = /login
result           = http://localhost:8000/api/v1/auth/login
```

---

## 3. ENDPOINT EXTRACTION RULES

### 3.1 HTTP Method Detection

Scan route decorator lines in each `routes.py`:

```python
@router.get(...)
@router.post(...)
@router.put(...)
@router.patch(...)
@router.delete(...)
@router.head(...)
@router.options(...)
```

Extract the method from the decorator name.

### 3.2 Complete Endpoint Metadata Extraction

For each decorated function, extract ALL of the following fields:

| Field | Source |
|---|---|
| `method` | Decorator name (`get`, `post`, etc.) |
| `path` | First positional argument to decorator |
| `summary` | `summary=` kwarg or function docstring first line |
| `description` | `description=` kwarg or full docstring |
| `tags` | `tags=` kwarg on decorator or inherited from router |
| `status_code` | `status_code=` kwarg, default 200 |
| `response_model` | `response_model=` kwarg |
| `dependencies` | `dependencies=` kwarg list |
| `deprecated` | `deprecated=True` kwarg |

### 3.3 Function Signature Parameter Extraction

For each endpoint function, parse the function signature and classify each parameter:

**Path parameter:** name appears in `{name}` inside the route path string
```python
@router.get("/cases/{case_id}")
async def get_case(case_id: int, ...):
```

**Query parameter:** typed with primitive (`str`, `int`, `bool`, `float`, `UUID`, `Optional[X]`) and NOT wrapped in `Body()`
```python
async def list_cases(page: int = 1, size: int = 20, status: Optional[str] = None, ...):
```

**Request body:** typed with a Pydantic `BaseModel` subclass OR wrapped in `Body()`
```python
async def create_case(payload: CreateCaseSchema, ...):
async def update_case(data: Annotated[UpdateCaseSchema, Body()], ...):
```

**Dependency:** wrapped in `Depends()` or `Security()` or `Annotated[X, Depends(Y)]`
```python
async def get_case(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
```

### 3.4 Dependency Analysis for Auth Detection

For each `Depends(...)` call in the function signature or in the decorator `dependencies=[]` list:

1. Resolve the dependency function name
2. Look up that function in `dependencies.py`, `core/security.py`, `core/dependencies.py`
3. Classify it:

```
get_current_user             → REQUIRES_AUTH = True, ROLE = None
get_current_active_user      → REQUIRES_AUTH = True, ROLE = None
require_role("admin")        → REQUIRES_AUTH = True, ROLE = "admin"
require_role("officer")      → REQUIRES_AUTH = True, ROLE = "officer"
get_db                       → DB_SESSION = True (not auth)
Security(oauth2_scheme)      → REQUIRES_AUTH = True
```

If NO auth dependency is found anywhere in the dependency chain for an endpoint, mark it as `PUBLIC = True`.

### 3.5 Handling `Annotated[]` Syntax

Modern FastAPI uses:

```python
from typing import Annotated
from fastapi import Depends

CurrentUser = Annotated[UserModel, Depends(get_current_user)]

async def some_endpoint(user: CurrentUser):
```

When scanning function signatures, if a type annotation is `Annotated[X, Depends(Y)]`, extract `Y` as the dependency and treat it identically to `Depends(Y)`.

Also resolve type aliases:

```python
CurrentUser = Annotated[UserModel, Depends(get_current_user)]
AdminUser = Annotated[UserModel, Depends(require_role("admin"))]
```

Scan module-level assignments in `routes.py`, `schemas.py`, `dependencies.py` to resolve these aliases before analyzing function signatures.

---

## 4. AUTHENTICATION DETECTION RULES

### 4.1 Protected vs Public Endpoint Classification

**Mark as PROTECTED if any of the following are true:**

- Function signature contains `Depends(get_current_user)` or any alias thereof
- Function signature contains `Security(...)` with an OAuth2 scheme
- Decorator `dependencies=` list contains any auth dependency
- An `Annotated` type alias resolving to `Depends(get_current_user)` is used
- A role guard function such as `require_role(...)`, `check_permission(...)`, `RoleChecker(...)` appears in dependencies

**Mark as PUBLIC if ALL of the following are true:**

- No auth dependency found anywhere in the function signature
- No auth dependency in the decorator `dependencies=[]`
- Not included in a router that has a router-level dependency enforcing auth

**Router-level dependencies:** Check if the `APIRouter(dependencies=[Depends(get_current_user)])` pattern is used. If so, ALL routes on that router are PROTECTED regardless of individual function signatures.

### 4.2 Role Detection

```python
# Pattern 1
Depends(require_role("admin"))           → role = "admin"

# Pattern 2
Depends(RoleChecker(["admin", "manager"])) → roles = ["admin", "manager"]

# Pattern 3
Security(get_current_user, scopes=["items:write"]) → scope = "items:write"
```

Record the most permissive role that can access the endpoint. Generate test requests using a user with that role.

### 4.3 Authorization Header Injection

For every PROTECTED endpoint, the generated `.http` file MUST prepend:

```http
Authorization: Bearer {{accessToken}}
```

Never omit this for protected endpoints. Never add it to PUBLIC endpoints unless testing that auth is optional.

### 4.4 Auto-Login Before Protected Routes

In every `.http` file that contains protected endpoints:

- Place the login request as the FIRST request block
- Extract the token immediately after login using a response handler script
- Use `{{accessToken}}` in all subsequent requests within the same file

---

## 5. SEED DATA DISCOVERY

### 5.1 Files to Scan for Seed Data

Scan all of the following for hardcoded credentials, IDs, roles, and identifiers:

```
scripts/seed.py
scripts/initial_data.py
scripts/create_superuser.py
seeders/*.py
fixtures/*.py
fixtures/*.json
fixtures/*.yaml
initial_data/*.py
initial_data/*.json
tests/conftest.py
tests/fixtures/*.py
alembic/versions/*.py          ← look for bulk inserts
```

### 5.2 Seed Data Extraction Targets

From seed files, extract ALL of the following if present:

| Target | Example Fields |
|---|---|
| Superuser / Admin | `national_id`, `username`, `email`, `password`, `role` |
| Regular users | `national_id`, `username`, `password`, `role`, `department_id` |
| Roles | role name → role ID mapping |
| Departments | department name → department ID mapping |
| Pre-seeded records | case IDs, officer IDs, person IDs |

### 5.3 Credential Resolution Priority

1. **First:** Scan seed scripts for literal string credentials
2. **Second:** Scan `tests/conftest.py` for fixture-based credentials
3. **Third:** Scan `.env`, `.env.example`, `config/settings.py` for default credential env vars
4. **Fourth:** If none found, generate plausible test credentials and log them in `generated_variables.json` with a note: `"source": "generated_fallback"`

### 5.4 CRITICAL RULE

**DO NOT hardcode credentials if they are discoverable dynamically from seed files, fixture files, or config files.**

All discovered credentials MUST be stored in `generated_variables.json` and referenced by variable name in `.http` files.

If a password appears in `scripts/seed.py` as:

```python
password = "SuperPass123!"
```

Then `generated_variables.json` must contain:

```json
{
  "superuser_password": "SuperPass123!",
  "superuser_national_id": "SUPER-0001"
}
```

And the `.http` file must use:

```http
{
  "national_id": "{{superuserNationalId}}",
  "password": "{{superuserPassword}}"
}
```

---

## 6. TOKEN AUTOMATION FLOW

### 6.1 Required Global Variables

Every `.http` file MUST declare these variables at the top:

```http
@baseUrl = http://localhost:8000
@accessToken =
@refreshToken =
@userId =
@adminNationalId = SUPER-0001
@adminPassword = SuperPass123!
```

These are populated by the login response handler.

### 6.2 Login Sequence

The first request block in any `.http` file containing protected endpoints MUST be:

```http
### [AUTH] Login — Obtain Access Token
# @name loginRequest
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
  "national_id": "{{adminNationalId}}",
  "password": "{{adminPassword}}"
}

> {%
  client.global.set("accessToken", response.body.access_token);
  client.global.set("refreshToken", response.body.refresh_token);
  client.global.set("userId", response.body.user_id);
%}
```

If the login response nests tokens under a `data` key:

```http
> {%
  client.global.set("accessToken", response.body.data.access_token);
  client.global.set("refreshToken", response.body.data.refresh_token);
%}
```

Determine correct extraction path by inspecting the login endpoint's `response_model` schema.

### 6.3 Token Reuse

After login, every subsequent protected request MUST use:

```http
Authorization: Bearer {{accessToken}}
```

The `{{accessToken}}` variable is set globally and persists across all request blocks within the same VS Code REST Client session.

### 6.4 Token Refresh Flow

If a `/auth/refresh` or `/auth/token/refresh` endpoint exists:

```http
### [AUTH] Refresh Access Token
POST {{baseUrl}}/api/v1/auth/refresh
Content-Type: application/json
Authorization: Bearer {{refreshToken}}

{
  "refresh_token": "{{refreshToken}}"
}

> {%
  client.global.set("accessToken", response.body.access_token);
%}
```

Place this block AFTER the login block and BEFORE the first protected endpoint test.

### 6.5 Logout

If a logout endpoint exists:

```http
### [AUTH] Logout
POST {{baseUrl}}/api/v1/auth/logout
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{}
```

Place this as the LAST block in `auth.http`.

### 6.6 Session Lifecycle Summary

```
1. Login → extract accessToken, refreshToken
2. Execute protected requests using accessToken
3. On 401 response → execute refresh → update accessToken → retry
4. On refresh failure → re-login
5. On test completion → logout
```

---

## 7. REQUEST BODY GENERATION RULES

### 7.1 Pydantic Schema Inspection

For each request body schema class found in `schemas.py`:

1. Enumerate all fields defined on the class (including inherited fields from parent `BaseModel`)
2. For each field, determine:
   - Field name
   - Field type (Python type annotation)
   - Required vs Optional (has default value or `Optional[X]` / `X | None`)
   - Validators (`@field_validator`, `@validator`, `Field(...)` constraints)
   - `Field(...)` metadata: `min_length`, `max_length`, `ge`, `le`, `pattern`, `example`, `default`

### 7.2 Type → Example Value Mapping

Use this mapping to generate example values:

| Python Type | Generated Example |
|---|---|
| `str` | `"example_string"` |
| `int` | `1` |
| `float` | `1.0` |
| `bool` | `true` |
| `UUID` | `"550e8400-e29b-41d4-a716-446655440000"` |
| `date` | `"2024-01-15"` |
| `datetime` | `"2024-01-15T10:30:00Z"` |
| `EmailStr` | `"user@example.com"` |
| `HttpUrl` | `"https://example.com"` |
| `List[X]` | `[<example of X>]` |
| `Optional[X]` | include in body with valid value OR omit entirely |
| `Enum subclass` | use first declared enum member value |
| Nested `BaseModel` | recursively generate nested object |

### 7.3 Enum Handling

For any field typed as an `Enum` subclass:

1. Locate the enum class definition in `schemas.py` or `models.py`
2. Extract all valid member values
3. Use the **first member** as the default test value
4. Generate a separate NEGATIVE test using an invalid value (e.g., `"INVALID_ENUM_VALUE"`)

```python
class CaseStatus(str, Enum):
    open = "open"
    closed = "closed"
    pending = "pending"
```

Generated value: `"open"`
Negative test value: `"INVALID_STATUS_XYZ"`

### 7.4 Nested Schema Generation

For nested schemas, recursively apply the same rules:

```json
{
  "person": {
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "P-00001",
    "date_of_birth": "1990-05-20"
  },
  "case_title": "Example Case",
  "status": "open"
}
```

### 7.5 Field Constraint Respect

- If `min_length=3`, generate string of at least 3 characters
- If `ge=0` and `le=100`, generate value within that range (e.g., `50`)
- If `pattern=r"^\d{4}-\d{4}$"`, generate `"1234-5678"`
- If `Field(example=...)` is set, use that example value directly

### 7.6 Required vs Optional Fields

- **Required fields:** always include in the generated body
- **Optional fields:** include with a valid value in the POSITIVE test; omit entirely in a separate OPTIONAL OMISSION test to verify the endpoint handles missing optionals correctly

---

## 8. PARAMETER EXTRACTION RULES

### 8.1 Path Parameters

Detect by matching function argument names against `{param_name}` patterns in the route path.

Route: `@router.get("/cases/{case_id}/evidence/{evidence_id}")`

Extracted path params:
- `case_id` — type from function signature (e.g., `int` or `UUID`)
- `evidence_id` — type from function signature

In generated `.http` file:

```http
### Get Evidence Item
GET {{baseUrl}}/api/v1/cases/{{caseId}}/evidence/{{evidenceId}}
Authorization: Bearer {{accessToken}}
```

Variables `caseId` and `evidenceId` must be set in earlier request blocks (via response extraction from create requests) or declared at the top of the file.

### 8.2 Query Parameters

Detect all function arguments that are:
- Not path params
- Not Pydantic body models
- Not `Depends()` injections
- Typed with primitives or `Optional[primitive]`

```python
async def list_cases(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    assigned_to: Optional[UUID] = None,
    created_after: Optional[date] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
```

Generated query string:

```http
GET {{baseUrl}}/api/v1/cases?page=1&size=20&status=open&sort_by=created_at&sort_order=desc
```

### 8.3 Optional Query Parameters

Include optional params in the POSITIVE test with valid values.

Generate a second MINIMAL test using only required params (omit all optionals):

```http
### List Cases — Minimal (no filters)
GET {{baseUrl}}/api/v1/cases?page=1&size=20
Authorization: Bearer {{accessToken}}
```

### 8.4 Pagination Parameters

Standard pagination params (`page`, `size`, `limit`, `offset`, `skip`) must always be included.

Generate pagination boundary tests:

```http
### List Cases — First Page
GET {{baseUrl}}/api/v1/cases?page=1&size=10

### List Cases — Large Page
GET {{baseUrl}}/api/v1/cases?page=1&size=100

### List Cases — Page 2
GET {{baseUrl}}/api/v1/cases?page=2&size=10
```

### 8.5 Filtering and Sorting Parameters

Generate tests for each filterable field separately:

```http
### List Cases — Filter by Status
GET {{baseUrl}}/api/v1/cases?page=1&size=20&status=open

### List Cases — Sort Ascending
GET {{baseUrl}}/api/v1/cases?page=1&size=20&sort_by=created_at&sort_order=asc

### List Cases — Sort Descending
GET {{baseUrl}}/api/v1/cases?page=1&size=20&sort_by=created_at&sort_order=desc
```

---

## 9. RELATIONAL EXECUTION ORDER

### 9.1 Dependency Graph Construction

Before generating `.http` files, build a dependency graph by analyzing:

- Which endpoints create resources that other endpoints reference
- Which path params require IDs generated by earlier endpoints
- Which request bodies require IDs from parent resources

### 9.2 Default Execution Order Template

If the project contains modules for persons, officers, departments, and cases, use this ordering as the baseline (adjust based on actual discovered endpoints):

```
Step 1:  POST /auth/login                    → extract accessToken
Step 2:  POST /persons                       → extract personId
Step 3:  POST /departments                   → extract departmentId
Step 4:  POST /officers                      → extract officerId (uses personId)
Step 5:  PATCH /departments/{id}/head        → assign department head (uses officerId, departmentId)
Step 6:  POST /cases                         → extract caseId
Step 7:  POST /cases/{caseId}/assign         → assign officer to case (uses caseId, officerId)
Step 8:  POST /cases/{caseId}/evidence       → add evidence (uses caseId)
Step 9:  GET /cases/{caseId}                 → verify case with all relations
Step 10: DELETE /evidence/{evidenceId}       → cleanup
Step 11: DELETE /cases/{caseId}              → cleanup
```

### 9.3 Variable Chain Example

```http
### Step 2 — Create Person
# @name createPerson
POST {{baseUrl}}/api/v1/persons
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "national_id": "P-TEST-001",
  "date_of_birth": "1985-03-15",
  "gender": "male"
}

> {%
  client.global.set("personId", response.body.id);
%}

###

### Step 3 — Create Department
# @name createDepartment
POST {{baseUrl}}/api/v1/departments
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "Homicide Division",
  "code": "HOM-001"
}

> {%
  client.global.set("departmentId", response.body.id);
%}

###

### Step 4 — Create Officer (uses personId)
# @name createOfficer
POST {{baseUrl}}/api/v1/officers
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "person_id": "{{personId}}",
  "badge_number": "BADGE-001",
  "rank": "detective",
  "department_id": "{{departmentId}}"
}

> {%
  client.global.set("officerId", response.body.id);
%}
```

### 9.4 ID Preservation Rule

Every POST/PUT endpoint that returns a resource with an `id` field MUST have a response handler that extracts and globally stores that ID using:

```javascript
client.global.set("resourceNameId", response.body.id);
```

For nested IDs:

```javascript
client.global.set("resourceNameId", response.body.data.id);
```

---

## 10. .HTTP / .REST FILE GENERATION RULES

### 10.1 File-Per-Module Structure

Generate one `.http` file per discovered module. Place all files in:

```
tests/http/
  _auth.http          ← always first; contains login + token setup
  auth.http
  personnel.http
  cases.http
  evidence.http
  departments.http
  reports.http
  [module_name].http  ← one per discovered module
```

The `_auth.http` file (prefixed with underscore) contains ONLY the login and token extraction block. It is sourced/referenced from all other files conceptually. In REST Client, the global variables set in one file persist in the same VS Code session.

### 10.2 File Naming Convention

```
lowercase_module_name.http
```

- Module `auth` → `auth.http`
- Module `personnel` → `personnel.http`
- Module `case_management` → `case_management.http`
- Module `evidence_tracking` → `evidence_tracking.http`

### 10.3 Internal File Organization

Within each `.http` file, organize blocks in this order:

```
1. Variable declarations
2. [AUTH] Login block (if file contains protected endpoints)
3. CREATE requests (POST) — with ID extraction
4. LIST requests (GET — collection)
5. READ requests (GET — single item)
6. UPDATE requests (PUT/PATCH)
7. DELETE requests
8. NEGATIVE TEST — unauthorized (no token)
9. NEGATIVE TEST — forbidden (wrong role)
10. NEGATIVE TEST — not found
11. NEGATIVE TEST — validation errors
12. NEGATIVE TEST — invalid enum
```

---

## 11. REQUIRED HTTP FILE FORMAT

### 11.1 File Header

Every `.http` file MUST begin with:

```http
# =============================================================================
# MODULE: [Module Name]
# Base URL: http://localhost:8000
# Auth: JWT Bearer Token
# Generated: [ISO timestamp]
# Source: app/modules/[module_name]/routes.py
# =============================================================================

@baseUrl = http://localhost:8000
@accessToken =
@refreshToken =
@userId =

```

### 11.2 Login Block (required in all files with protected endpoints)

```http
###
# ------------------------------------------------------------------
# [AUTH] Login — Obtain JWT Access Token
# ------------------------------------------------------------------
# @name login
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
  "national_id": "SUPER-0001",
  "password": "SuperPass123!"
}

> {%
  client.global.set("accessToken", response.body.access_token);
  client.global.set("refreshToken", response.body.refresh_token);
  client.global.set("userId", response.body.user_id);
  client.test("Login successful", function() {
    client.assert(response.status === 200, "Expected 200 OK");
    client.assert(response.body.access_token !== undefined, "Access token missing");
  });
%}
```

### 11.3 Standard CRUD Blocks

```http
###
# ------------------------------------------------------------------
# [CASES] Create Case
# POST /api/v1/cases
# Auth: Required
# Role: officer, admin
# ------------------------------------------------------------------
# @name createCase
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Test Case Alpha",
  "description": "Automated test case for REST verification",
  "status": "open",
  "priority": "high",
  "assigned_department_id": "{{departmentId}}",
  "opened_date": "2024-01-15"
}

> {%
  client.global.set("caseId", response.body.id);
  client.test("Case created", function() {
    client.assert(response.status === 201, "Expected 201 Created");
    client.assert(response.body.id !== undefined, "Case ID missing");
    client.assert(response.body.status === "open", "Status mismatch");
  });
%}

###
# ------------------------------------------------------------------
# [CASES] List Cases
# GET /api/v1/cases
# Auth: Required
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases?page=1&size=20&sort_by=created_at&sort_order=desc
Authorization: Bearer {{accessToken}}

> {%
  client.test("List cases", function() {
    client.assert(response.status === 200, "Expected 200 OK");
    client.assert(Array.isArray(response.body.items) || Array.isArray(response.body), "Expected array");
  });
%}

###
# ------------------------------------------------------------------
# [CASES] Get Case by ID
# GET /api/v1/cases/{case_id}
# Auth: Required
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}

> {%
  client.test("Get case by ID", function() {
    client.assert(response.status === 200, "Expected 200 OK");
    client.assert(response.body.id === client.global.get("caseId"), "ID mismatch");
  });
%}

###
# ------------------------------------------------------------------
# [CASES] Update Case
# PATCH /api/v1/cases/{case_id}
# Auth: Required
# ------------------------------------------------------------------
PATCH {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "pending",
  "description": "Updated description via automated test"
}

> {%
  client.test("Case updated", function() {
    client.assert(response.status === 200, "Expected 200 OK");
    client.assert(response.body.status === "pending", "Status not updated");
  });
%}

###
# ------------------------------------------------------------------
# [CASES] Delete Case
# DELETE /api/v1/cases/{case_id}
# Auth: Required | Role: admin
# ------------------------------------------------------------------
DELETE {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}

> {%
  client.test("Case deleted", function() {
    client.assert(response.status === 204 || response.status === 200, "Expected 200 or 204");
  });
%}
```

### 11.4 Request Block Separator Rule

Every request block MUST be separated by exactly:

```
###
```

on its own line. Never use `---` or blank lines as separators.

---

## 12. VARIABLE EXTRACTION RULES

### 12.1 Simple Top-Level Field Extraction

```http
> {%
  client.global.set("accessToken", response.body.access_token);
%}
```

### 12.2 Nested Field Extraction

```http
> {%
  client.global.set("accessToken", response.body.data.access_token);
  client.global.set("userId", response.body.data.user.id);
%}
```

### 12.3 Array Element Extraction

```http
> {%
  client.global.set("firstCaseId", response.body.items[0].id);
  client.global.set("firstOfficerId", response.body[0].id);
%}
```

### 12.4 Computed Extraction

```http
> {%
  var token = response.body.access_token;
  client.global.set("accessToken", token);
  client.global.set("tokenType", response.body.token_type);
  client.log("Token acquired: " + token.substring(0, 20) + "...");
%}
```

### 12.5 Conditional Extraction

```http
> {%
  if (response.status === 200 || response.status === 201) {
    client.global.set("resourceId", response.body.id);
  } else {
    client.log("ERROR: unexpected status " + response.status);
  }
%}
```

### 12.6 Extraction Naming Convention

| Resource | Variable Name |
|---|---|
| Access token | `accessToken` |
| Refresh token | `refreshToken` |
| Current user ID | `userId` |
| Created person | `personId` |
| Created officer | `officerId` |
| Created department | `departmentId` |
| Created case | `caseId` |
| Created evidence | `evidenceId` |
| Created report | `reportId` |
| Generic ID | `{resourceName}Id` |

---

## 13. AUTO-GENERATED TEST SCENARIOS

### 13.1 Positive Tests (Happy Path)

For every endpoint, generate at minimum one positive test:

- Uses valid credentials and auth token
- Uses valid request body with all required fields
- Uses valid path params from previously created resources
- Expects success status code (200, 201, 204)
- Asserts response shape

```http
### [POSITIVE] Create Officer — Valid Payload
POST {{baseUrl}}/api/v1/officers
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "person_id": "{{personId}}",
  "badge_number": "BADGE-TEST-001",
  "rank": "detective",
  "department_id": "{{departmentId}}"
}

> {%
  client.test("Officer created successfully", function() {
    client.assert(response.status === 201, "Expected 201");
    client.assert(response.body.id !== undefined, "No ID returned");
    client.assert(response.body.badge_number === "BADGE-TEST-001", "Badge mismatch");
  });
%}
```

### 13.2 Negative Tests — Unauthorized (No Token)

For every PROTECTED endpoint, generate one unauthorized test by omitting the `Authorization` header:

```http
### [NEGATIVE] Create Officer — No Auth Token
POST {{baseUrl}}/api/v1/officers
Content-Type: application/json

{
  "person_id": "{{personId}}",
  "badge_number": "BADGE-UNAUTH",
  "rank": "detective",
  "department_id": "{{departmentId}}"
}

> {%
  client.test("Unauthorized request rejected", function() {
    client.assert(response.status === 401, "Expected 401 Unauthorized");
  });
%}
```

### 13.3 Negative Tests — Forbidden (Wrong Role)

For role-restricted endpoints, generate a test using a token from a user who lacks the required role:

```http
### [NEGATIVE] Delete Case — Insufficient Role (officer trying admin action)
DELETE {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{officerAccessToken}}

> {%
  client.test("Forbidden for non-admin", function() {
    client.assert(response.status === 403, "Expected 403 Forbidden");
  });
%}
```

### 13.4 Negative Tests — Not Found

For every endpoint with a path param referencing a resource:

```http
### [NEGATIVE] Get Case — Non-existent ID
GET {{baseUrl}}/api/v1/cases/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{accessToken}}

> {%
  client.test("Not found", function() {
    client.assert(response.status === 404, "Expected 404 Not Found");
  });
%}
```

### 13.5 Negative Tests — Missing Required Field

For every POST/PUT/PATCH endpoint:

```http
### [NEGATIVE] Create Officer — Missing Required Field (badge_number omitted)
POST {{baseUrl}}/api/v1/officers
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "person_id": "{{personId}}",
  "rank": "detective",
  "department_id": "{{departmentId}}"
}

> {%
  client.test("Validation error on missing field", function() {
    client.assert(response.status === 422, "Expected 422 Unprocessable Entity");
  });
%}
```

### 13.6 Negative Tests — Invalid Enum Value

```http
### [NEGATIVE] Create Case — Invalid Status Enum
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Bad Status Case",
  "status": "INVALID_STATUS_XYZ",
  "priority": "high",
  "opened_date": "2024-01-15"
}

> {%
  client.test("Invalid enum rejected", function() {
    client.assert(response.status === 422, "Expected 422 for invalid enum");
  });
%}
```

### 13.7 Negative Tests — Invalid Token

```http
### [NEGATIVE] Get Cases — Malformed Token
GET {{baseUrl}}/api/v1/cases
Authorization: Bearer this.is.not.a.valid.jwt.token

> {%
  client.test("Malformed token rejected", function() {
    client.assert(response.status === 401, "Expected 401 for invalid token");
  });
%}
```

### 13.8 Negative Tests — Expired Token

```http
### [NEGATIVE] Get Cases — Expired Token
GET {{baseUrl}}/api/v1/cases
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

> {%
  client.test("Expired token rejected", function() {
    client.assert(response.status === 401, "Expected 401 for expired token");
  });
%}
```

### 13.9 Validation Tests — Type Mismatch

```http
### [NEGATIVE] Create Case — Integer in String Field
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": 99999,
  "status": "open",
  "opened_date": "2024-01-15"
}

> {%
  client.test("Type mismatch rejected", function() {
    client.assert(response.status === 422, "Expected 422 for type error");
  });
%}
```

### 13.10 Pagination Structure Tests

```http
### [POSITIVE] List Cases — Verify Pagination Shape
GET {{baseUrl}}/api/v1/cases?page=1&size=5
Authorization: Bearer {{accessToken}}

> {%
  client.test("Pagination structure correct", function() {
    client.assert(response.status === 200, "Expected 200");
    client.assert(response.body.total !== undefined, "total missing");
    client.assert(response.body.page !== undefined, "page missing");
    client.assert(response.body.size !== undefined, "size missing");
    client.assert(Array.isArray(response.body.items), "items not array");
  });
%}
```

---

## 14. FILE ORGANIZATION RULES

### 14.1 Complete Directory Structure

```
tests/
  http/
    _auth.http                ← global login block (run first)
    _variables.http           ← shared variable declarations
    auth.http                 ← auth module endpoints
    personnel.http            ← personnel module
    officers.http             ← officers module
    departments.http          ← departments module
    cases.http                ← cases module
    evidence.http             ← evidence module
    reports.http              ← reports module
    [module].http             ← one per discovered module

  generated/
    endpoint_inventory.json   ← full list of discovered endpoints
    generated_variables.json  ← all seeds, credentials, IDs
    schema_resolution.log     ← which schemas were/were not resolved
    unresolved_routes.log     ← routes that could not be fully parsed
```

### 14.2 `_variables.http` Format

```http
# =============================================================================
# SHARED VARIABLES — loaded into global scope at session start
# Run this file first in VS Code REST Client
# =============================================================================

@baseUrl = http://localhost:8000
@apiPrefix = /api/v1

@adminNationalId = SUPER-0001
@adminPassword = SuperPass123!

@officerNationalId = OFF-0001
@officerPassword = OfficerPass123!

# Populated at runtime by login response handlers:
@accessToken =
@refreshToken =
@userId =
@personId =
@officerId =
@departmentId =
@caseId =
@evidenceId =
```

### 14.3 Execution Order for Complete Integration Test

Run files in this sequence:

```
1. _variables.http         ← declare shared vars
2. _auth.http              ← login, extract tokens
3. departments.http        ← create departments first
4. personnel.http          ← create persons
5. officers.http           ← create officers (depends on persons, departments)
6. cases.http              ← create/manage cases
7. evidence.http           ← add evidence to cases
8. reports.http            ← generate reports
9. auth.http               ← test logout, token refresh
```

---

## 15. ERROR HANDLING RULES

### 15.1 Unresolvable Schemas

If a request body references a schema that cannot be found in any `schemas.py`:

1. Log to `schema_resolution.log`:
   ```
   [UNRESOLVED SCHEMA] Module: cases | Endpoint: POST /cases | Schema: CreateCasePayload | Reason: not found in app/modules/cases/schemas.py
   ```
2. Generate the request block with a placeholder body:
   ```http
   # WARNING: Schema 'CreateCasePayload' could not be resolved.
   # Body below is a placeholder. Inspect app/modules/cases/schemas.py manually.
   POST {{baseUrl}}/api/v1/cases
   Authorization: Bearer {{accessToken}}
   Content-Type: application/json

   {
     "__unresolved": true,
     "__schema": "CreateCasePayload",
     "__note": "Schema not found during scan. Add fields manually."
   }
   ```
3. DO NOT skip the endpoint. Always generate a block, even with a placeholder body.

### 15.2 Circular Imports

If scanning a module triggers a circular import when resolving `Depends()` chains:

1. Log to `unresolved_routes.log`:
   ```
   [CIRCULAR IMPORT] app/modules/officers/dependencies.py → app/modules/personnel/dependencies.py → app/modules/officers/dependencies.py
   ```
2. Mark the dependency as `UNRESOLVED_DEPENDS`
3. Continue scanning other modules without interruption

### 15.3 Dynamic Router Registration

If a router is registered dynamically (e.g., in a loop or via `importlib`):

```python
for module_name in ACTIVE_MODULES:
    router = importlib.import_module(f"app.modules.{module_name}.routes").router
    app.include_router(router)
```

Log to `unresolved_routes.log`:

```
[DYNAMIC REGISTRATION] app/main.py line 42: dynamic include_router loop detected. Modules: [list if discoverable]. Manual inspection required.
```

Attempt to resolve by scanning all directories matching `app/modules/*/routes.py` directly.

### 15.4 Unresolved `Depends()` Functions

If a `Depends(some_function)` cannot be traced to a definition:

1. Log: `[UNRESOLVED DEPENDS] some_function in app/modules/X/routes.py — source not found`
2. Default assumption: treat as `REQUIRES_AUTH = True` (conservative assumption)
3. Add comment in generated `.http` block:
   ```http
   # NOTE: Dependency 'some_function' could not be resolved.
   # Auth requirement assumed: REQUIRED (conservative).
   ```

### 15.5 Missing Modules

If a module directory exists but has no `routes.py`:

- Skip the module
- Log: `[SKIP] app/modules/analytics/ — no routes.py found`

If a `routes.py` exists but has no `APIRouter` instance:

- Skip the file
- Log: `[SKIP] app/modules/analytics/routes.py — no APIRouter instance found`

---

## 16. DYNAMIC DISCOVERY REQUIREMENTS

### 16.1 Source of Truth Hierarchy

The AI agent MUST derive all information from source code only. In order of authority:

```
1. Route decorators          → endpoint paths, methods, status codes
2. Pydantic schemas          → request/response bodies
3. Dependency functions      → auth requirements, role restrictions
4. SQLAlchemy models         → field inference when schemas are incomplete
5. Seed scripts              → test credentials, initial IDs
6. Existing tests            → additional credential and fixture discovery
7. Alembic migrations        → schema evolution, field history
```

### 16.2 PROHIBITED Behaviors

The agent MUST NOT:

- Use hardcoded endpoint paths that are not verified from source code
- Assume request body fields without inspecting the Pydantic schema
- Use hardcoded credentials without first searching seed/fixture files
- Skip any discovered endpoint from the generated `.http` files
- Fabricate response models without inspecting `response_model=` decorators
- Rely on README files or external documentation as the primary source of truth

### 16.3 Documentation as Secondary Reference

If `README.md` or `docs/` exists, use it ONLY to:

- Confirm discovered endpoints
- Resolve ambiguous naming
- Cross-check discovered credentials

Never use documentation as the PRIMARY source for endpoint discovery.

---

## 17. REQUIRED OUTPUTS

### 17.1 `tests/http/*.http`

One file per module, following the format defined in Sections 10–12.

### 17.2 `endpoint_inventory.json`

Complete JSON array of all discovered endpoints.

```json
[
  {
    "module": "cases",
    "method": "POST",
    "path": "/api/v1/cases",
    "full_url": "http://localhost:8000/api/v1/cases",
    "requires_auth": true,
    "required_role": null,
    "request_schema": "CreateCaseSchema",
    "response_model": "CaseResponse",
    "status_code": 201,
    "tags": ["Cases"],
    "path_params": [],
    "query_params": [],
    "source_file": "app/modules/cases/routes.py",
    "source_line": 45,
    "http_file": "tests/http/cases.http"
  },
  {
    "module": "cases",
    "method": "GET",
    "path": "/api/v1/cases/{case_id}",
    "full_url": "http://localhost:8000/api/v1/cases/{case_id}",
    "requires_auth": true,
    "required_role": null,
    "request_schema": null,
    "response_model": "CaseDetailResponse",
    "status_code": 200,
    "tags": ["Cases"],
    "path_params": [{"name": "case_id", "type": "UUID"}],
    "query_params": [],
    "source_file": "app/modules/cases/routes.py",
    "source_line": 67,
    "http_file": "tests/http/cases.http"
  }
]
```

### 17.3 `generated_variables.json`

All discovered and generated test variables.

```json
{
  "baseUrl": "http://localhost:8000",
  "apiPrefix": "/api/v1",
  "credentials": {
    "admin": {
      "national_id": "SUPER-0001",
      "password": "SuperPass123!",
      "role": "admin",
      "source": "scripts/seed.py"
    },
    "officer": {
      "national_id": "OFF-0001",
      "password": "OfficerPass123!",
      "role": "officer",
      "source": "scripts/seed.py"
    }
  },
  "seeded_ids": {
    "departments": [
      {"id": "uuid-here", "name": "Homicide", "source": "scripts/seed.py"}
    ]
  },
  "runtime_variables": {
    "accessToken": "",
    "refreshToken": "",
    "personId": "",
    "officerId": "",
    "departmentId": "",
    "caseId": "",
    "evidenceId": ""
  }
}
```

### 17.4 `schema_resolution.log`

```
[OK]         cases         POST /api/v1/cases                 CreateCaseSchema       resolved from app/modules/cases/schemas.py:12
[OK]         cases         GET  /api/v1/cases/{case_id}       CaseDetailResponse     resolved from app/modules/cases/schemas.py:58
[UNRESOLVED] reports       POST /api/v1/reports               GenerateReportPayload  not found in any schemas.py
[PARTIAL]    officers      PUT  /api/v1/officers/{id}         UpdateOfficerSchema    found, 2 fields unresolvable (nested enum)
```

### 17.5 `unresolved_routes.log`

```
[DYNAMIC]    app/main.py:42         Dynamic router registration loop — manual review needed
[CIRCULAR]   app/modules/officers/dependencies.py   Circular import chain detected
[SKIP]       app/modules/analytics/routes.py        No APIRouter instance found
[SKIP]       app/modules/legacy/                    Directory exists, no routes.py
[UNRESOLVED_DEPENDS] check_department_access  app/modules/departments/routes.py:88 — source not found
```

---

## 18. ADVANCED REQUIREMENTS

### 18.1 Nested Routers

When a module registers sub-routers internally:

```python
# app/modules/cases/routes.py
router = APIRouter(prefix="/cases")
evidence_router = APIRouter(prefix="/{case_id}/evidence")
router.include_router(evidence_router)
```

Reconstruct the full nested path:

```
/api/v1/cases/{case_id}/evidence
/api/v1/cases/{case_id}/evidence/{evidence_id}
```

Treat each nested route independently in the inventory and generate separate `.http` blocks.

### 18.2 Versioned APIs

If multiple API versions exist (`/api/v1/`, `/api/v2/`):

- Generate a separate `.http` file per version per module:
  ```
  tests/http/v1/cases.http
  tests/http/v2/cases.http
  ```
- Declare version-specific base URLs:
  ```http
  @baseUrlV1 = http://localhost:8000/api/v1
  @baseUrlV2 = http://localhost:8000/api/v2
  ```

### 18.3 Multipart/Form-Data Endpoints

For endpoints accepting file uploads or `multipart/form-data`:

```http
### [CASES] Upload Case Document
# @name uploadDocument
POST {{baseUrl}}/api/v1/cases/{{caseId}}/documents
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data; boundary=boundary123

--boundary123
Content-Disposition: form-data; name="file"; filename="evidence.pdf"
Content-Type: application/pdf

< ./test_files/sample_evidence.pdf
--boundary123
Content-Disposition: form-data; name="description"

Test evidence file upload
--boundary123--

> {%
  client.test("File uploaded", function() {
    client.assert(response.status === 201, "Expected 201");
    client.assert(response.body.file_url !== undefined, "No file URL returned");
  });
%}
```

Detect multipart endpoints by:
- `File` type in function signature: `file: UploadFile`
- `Form(...)` usage in function signature
- Content-Type declared as `multipart/form-data` in endpoint decorator

### 18.4 Optional Auth Routes

Some endpoints accept both authenticated and unauthenticated requests (e.g., public listings that show more data when authenticated).

Detect by: `Optional[User] = Depends(get_optional_current_user)` pattern.

Generate TWO test blocks: one with auth header, one without.

```http
### [PUBLIC] List Public Cases — No Auth
GET {{baseUrl}}/api/v1/cases/public?page=1&size=10

> {%
  client.test("Public list accessible", function() {
    client.assert(response.status === 200, "Expected 200 without auth");
  });
%}

###

### [AUTH] List Cases — With Auth (more data)
GET {{baseUrl}}/api/v1/cases/public?page=1&size=10
Authorization: Bearer {{accessToken}}

> {%
  client.test("Authenticated list accessible", function() {
    client.assert(response.status === 200, "Expected 200 with auth");
  });
%}
```

### 18.5 Async Endpoints

Treat `async def` and `def` endpoint functions identically for HTTP test generation purposes. The HTTP layer does not differentiate.

---

## 19. RESPONSE ASSERTION RULES

### 19.1 Status Code Assertions

Always assert the exact expected status code:

```javascript
client.assert(response.status === 200, "Expected 200 OK");
client.assert(response.status === 201, "Expected 201 Created");
client.assert(response.status === 204, "Expected 204 No Content");
client.assert(response.status === 400, "Expected 400 Bad Request");
client.assert(response.status === 401, "Expected 401 Unauthorized");
client.assert(response.status === 403, "Expected 403 Forbidden");
client.assert(response.status === 404, "Expected 404 Not Found");
client.assert(response.status === 422, "Expected 422 Unprocessable Entity");
```

### 19.2 Response Shape Assertions

For object responses:

```javascript
client.test("Response shape valid", function() {
  client.assert(response.body.id !== undefined, "id field missing");
  client.assert(typeof response.body.id === "string", "id should be string (UUID)");
  client.assert(response.body.created_at !== undefined, "created_at missing");
  client.assert(response.body.status !== undefined, "status field missing");
});
```

### 19.3 Token Existence Assertions

```javascript
client.test("Token response valid", function() {
  client.assert(response.body.access_token !== undefined, "access_token missing");
  client.assert(response.body.token_type === "bearer", "token_type not bearer");
  client.assert(typeof response.body.access_token === "string", "access_token not string");
  client.assert(response.body.access_token.length > 20, "access_token suspiciously short");
});
```

### 19.4 Created Resource ID Assertions

```javascript
client.test("Resource ID returned", function() {
  client.assert(response.body.id !== undefined, "id missing");
  client.assert(response.body.id !== null, "id is null");
  client.assert(response.body.id !== "", "id is empty string");
});
```

### 19.5 Pagination Structure Assertions

```javascript
client.test("Pagination structure valid", function() {
  client.assert(response.body.total !== undefined, "total missing");
  client.assert(response.body.page !== undefined, "page missing");
  client.assert(response.body.size !== undefined, "size missing");
  client.assert(Array.isArray(response.body.items), "items should be array");
  client.assert(response.body.total >= 0, "total should be non-negative");
  client.assert(response.body.items.length <= response.body.size, "items exceeds size");
});
```

### 19.6 Timestamp Assertions

```javascript
client.test("Timestamps valid", function() {
  var createdAt = new Date(response.body.created_at);
  client.assert(!isNaN(createdAt.getTime()), "created_at not valid ISO datetime");
  client.assert(response.body.updated_at !== undefined, "updated_at missing");
});
```

### 19.7 Boolean Field Assertions

```javascript
client.test("Boolean fields valid", function() {
  client.assert(typeof response.body.is_active === "boolean", "is_active should be boolean");
  client.assert(typeof response.body.is_verified === "boolean", "is_verified should be boolean");
});
```

### 19.8 Enum Value Assertions

```javascript
client.test("Enum value valid", function() {
  var validStatuses = ["open", "closed", "pending", "archived"];
  client.assert(validStatuses.includes(response.body.status), "status not in allowed enum values");
});
```

### 19.9 Error Response Shape Assertions

For 422 and 400 responses:

```javascript
client.test("Error response shape valid", function() {
  client.assert(response.body.detail !== undefined, "detail field missing from error response");
});
```

For 422 specifically (FastAPI validation errors):

```javascript
client.test("Validation error shape valid", function() {
  client.assert(Array.isArray(response.body.detail), "422 detail should be array");
  client.assert(response.body.detail.length > 0, "422 detail array should not be empty");
  client.assert(response.body.detail[0].loc !== undefined, "loc missing from validation error");
  client.assert(response.body.detail[0].msg !== undefined, "msg missing from validation error");
  client.assert(response.body.detail[0].type !== undefined, "type missing from validation error");
});
```

---

## 20. FINAL EXECUTION FLOW

The agent MUST execute the following algorithm in exact order, completing each step fully before proceeding to the next.

```
STEP 1 — SCAN PROJECT
  1.1 Read app/main.py
      → Extract all app.include_router() calls
      → Build prefix resolution tree
  1.2 Recursively find all app/modules/**/routes.py
  1.3 Recursively find all app/modules/**/schemas.py
  1.4 Recursively find all app/modules/**/models.py
  1.5 Recursively find all app/modules/**/dependencies.py
  1.6 Read app/core/*.py for global auth dependencies
  1.7 Read app/config/*.py for base URL and settings

STEP 2 — DISCOVER ROUTES
  2.1 For each routes.py:
      → Find APIRouter instance(s) and their prefixes
      → Find all route decorators (@router.get, .post, .put, .patch, .delete)
      → Extract path, method, status_code, tags, response_model, dependencies
  2.2 For each route, extract function signature:
      → Identify path params (match against path string)
      → Identify query params (primitive types, not Depends)
      → Identify body params (Pydantic BaseModel subclasses)
      → Identify Depends() / Security() / Annotated[] dependencies
  2.3 Reconstruct full URL for every route
  2.4 Write all to endpoint_inventory.json

STEP 3 — RESOLVE SCHEMAS
  3.1 For each body param schema, locate class in schemas.py
  3.2 Extract all fields, types, defaults, validators, Field() metadata
  3.3 Generate example value for each field using type mapping (Section 7.2)
  3.4 Recursively resolve nested schemas
  3.5 Resolve all Enum fields to first valid member
  3.6 Log unresolvable schemas to schema_resolution.log

STEP 4 — RESOLVE AUTH
  4.1 For each endpoint, resolve full dependency chain
  4.2 Classify as PUBLIC or PROTECTED
  4.3 Extract role requirements
  4.4 Resolve Annotated[] type aliases
  4.5 Check for router-level auth dependencies
  4.6 Log unresolvable dependencies to unresolved_routes.log

STEP 5 — DISCOVER SEED DATA AND GENERATE VARIABLES
  5.1 Scan all seed/fixture/test files
  5.2 Extract all credentials (username, national_id, password, role)
  5.3 Extract pre-seeded IDs
  5.4 Extract role and department mappings
  5.5 Write all to generated_variables.json

STEP 6 — GENERATE REQUEST CHAINS
  6.1 Build dependency graph (which endpoints depend on IDs from others)
  6.2 Sort endpoints topologically
  6.3 For each endpoint, plan variable extraction and injection
  6.4 Build chained request sequence with variable passing

STEP 7 — GENERATE .HTTP FILES
  7.1 Create tests/http/ directory if not exists
  7.2 For each module:
      → Create [module_name].http
      → Write file header (Section 11.1)
      → Write variable declarations
      → Write login block (if module has protected endpoints)
      → Write positive test blocks for each endpoint
      → Write negative test blocks (unauthorized, forbidden, not found, validation, enum)
      → Write pagination tests for list endpoints
      → Add response assertions to every block
  7.3 Create _auth.http with global login block
  7.4 Create _variables.http with all shared variable declarations

STEP 8 — RUN SMOKE TESTS (if REST Client CLI or newman equivalent is available)
  8.1 Execute _auth.http — verify login succeeds
  8.2 Execute each module .http file in dependency order
  8.3 Capture pass/fail for each test block
  8.4 Record results to tests/generated/smoke_results.log

STEP 9 — LOG FAILURES
  9.1 For each failed smoke test, log:
      - Endpoint path
      - Expected status code
      - Actual status code
      - Response body (first 500 chars)
      - Variable resolution state at time of failure
  9.2 Write to tests/generated/smoke_results.log

STEP 10 — EXPORT INVENTORIES
  10.1 Write final endpoint_inventory.json (complete, including auth classification)
  10.2 Write final generated_variables.json (all variables, populated with seeded values)
  10.3 Write schema_resolution.log (all resolved and unresolved schemas)
  10.4 Write unresolved_routes.log (all skips, dynamic registrations, circular imports)
  10.5 Print summary to console:
       - Total endpoints discovered
       - Total .http files generated
       - Total test blocks generated
       - Total unresolved schemas
       - Total unresolved routes
       - Total smoke test passes / fails
```

---

## APPENDIX A — COMPLETE EXAMPLE: `cases.http`

```http
# =============================================================================
# MODULE: Cases
# Base URL: http://localhost:8000
# Auth: JWT Bearer Token
# Generated from: app/modules/cases/routes.py
# =============================================================================

@baseUrl = http://localhost:8000
@accessToken =
@refreshToken =
@caseId =
@officerId =
@departmentId =

###
# ------------------------------------------------------------------
# [AUTH] Login
# ------------------------------------------------------------------
# @name login
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
  "national_id": "SUPER-0001",
  "password": "SuperPass123!"
}

> {%
  client.global.set("accessToken", response.body.access_token);
  client.global.set("refreshToken", response.body.refresh_token);
  client.test("Login OK", function() {
    client.assert(response.status === 200, "Expected 200");
    client.assert(response.body.access_token !== undefined, "Token missing");
  });
%}

###
# ------------------------------------------------------------------
# [POSITIVE] Create Case
# POST /api/v1/cases | Auth: Required | Status: 201
# ------------------------------------------------------------------
# @name createCase
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Automated Test Case",
  "description": "Generated by REST test automation agent",
  "status": "open",
  "priority": "high",
  "assigned_department_id": "{{departmentId}}",
  "opened_date": "2024-01-15"
}

> {%
  client.global.set("caseId", response.body.id);
  client.test("Case created", function() {
    client.assert(response.status === 201, "Expected 201 Created");
    client.assert(response.body.id !== undefined, "No ID returned");
    client.assert(response.body.status === "open", "Status should be open");
    client.assert(response.body.title === "Automated Test Case", "Title mismatch");
  });
%}

###
# ------------------------------------------------------------------
# [POSITIVE] List Cases — Default Pagination
# GET /api/v1/cases | Auth: Required | Status: 200
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases?page=1&size=20&sort_by=created_at&sort_order=desc
Authorization: Bearer {{accessToken}}

> {%
  client.test("List cases", function() {
    client.assert(response.status === 200, "Expected 200");
    client.assert(Array.isArray(response.body.items), "items should be array");
    client.assert(response.body.total >= 0, "total should be non-negative");
    client.assert(response.body.page === 1, "page mismatch");
  });
%}

###
# ------------------------------------------------------------------
# [POSITIVE] Get Case by ID
# GET /api/v1/cases/{case_id} | Auth: Required | Status: 200
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}

> {%
  client.test("Get case by ID", function() {
    client.assert(response.status === 200, "Expected 200");
    client.assert(response.body.id === client.global.get("caseId"), "ID mismatch");
    client.assert(response.body.title !== undefined, "title missing");
    client.assert(response.body.status !== undefined, "status missing");
  });
%}

###
# ------------------------------------------------------------------
# [POSITIVE] Update Case
# PATCH /api/v1/cases/{case_id} | Auth: Required | Status: 200
# ------------------------------------------------------------------
PATCH {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "pending",
  "description": "Updated by automated test"
}

> {%
  client.test("Case updated", function() {
    client.assert(response.status === 200, "Expected 200");
    client.assert(response.body.status === "pending", "Status not updated");
  });
%}

###
# ------------------------------------------------------------------
# [NEGATIVE] Create Case — No Auth Token
# ------------------------------------------------------------------
POST {{baseUrl}}/api/v1/cases
Content-Type: application/json

{
  "title": "No Auth Test",
  "status": "open",
  "opened_date": "2024-01-15"
}

> {%
  client.test("No auth rejected", function() {
    client.assert(response.status === 401, "Expected 401 Unauthorized");
  });
%}

###
# ------------------------------------------------------------------
# [NEGATIVE] Get Case — Non-existent ID
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{accessToken}}

> {%
  client.test("Not found", function() {
    client.assert(response.status === 404, "Expected 404 Not Found");
  });
%}

###
# ------------------------------------------------------------------
# [NEGATIVE] Create Case — Missing Required Field (title)
# ------------------------------------------------------------------
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "open",
  "opened_date": "2024-01-15"
}

> {%
  client.test("Missing field rejected", function() {
    client.assert(response.status === 422, "Expected 422 Unprocessable Entity");
    client.assert(Array.isArray(response.body.detail), "detail should be array");
  });
%}

###
# ------------------------------------------------------------------
# [NEGATIVE] Create Case — Invalid Status Enum
# ------------------------------------------------------------------
POST {{baseUrl}}/api/v1/cases
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Bad Enum Test",
  "status": "INVALID_STATUS_XYZ",
  "opened_date": "2024-01-15"
}

> {%
  client.test("Invalid enum rejected", function() {
    client.assert(response.status === 422, "Expected 422 for invalid enum");
  });
%}

###
# ------------------------------------------------------------------
# [NEGATIVE] Get Case — Malformed Token
# ------------------------------------------------------------------
GET {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer not.a.real.jwt.token

> {%
  client.test("Malformed token rejected", function() {
    client.assert(response.status === 401, "Expected 401 for malformed token");
  });
%}

###
# ------------------------------------------------------------------
# [CLEANUP] Delete Case
# DELETE /api/v1/cases/{case_id} | Auth: Required | Role: admin
# ------------------------------------------------------------------
DELETE {{baseUrl}}/api/v1/cases/{{caseId}}
Authorization: Bearer {{accessToken}}

> {%
  client.test("Case deleted", function() {
    client.assert(
      response.status === 200 || response.status === 204,
      "Expected 200 or 204 on delete"
    );
  });
%}
```

---
