# 1. System Overview

## 1.1 Backend Architecture
- **Framework**: FastAPI (>=0.111.0 in requirements.txt).
- **Project structure**: Modular routers under `app/modules/*` with the FastAPI app in `app/main.py`.
- **Database**: PostgreSQL via SQLAlchemy async engine (asyncpg).
- **Cache/session**: Redis (async) used for sessions, token revocation, and profile cache.
- **External integrations**: Object storage settings exist (`OBJECT_STORAGE_*`), but no integration code is present.

## 1.2 Authentication Architecture
- JWT access and refresh tokens (HS256).
- Authorization header uses **Bearer** tokens.
- No cookie-based auth and no OAuth2 password flow; token leakage in query/body is blocked by middleware except for `/auth/refresh` and `/auth/logout` bodies.

## 1.3 Session Architecture
- **Stateful sessions** stored in Redis with last activity timestamps.
- **Session TTL**: 28800 seconds (`MAX_SESSION_SECONDS`).
- **Idle timeout**: 3600 seconds (`IDLE_TIMEOUT_SECONDS`).
- **Concurrent sessions**: 1 by default (`MAX_CONCURRENT_SESSIONS_PER_OFFICER`).

## 1.4 Token Lifecycle
- **Access token expiry**: 900 seconds (`ACCESS_TOKEN_TTL_SECONDS`).
- **Refresh token expiry**: 28800 seconds (same as max session lifetime).
- **Rotation policy**: Refresh token is not rotated; refresh issues a new access token only.
- **Revocation**: Token JTIs are stored in Redis for revocation on logout/session invalidation.

## 1.5 Role Hierarchy
Roles are defined in `RoleNameEnum` with no explicit hierarchy in code:
- readonly
- forensic
- legal_officer
- investigator
- department_head
- admin
- superadmin

Permission sets (from `ROLE_PERMISSIONS`):
- readonly: auth_activity_ping, auth_logout, auth_password_change, view_case
- forensic: base auth + view_case, manage_evidence
- legal_officer: base auth + view_case, update_case
- investigator: base auth + create_case, view_case, update_case, manage_evidence
- department_head: base auth + create_case, view_case, update_case, delete_case, manage_evidence, manage_users
- admin: base auth + create_case, view_case, update_case, delete_case, manage_evidence, manage_users, manage_roles, manage_sessions, view_audit_logs
- superadmin: wildcard (*)

## 1.6 Permission Architecture
- **Role-based permissions** via `ROLE_PERMISSIONS`.
- **Case-level permissions** via `case_permission` (read/write/admin), plus case assignments and lead officer access.
- **Department scope** enforced in several services (reporting, department officer listing) and optional in `AuthorizationService`.

## 1.7 Module Structure
| Module | API Prefix | Endpoints |
|---|---|---|
| system | /api/v1 | 2 |
| auth | /api/v1/auth | 7 |
| personnel | /api/v1/personnel | 21 |
| departments | /api/v1/departments | 8 |
| cases | /api/v1/cases | 39 |
| arrests (standalone) | /api/v1/arrests, /api/v1/cases/{case_id}/arrests | 5 |
| interrogation | /api/v1/cases/{case_id}/interrogations | 2 |
| evidence | /api/v1/cases/{case_id}/evidence, /api/v1/evidence, /api/v1/cases/{case_id}/photos | 16 |
| legal | /api/v1/cases/{case_id}/court-case, /api/v1/court-cases, /api/v1/charges | 7 |
| reports | /api/v1/reports | 15 |

# 2. API Base Configuration

## 2.1 Base URL
- Base path for all API routes: `/api/v1`.
- No URL versioning beyond `/api/v1` is defined in code.

## 2.2 Required Headers
| Header | Required | Value | Notes |
|---|---|---|---|
| Authorization | Conditional | Bearer {access_token} | Required for all non-public endpoints.
| Content-Type | Conditional | application/json | Required for JSON request bodies.
| X-Request-ID | Optional | client-generated UUID | Response always includes `X-Request-ID`.

## 2.3 Authorization Format
- **Authorization**: `Bearer {access_token}`
- Tokens are not accepted in query parameters or JSON bodies except for `/auth/refresh` and `/auth/logout` refresh tokens.

## 2.4 Content Types
- Default: `application/json` for request bodies.
- File uploads: Not implemented (no `UploadFile` or `File(...)`).
- Form data: Not implemented.

## 2.5 Timeout Recommendations
- No backend timeouts are configured in code.
- Client timeout is a frontend decision; use a standard timeout (e.g., 10-30s) for most endpoints.
- Report endpoints are read-only but not long-running in code; no special timeout is defined.

## 2.6 Pagination Standards
- Pagination uses **page** and **size** query parameters.
- Defaults: page=1, size=20 (some reporting endpoints default size=24).
- Max size: 100.

Standard paginated response envelope:
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 20
}
```

## 2.7 Standard Error Response Envelope
- Custom exceptions return:
```json
{
  "detail": "Error message"
}
```
- Validation errors (422) return:
```json
{
  "detail": [
    {"loc": ["body", "field"], "msg": "Validation error"}
  ]
}
```

## 2.8 Standard Success Response Envelope
Not implemented in this backend.

# 3. Authentication Flow

## 3.1 Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Request schema**: `national_id` (string, 1-100), `password` (string, min 8)
- **Response schema**: `TokenResponse` (access_token, refresh_token, token_type, expires_in, session_id)
- **Token storage**: Backend expects access token in Authorization header and refresh token in body for refresh/logout.
- **Success handling**: Store access token, refresh token, expires_in, session_id; set Authorization header for subsequent requests.
- **Errors**: 401 invalid credentials or inactive account; 429 rate limit; 422 validation.

## 3.2 Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Backend behavior**: Revokes access and refresh JTIs, deletes session metadata.
- **Frontend responsibilities**: Clear tokens and user state; redirect to login.

## 3.3 Token Refresh Flow
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Trigger**: Before access token expiry or after a 401.
- **Request schema**: `refresh_token` (string)
- **Response schema**: `AccessTokenResponse` (access_token, token_type, expires_in)
- **Failure handling**: On 401, clear tokens and force re-login.

## 3.4 Activity Ping
- **Endpoint**: `POST /api/v1/auth/activity-ping`
- **When to call**: Optional keep-alive if the user is idle and no API traffic occurs.
- **Frequency**: Before `IDLE_TIMEOUT_SECONDS` (3600s) if needed.

## 3.5 Idle Timeout Handling
- **Idle timeout**: 3600 seconds.
- **Frontend**: Track user activity; if idle exceeds timeout, log out and clear tokens.

## 3.6 Session Expiration Handling
- **Signal**: 401 with `{"detail": "Not authenticated"}` or `Session expired due to inactivity...`.
- **Frontend**: Attempt refresh once; if it fails, clear tokens and redirect.

## 3.7 Browser Close Behavior
- No cookie-based auth; persistence depends on frontend storage choice.

## 3.8 Protected Route Handling
- Require a valid access token and role/permission data before rendering protected pages.

## 3.9 Unauthorized Response Handling
- **401**: Attempt refresh; if refresh fails, log out.
- **403**: Show forbidden state; do not retry.

## 3.10 Forced Logout
- Triggered by password reset/change or session invalidation (idle timeout, concurrency enforcement).
- Backend response is 401; clear tokens and redirect to login.

## 3.11 Concurrent Refresh Handling
- Use a single in-flight refresh request; queue failed requests until refresh completes.

## 3.12 Automatic Redirect Behavior
- Redirect to login on 401 after failed refresh.
- Redirect to forbidden page on 403.
- Preserve intended URL for post-login redirect.

# 4. Route-by-Route API Documentation

## 4.1 System

---
#### SYSTEM - GET /api/v1/health

**Purpose:** Health check for database and Redis.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| status | string | Yes | overall health status |
| timestamp | string | Yes | ISO timestamp |
| components | object | Yes | component health map |
| components.database.status | string | Yes | database status |
| components.database.latency_ms | number | No | database latency |
| components.redis.status | string | Yes | redis status |
| components.redis.latency_ms | number | No | redis latency |
| version | string | Yes | app version |

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "components": {
    "database": {"status": "healthy", "latency_ms": 3.1},
    "redis": {"status": "healthy", "latency_ms": 1.2}
  },
  "version": "3.0.0"
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Health payload returned |

**Error Responses:**

Not applicable.

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use for uptime checks; not for user flow.

**Loading State Considerations:** Minimal.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** No caching.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### SYSTEM - GET /api/v1/readiness

**Purpose:** Readiness check for database, Redis, seed data, permissions, and migrations.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| ready | boolean | Yes | readiness flag |
| checks | object | Yes | readiness checks map |

```json
{
  "ready": true,
  "checks": {
    "database": true,
    "redis": true,
    "seed_case_status": true,
    "seed_roles": true,
    "tables": true,
    "migrations": true,
    "permissions": true
  }
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | All checks ready |
| 503 | Service Unavailable | One or more checks failed |

**Error Responses:**

```json
{"detail": "Service temporarily unavailable"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Not used in UI; useful for ops.

**Loading State Considerations:** Minimal.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** No caching.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

## 4.2 Authentication

---
#### AUTH - POST /api/v1/auth/login

**Purpose:** Authenticate an officer and start a session.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| national_id | string | Yes | - | min_length=1, max_length=100 | trimmed |
| password | string | Yes | - | min_length=8 | - |

```json
{
  "national_id": "A123456",
  "password": "password123"
}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| access_token | string | Yes | JWT access token |
| refresh_token | string | Yes | JWT refresh token |
| token_type | string | Yes | bearer |
| expires_in | integer | Yes | access token TTL seconds |
| session_id | string | Yes | session UUID |

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 900,
  "session_id": "uuid"
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Valid credentials |
| 401 | Unauthorized | Invalid credentials or inactive account |
| 429 | Too Many Requests | Rate limit exceeded |
| 422 | Validation Error | Invalid request body |

**Error Responses:**

```json
{"detail": "Invalid credentials"}
```

```json
{"detail": "Account is inactive"}
```

**Business Logic Side Effects:** Creates session in Redis; writes auth audit logs.

**Frontend Handling Notes:** Store tokens and session_id; use Authorization header for subsequent requests.

**Loading State Considerations:** Disable login button during request.

**Form Validation Requirements:** Ensure non-empty national_id and password length >= 8.

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - POST /api/v1/auth/refresh

**Purpose:** Issue a new access token from a refresh token.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| refresh_token | string | Yes | - | min_length=1 | - |

```json
{
  "refresh_token": "<jwt>"
}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| access_token | string | Yes | JWT access token |
| token_type | string | Yes | bearer |
| expires_in | integer | Yes | access token TTL seconds |

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Refresh token valid |
| 401 | Unauthorized | Invalid/expired refresh token or session expired |
| 422 | Validation Error | Invalid request body |

**Error Responses:**

```json
{"detail": "Invalid or expired refresh token"}
```

```json
{"detail": "Session expired due to inactivity. Please log in again."}
```

**Business Logic Side Effects:** Updates session token metadata in Redis.

**Frontend Handling Notes:** Replace access token in memory/storage; keep refresh token.

**Loading State Considerations:** Short; queue requests during refresh.

**Form Validation Requirements:** Require non-empty refresh_token.

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - POST /api/v1/auth/logout

**Purpose:** Logout and invalidate current session/tokens.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles (permission `auth_logout`).

**Permission Scope:** Permission check via `require_permission(AUTH_LOGOUT)`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| refresh_token | string | No | null | - | optional refresh token |

```json
{
  "refresh_token": "<jwt>"
}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Logged out successfully"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Logout completed |
| 401 | Unauthorized | Invalid or missing access token |
| 403 | Forbidden | Missing permission |
| 422 | Validation Error | Invalid request body |

**Error Responses:**

```json
{"detail": "Invalid or expired token"}
```

**Business Logic Side Effects:** Revokes JTIs and deletes session metadata.

**Frontend Handling Notes:** Clear all auth state on success regardless of response body.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None (refresh_token optional).

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - POST /api/v1/auth/activity-ping

**Purpose:** Keep session active and return last activity timestamp.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles (permission `auth_activity_ping`).

**Permission Scope:** Permission check via `require_permission(AUTH_ACTIVITY_PING)`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| active | boolean | Yes | true if session active |
| last_activity | string | Yes | ISO timestamp |

```json
{"active": true, "last_activity": "2024-01-01T00:00:00Z"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Session active |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Missing permission |

**Error Responses:**

```json
{"detail": "Not authenticated"}
```

**Business Logic Side Effects:** Session TTL is refreshed by middleware for any request.

**Frontend Handling Notes:** Use only if client has long idle periods without API calls.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** No caching.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - POST /api/v1/auth/password-reset-request

**Purpose:** Request a password reset link/token.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| national_id | string | Yes | - | min_length=1, max_length=100 | trimmed |

```json
{"national_id": "A123456"}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | generic response |

```json
{"message": "If an account exists with that national ID, a reset link has been sent"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Always, even if account not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 422 | Validation Error | Invalid request body |

**Error Responses:**

```json
{"detail": "Rate limit exceeded"}
```

**Business Logic Side Effects:** Stores reset token in Redis; writes audit log.

**Frontend Handling Notes:** Always show success message to avoid account enumeration.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Require non-empty national_id.

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - POST /api/v1/auth/password-reset-confirm

**Purpose:** Confirm password reset using a token.

**Authentication Required:** No

**Allowed Roles:** Public

**Permission Scope:** None

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | No | - |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| token | string | Yes | - | min_length=1 | - |
| new_password | string | Yes | - | min_length=8 | - |

```json
{"token": "<reset-token>", "new_password": "newpass123"}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Password reset successful. Please log in with your new password."}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Password reset completed |
| 400 | Bad Request | Invalid or expired reset token |
| 422 | Validation Error | Invalid body or same password |
| 429 | Too Many Requests | Rate limit exceeded |

**Error Responses:**

```json
{"detail": "Reset token is invalid or has expired"}
```

```json
{"detail": "New password must be different from the current password"}
```

**Business Logic Side Effects:** Updates password hash, deletes reset token, invalidates sessions.

**Frontend Handling Notes:** After success, redirect to login.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Require token and password length >= 8.

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

---
#### AUTH - PATCH /api/v1/auth/password

**Purpose:** Change password for the current officer.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles (permission `auth_password_change`).

**Permission Scope:** Permission check via `require_permission(AUTH_PASSWORD_CHANGE)`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| current_password | string | Yes | - | min_length=1 | - |
| new_password | string | Yes | - | min_length=8 | - |

```json
{"current_password": "oldpass", "new_password": "newpass123"}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| access_token | string | Yes | new access token |
| refresh_token | string | Yes | new refresh token |
| token_type | string | Yes | bearer |
| expires_in | integer | Yes | access token TTL seconds |
| session_id | string | Yes | new session id |

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 900,
  "session_id": "uuid"
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Password changed |
| 401 | Unauthorized | Invalid token or incorrect password |
| 403 | Forbidden | Missing permission |
| 422 | Validation Error | Invalid body or same password |

**Error Responses:**

```json
{"detail": "Current password is incorrect"}
```

```json
{"detail": "New password must be different from the current password"}
```

**Business Logic Side Effects:** Revokes current tokens, removes sessions, starts new session.

**Frontend Handling Notes:** Replace tokens with the new response tokens.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Require both fields; password length >= 8.

**Recommended Caching Behavior:** Do not cache.

**Realtime Refresh Considerations:** None

**Upload Handling Requirements:** Not applicable.

## 4.3 Personnel

---
#### PERSONNEL - POST /api/v1/personnel/persons

**Purpose:** Create a new person record.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| first_name | string | Yes | - | min_length=1, max_length=100 | trimmed |
| last_name | string | Yes | - | min_length=1, max_length=100 | trimmed |
| national_id | string | Yes | - | min_length=1, max_length=100 | trimmed |
| gender | GenderEnum | No | null | enum | male, female, other, undisclosed |
| dob | date | No | null | must be past date | - |
| phone | string | No | null | E.164 format | e.g., +251911234567 |
| address | string | No | null | max_length=255 | - |

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "national_id": "A123456",
  "gender": "male",
  "dob": "1990-01-01",
  "phone": "+251911234567",
  "address": "Addis Ababa"
}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| person_id | integer | Yes | person id |
| first_name | string | Yes | first name |
| last_name | string | Yes | last name |
| national_id | string | Yes | national id |
| gender | GenderEnum | No | gender |
| dob | date | No | date of birth |
| phone | string | No | phone |
| address | string | No | address |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |

```json
{
  "person_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "national_id": "A123456",
  "gender": "male",
  "dob": "1990-01-01",
  "phone": "+251911234567",
  "address": "Addis Ababa",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Person created |
| 403 | Forbidden | Insufficient role |
| 409 | Conflict | National ID already exists |
| 422 | Validation Error | Invalid input |

**Error Responses:**

```json
{"detail": "A person with this national ID already exists"}
```

**Business Logic Side Effects:** Creates person row; may invalidate officer cache if linked in future.

**Frontend Handling Notes:** Show duplicate national_id conflict in form.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Enforce E.164 phone format and DOB past-date check.

**Recommended Caching Behavior:** Cache person lists with invalidation on create.

**Realtime Refresh Considerations:** Refresh person lists after success.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/persons

**Purpose:** List persons with optional search.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| search | string | No | null | name or national id search | max_length=200 |
| active_only | boolean | No | true | only active records | - |
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| items | array[PersonResponse] | Yes | persons list |
| total | integer | Yes | total count |
| page | integer | Yes | current page |
| size | integer | Yes | page size |
| items[].person_id | integer | Yes | person id |
| items[].first_name | string | Yes | first name |
| items[].last_name | string | Yes | last name |
| items[].national_id | string | Yes | national id |
| items[].gender | GenderEnum | No | gender |
| items[].dob | date | No | date of birth |
| items[].phone | string | No | phone |
| items[].address | string | No | address |
| items[].created_at | datetime | Yes | created timestamp |
| items[].updated_at | datetime | No | updated timestamp |
| items[].deleted_at | datetime | No | deleted timestamp |

```json
{
  "items": [
    {
      "person_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "national_id": "A123456",
      "gender": "male",
      "dob": "1990-01-01",
      "phone": "+251911234567",
      "address": "Addis Ababa",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null,
      "deleted_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role |
| 422 | Validation Error | Invalid query params |

**Error Responses:**

```json
{"detail": "You do not have sufficient privileges to perform this action"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination controls.

**Loading State Considerations:** Moderate for large lists.

**Form Validation Requirements:** Validate page/size and search length.

**Recommended Caching Behavior:** Cache per search/page; invalidate on create/update/delete.

**Realtime Refresh Considerations:** Refresh after person mutations.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/persons/{person_id}

**Purpose:** Get a single person record.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

Same as `PersonResponse` (see create person response).

```json
{
  "person_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "national_id": "A123456",
  "gender": "male",
  "dob": "1990-01-01",
  "phone": "+251911234567",
  "address": "Addis Ababa",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Person found |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person not found |

**Error Responses:**

```json
{"detail": "Person not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Handle 404 with a not-found state.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Cache by id; invalidate on update/delete.

**Realtime Refresh Considerations:** Refresh if updated elsewhere.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - PATCH /api/v1/personnel/persons/{person_id}

**Purpose:** Update mutable fields of a person.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| first_name | string | No | null | min_length=1, max_length=100 | trimmed |
| last_name | string | No | null | min_length=1, max_length=100 | trimmed |
| national_id | string | No | null | forbidden | cannot be modified |
| gender | GenderEnum | No | null | enum | - |
| dob | date | No | null | must be past date | - |
| phone | string | No | null | E.164 format | - |
| address | string | No | null | max_length=255 | - |

```json
{
  "first_name": "Jane",
  "phone": "+251911000000"
}
```

**Response Schema:**

Same as `PersonResponse`.

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Person updated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person not found |
| 422 | Validation Error | Invalid fields or national_id update attempt |

**Error Responses:**

```json
{"detail": "national_id cannot be modified after creation"}
```

**Business Logic Side Effects:** Writes person history entries; invalidates officer cache if linked.

**Frontend Handling Notes:** Prevent editing national_id in UI.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Enforce E.164 phone format and DOB past-date check.

**Recommended Caching Behavior:** Invalidate person caches on update.

**Realtime Refresh Considerations:** Refresh person details view.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - DELETE /api/v1/personnel/persons/{person_id}

**Purpose:** Soft delete a person.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Person deleted"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Person deleted |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person not found |

**Error Responses:**

```json
{"detail": "Person not found"}
```

**Business Logic Side Effects:** Soft deletes person; removes officer sessions if linked.

**Frontend Handling Notes:** Remove person from lists and clear related caches.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate person lists and details.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - POST /api/v1/personnel/officers

**Purpose:** Create a new officer linked to a person.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check via `is_admin_or_superadmin`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| person_id | integer | Yes | - | - | existing person id |
| department_id | integer | Yes | - | - | must exist |
| role_id | integer | Yes | - | - | must exist |
| password | string | Yes | - | min_length=8 | hashed server-side |
| rank | string | No | null | max_length=50 | - |
| badge_number | string | No | null | max_length=50 | unique |

```json
{
  "person_id": 1,
  "department_id": 2,
  "role_id": 3,
  "password": "password123",
  "rank": "Sergeant",
  "badge_number": "B-100"
}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| officer_id | integer | Yes | officer id |
| person_id | integer | Yes | person id |
| department_id | integer | No | department id |
| role_id | integer | Yes | role id |
| rank | string | No | rank |
| badge_number | string | No | badge number |
| is_active | boolean | Yes | active status |
| last_login_at | datetime | No | last login |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |
| person.person_id | integer | Yes | linked person id |
| person.first_name | string | Yes | person first name |
| person.last_name | string | Yes | person last name |
| person.national_id | string | Yes | national id |
| person.gender | GenderEnum | No | gender |
| person.dob | date | No | dob |
| person.phone | string | No | phone |
| person.address | string | No | address |
| person.created_at | datetime | Yes | created timestamp |
| person.updated_at | datetime | No | updated timestamp |
| person.deleted_at | datetime | No | deleted timestamp |
| role.role_id | integer | Yes | role id |
| role.role_name | string | Yes | role name |
| role.description | string | No | role description |
| department.department_id | integer | No | department id |
| department.name | string | No | department name |

```json
{
  "officer_id": 10,
  "person_id": 1,
  "department_id": 2,
  "role_id": 3,
  "rank": "Sergeant",
  "badge_number": "B-100",
  "is_active": true,
  "last_login_at": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "person": {
    "person_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "A123456",
    "gender": "male",
    "dob": "1990-01-01",
    "phone": "+251911234567",
    "address": "Addis Ababa",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null,
    "deleted_at": null
  },
  "role": {"role_id": 3, "role_name": "investigator", "description": null},
  "department": {"department_id": 2, "name": "CID"}
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Officer created |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person/role/department not found |
| 409 | Conflict | Officer or badge number already exists |
| 422 | Validation Error | Invalid input |

**Error Responses:**

```json
{"detail": "This person is already registered as an active officer"}
```

```json
{"detail": "Badge number already assigned to another officer"}
```

**Business Logic Side Effects:** Creates officer, writes officer history.

**Frontend Handling Notes:** Ensure person exists before creating officer.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Password length >= 8; enforce badge_number uniqueness on UI if possible.

**Recommended Caching Behavior:** Invalidate officer lists after create.

**Realtime Refresh Considerations:** Refresh personnel lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/officers

**Purpose:** List officers with filters.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| department_id | integer | No | null | filter by department | - |
| role_id | integer | No | null | filter by role | - |
| search | string | No | null | search by name or badge | max_length=200 |
| active_only | boolean | No | true | only active officers | - |
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of `OfficerResponse` (see create officer response fields).

```json
{
  "items": [
    {
      "officer_id": 10,
      "person_id": 1,
      "department_id": 2,
      "role_id": 3,
      "rank": "Sergeant",
      "badge_number": "B-100",
      "is_active": true,
      "last_login_at": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null,
      "deleted_at": null,
      "person": {
        "person_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "national_id": "A123456",
        "gender": "male",
        "dob": "1990-01-01",
        "phone": "+251911234567",
        "address": "Addis Ababa",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": null,
        "deleted_at": null
      },
      "role": {"role_id": 3, "role_name": "investigator", "description": null},
      "department": {"department_id": 2, "name": "CID"}
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role |
| 422 | Validation Error | Invalid query params |

**Error Responses:**

```json
{"detail": "You do not have sufficient privileges to perform this action"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination filters and caching.

**Loading State Considerations:** Moderate for large lists.

**Form Validation Requirements:** Validate page/size and search length.

**Recommended Caching Behavior:** Cache per filter/page; invalidate on mutations.

**Realtime Refresh Considerations:** Refresh after create/update/delete.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/officers/{officer_id}

**Purpose:** Get a single officer.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| officer_id | integer | officer id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

Same as `OfficerResponse`.

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Officer found |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Officer not found |

**Error Responses:**

```json
{"detail": "Officer not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Show not-found state on 404.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Cache by id; invalidate on update/delete.

**Realtime Refresh Considerations:** Refresh after updates.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - PATCH /api/v1/personnel/officers/{officer_id}

**Purpose:** Update officer role, department, badge, or rank.

**Authentication Required:** Yes

**Allowed Roles:** department_head, admin, superadmin (or any role with `manage_users`).

**Permission Scope:** Role/permission check via `has_manage_users_access`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| officer_id | integer | officer id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| rank | string | No | null | max_length=50 | - |
| badge_number | string | No | null | max_length=50 | unique |
| role_id | integer | No | null | must exist | cannot be null |
| department_id | integer | No | null | must exist | - |

```json
{
  "rank": "Lieutenant",
  "role_id": 4
}
```

**Response Schema:**

Same as `OfficerResponse`.

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Officer updated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Officer/role/department not found |
| 409 | Conflict | Badge number conflict |
| 422 | Validation Error | Invalid input |

**Error Responses:**

```json
{"detail": "Badge number already assigned to another officer"}
```

**Business Logic Side Effects:** Writes officer history; invalidates officer cache.

**Frontend Handling Notes:** Avoid role_id null; handle badge conflicts.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Enforce badge format and required fields.

**Recommended Caching Behavior:** Invalidate officer caches on update.

**Realtime Refresh Considerations:** Refresh officer detail views.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - DELETE /api/v1/personnel/officers/{officer_id}

**Purpose:** Soft delete an officer.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check via `is_admin_or_superadmin`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| officer_id | integer | officer id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Officer deleted"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Officer deleted |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Officer not found |

**Error Responses:**

```json
{"detail": "Officer not found"}
```

**Business Logic Side Effects:** Invalidates officer cache and removes sessions.

**Frontend Handling Notes:** Remove officer from lists.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate officer caches.

**Realtime Refresh Considerations:** Refresh officer lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/officers/{officer_id}/history

**Purpose:** Get officer field change history.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check in service.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| officer_id | integer | officer id | required |

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of OfficerHistoryEntryResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].history_id | integer | Yes | history id |
| items[].officer_id | integer | Yes | officer id |
| items[].changed_by | integer | Yes | changer officer id |
| items[].changed_by_name | string | Yes | changer name |
| items[].field_name | string | Yes | field name |
| items[].old_value | string | No | old value |
| items[].new_value | string | No | new value |
| items[].changed_at | datetime | Yes | timestamp |

```json
{
  "items": [
    {
      "history_id": 1,
      "officer_id": 10,
      "changed_by": 1,
      "changed_by_name": "Admin User",
      "field_name": "rank",
      "old_value": "Sergeant",
      "new_value": "Lieutenant",
      "changed_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | History returned |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Officer not found |

**Error Responses:**

```json
{"detail": "Officer not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Show empty history if none.

**Loading State Considerations:** Moderate for large histories.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per officer and page; invalidate on updates.

**Realtime Refresh Considerations:** Refresh after officer edits.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - POST /api/v1/personnel/persons/{person_id}/suspect

**Purpose:** Promote a person to suspect.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles.

**Permission Scope:** None (no role check in service).

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| risk_level | RiskLevelEnum | No | null | enum | low, medium, high, critical |
| criminal_record | string | No | null | - | - |

```json
{"risk_level": "medium", "criminal_record": "Prior theft"}
```

**Response Schema:**

SuspectResponse fields:
| Field | Type | Always Present | Description |
|---|---|---|---|
| suspect_id | integer | Yes | suspect id |
| person_id | integer | Yes | person id |
| risk_level | RiskLevelEnum | No | risk level |
| criminal_record | string | No | record notes |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |
| person.person_id | integer | Yes | person id |
| person.first_name | string | Yes | first name |
| person.last_name | string | Yes | last name |
| person.national_id | string | Yes | national id |
| person.gender | GenderEnum | No | gender |
| person.dob | date | No | dob |
| person.phone | string | No | phone |
| person.address | string | No | address |
| person.created_at | datetime | Yes | created timestamp |
| person.updated_at | datetime | No | updated timestamp |
| person.deleted_at | datetime | No | deleted timestamp |

```json
{
  "suspect_id": 5,
  "person_id": 1,
  "risk_level": "medium",
  "criminal_record": "Prior theft",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "person": {
    "person_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "A123456",
    "gender": "male",
    "dob": "1990-01-01",
    "phone": "+251911234567",
    "address": "Addis Ababa",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null,
    "deleted_at": null
  }
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Suspect created or reactivated |
| 404 | Not Found | Person not found |
| 409 | Conflict | Suspect already exists |

**Error Responses:**

```json
{"detail": "This person is already an active suspect"}
```

**Business Logic Side Effects:** Creates or reactivates suspect record.

**Frontend Handling Notes:** Allow reactivation flows to show updated record.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None beyond enum values.

**Recommended Caching Behavior:** Invalidate suspect lists.

**Realtime Refresh Considerations:** Refresh suspect lists and person detail.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - DELETE /api/v1/personnel/persons/{person_id}/suspect

**Purpose:** Deactivate suspect record for a person.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check in service.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Suspect record deactivated"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Suspect deactivated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Suspect not found |
| 409 | Conflict | Active charges exist |

**Error Responses:**

```json
{"detail": "Cannot deactivate a suspect with active charges"}
```

**Business Logic Side Effects:** Soft deletes suspect.

**Frontend Handling Notes:** Update suspect lists and person detail.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate suspect caches.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/suspects

**Purpose:** List suspects with filters.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles (include_deleted requires admin/superadmin).

**Permission Scope:** Role check when include_deleted=true.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| risk_level | RiskLevelEnum | No | null | filter by risk | enum |
| include_deleted | boolean | No | false | include deleted records | admin/superadmin only |
| involved_in_case_id | integer | No | null | filter by case id | - |
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of SuspectListItemResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].suspect_id | integer | Yes | suspect id |
| items[].person.person_id | integer | Yes | person id |
| items[].person.first_name | string | Yes | first name |
| items[].person.last_name | string | Yes | last name |
| items[].risk_level | RiskLevelEnum | No | risk level |
| items[].active_case_count | integer | Yes | active cases |
| items[].active_charge_count | integer | Yes | active charges |
| items[].deleted_at | datetime | No | deleted timestamp |

```json
{
  "items": [
    {
      "suspect_id": 5,
      "person": {"person_id": 1, "first_name": "John", "last_name": "Doe"},
      "risk_level": "medium",
      "active_case_count": 1,
      "active_charge_count": 0,
      "deleted_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | include_deleted without privilege |
| 422 | Validation Error | Invalid query params |

**Error Responses:**

```json
{"detail": "You do not have sufficient privileges to perform this action"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Show filters for risk level and case.

**Loading State Considerations:** Moderate.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per filter/page.

**Realtime Refresh Considerations:** Refresh on suspect mutations.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/suspects/{suspect_id}

**Purpose:** Get detailed suspect information.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, legal_officer, admin, superadmin.

**Permission Scope:** Role check via `is_investigator_or_above`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| suspect_id | integer | suspect id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

SuspectDetailResponse = SuspectResponse fields plus counts.

| Field | Type | Always Present | Description |
|---|---|---|---|
| arrest_count | integer | Yes | arrests count |
| charge_count | integer | Yes | charges count |
| case_count | integer | Yes | cases count |

```json
{
  "suspect_id": 5,
  "person_id": 1,
  "risk_level": "medium",
  "criminal_record": "Prior theft",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "person": {"person_id": 1, "first_name": "John", "last_name": "Doe", "national_id": "A123456", "gender": "male", "dob": "1990-01-01", "phone": "+251911234567", "address": "Addis Ababa", "created_at": "2024-01-01T00:00:00Z", "updated_at": null, "deleted_at": null},
  "arrest_count": 1,
  "charge_count": 0,
  "case_count": 1
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Suspect found |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Suspect not found |

**Error Responses:**

```json
{"detail": "Suspect record not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Show counts and person details.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Cache by id; invalidate on updates.

**Realtime Refresh Considerations:** Refresh if suspect changes.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/suspects/{suspect_id}/cases

**Purpose:** List cases linked to a suspect.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, legal_officer, admin, superadmin.

**Permission Scope:** Role check via `is_investigator_or_above`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| suspect_id | integer | suspect id | required |

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of CaseSummaryResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].case_id | integer | Yes | case id |
| items[].case_number | string | Yes | case number |
| items[].title | string | Yes | title |
| items[].status_name | string | Yes | case status |
| items[].crime_type_name | string | Yes | crime type |
| items[].opened_at | datetime | No | opened timestamp |
| items[].assigned_officers[] | array | Yes | officers assigned |
| items[].assigned_officers[].officer_id | integer | Yes | officer id |
| items[].assigned_officers[].badge_number | string | No | badge |
| items[].assigned_officers[].first_name | string | Yes | first name |
| items[].assigned_officers[].last_name | string | Yes | last name |
| items[].assigned_officers[].rank | string | No | rank |
| items[].assigned_officers[].role_in_case | RoleInCaseEnum | Yes | role in case |

```json
{
  "items": [
    {
      "case_id": 1,
      "case_number": "CASE-001",
      "title": "Burglary",
      "status_name": "open",
      "crime_type_name": "Burglary",
      "opened_at": "2024-01-01T00:00:00Z",
      "assigned_officers": [
        {"officer_id": 10, "badge_number": "B-100", "first_name": "John", "last_name": "Doe", "rank": "Sergeant", "role_in_case": "lead_investigator"}
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Suspect not found |

**Error Responses:**

```json
{"detail": "Suspect record not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination; link to case detail pages.

**Loading State Considerations:** Moderate.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per suspect/page; invalidate on case updates.

**Realtime Refresh Considerations:** Refresh on case updates.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/suspects/{suspect_id}/arrests

**Purpose:** List arrests for a suspect.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, legal_officer, admin, superadmin.

**Permission Scope:** Role check via `is_investigator_or_above`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| suspect_id | integer | suspect id | required |

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of ArrestSummaryResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].arrest_id | integer | Yes | arrest id |
| items[].booking_number | string | No | booking number |
| items[].date | datetime | Yes | arrest date |
| items[].released_at | datetime | No | release date |
| items[].bail_amount | string | No | bail amount as string |
| items[].case_id | integer | No | case id |
| items[].case_title | string | No | case title |
| items[].arresting_officer.officer_id | integer | Yes | officer id |
| items[].arresting_officer.badge_number | string | No | badge |
| items[].arresting_officer.first_name | string | Yes | first name |
| items[].arresting_officer.last_name | string | Yes | last name |
| items[].arresting_officer.rank | string | No | rank |

```json
{
  "items": [
    {
      "arrest_id": 2,
      "booking_number": "BK-1",
      "date": "2024-01-01T00:00:00Z",
      "released_at": null,
      "bail_amount": "0.00",
      "case_id": 1,
      "case_title": "Burglary",
      "arresting_officer": {"officer_id": 10, "badge_number": "B-100", "first_name": "John", "last_name": "Doe", "rank": "Sergeant"}
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Suspect not found |

**Error Responses:**

```json
{"detail": "Suspect record not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination.

**Loading State Considerations:** Moderate.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per suspect/page.

**Realtime Refresh Considerations:** Refresh after arrest updates.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - GET /api/v1/personnel/suspects/{suspect_id}/charges

**Purpose:** List charges for a suspect.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, legal_officer, admin, superadmin.

**Permission Scope:** Role check via `is_investigator_or_above`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| suspect_id | integer | suspect id | required |

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of ChargeSummaryResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].charge_id | integer | Yes | charge id |
| items[].crime_type_name | string | Yes | crime type |
| items[].charge_status | ChargeStatusEnum | Yes | status |
| items[].description | string | No | description |
| items[].verdict | VerdictEnum | No | verdict |
| items[].filed_at | datetime | No | filed date |
| items[].case_id | integer | Yes | case id |
| items[].case_number | string | Yes | case number |
| items[].court_case_id | integer | No | court case id |

```json
{
  "items": [
    {
      "charge_id": 10,
      "crime_type_name": "Burglary",
      "charge_status": "filed",
      "description": "Break-in",
      "verdict": null,
      "filed_at": "2024-01-01T00:00:00Z",
      "case_id": 1,
      "case_number": "CASE-001",
      "court_case_id": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Suspect not found |

**Error Responses:**

```json
{"detail": "Suspect record not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination.

**Loading State Considerations:** Moderate.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per suspect/page.

**Realtime Refresh Considerations:** Refresh on charge changes.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - POST /api/v1/personnel/persons/{person_id}/victim

**Purpose:** Promote a person to victim.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, admin, superadmin.

**Permission Scope:** Role check via `can_promote_victim_or_witness`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| notes | string | No | null | - | - |

```json
{"notes": "Victim of case"}
```

**Response Schema:**

VictimResponse fields:
| Field | Type | Always Present | Description |
|---|---|---|---|
| victim_id | integer | Yes | victim id |
| person_id | integer | Yes | person id |
| notes | string | No | notes |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |
| person.* | object | Yes | person fields |

```json
{
  "victim_id": 3,
  "person_id": 1,
  "notes": "Victim of case",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "person": {
    "person_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "A123456",
    "gender": "male",
    "dob": "1990-01-01",
    "phone": "+251911234567",
    "address": "Addis Ababa",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null,
    "deleted_at": null
  }
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Victim created or reactivated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person not found |
| 409 | Conflict | Victim already exists |

**Error Responses:**

```json
{"detail": "This person is already an active victim record"}
```

**Business Logic Side Effects:** Creates or reactivates victim record.

**Frontend Handling Notes:** Show updated person profile.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate victim lists.

**Realtime Refresh Considerations:** Refresh related lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - DELETE /api/v1/personnel/persons/{person_id}/victim

**Purpose:** Deactivate victim record.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check in service.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Victim record deactivated"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Victim deactivated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Victim not found |

**Error Responses:**

```json
{"detail": "Victim record not found"}
```

**Business Logic Side Effects:** Soft deletes victim.

**Frontend Handling Notes:** Update victim lists.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate victim caches.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - POST /api/v1/personnel/persons/{person_id}/witness

**Purpose:** Promote a person to witness.

**Authentication Required:** Yes

**Allowed Roles:** investigator, department_head, admin, superadmin.

**Permission Scope:** Role check via `can_promote_victim_or_witness`.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| credibility_notes | string | No | null | - | - |
| is_protected | boolean | No | false | - | - |

```json
{"credibility_notes": "Reliable", "is_protected": false}
```

**Response Schema:**

WitnessResponse fields:
| Field | Type | Always Present | Description |
|---|---|---|---|
| witness_id | integer | Yes | witness id |
| person_id | integer | Yes | person id |
| credibility_notes | string | No | notes |
| is_protected | boolean | Yes | protection flag |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |
| person.* | object | Yes | person fields |

```json
{
  "witness_id": 7,
  "person_id": 1,
  "credibility_notes": "Reliable",
  "is_protected": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "person": {
    "person_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "national_id": "A123456",
    "gender": "male",
    "dob": "1990-01-01",
    "phone": "+251911234567",
    "address": "Addis Ababa",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null,
    "deleted_at": null
  }
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Witness created or reactivated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Person not found |
| 409 | Conflict | Witness already exists |

**Error Responses:**

```json
{"detail": "This person is already an active witness record"}
```

**Business Logic Side Effects:** Creates or reactivates witness.

**Frontend Handling Notes:** Update person detail view.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate witness caches.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

---
#### PERSONNEL - DELETE /api/v1/personnel/persons/{person_id}/witness

**Purpose:** Deactivate witness record.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Role check in service.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| person_id | integer | person id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Witness record deactivated"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Witness deactivated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Witness not found |

**Error Responses:**

```json
{"detail": "Witness record not found"}
```

**Business Logic Side Effects:** Soft deletes witness.

**Frontend Handling Notes:** Update witness lists.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate witness caches.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

## 4.4 Departments

---
#### DEPARTMENTS - POST /api/v1/departments

**Purpose:** Create a department.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Admin/superadmin only.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

None

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| name | string | Yes | - | min_length=1, max_length=100 | trimmed |
| location_id | integer | No | null | - | - |

```json
{"name": "CID", "location_id": 1}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| department_id | integer | Yes | department id |
| name | string | Yes | name |
| location_id | integer | No | location id |
| department_head_officer_id | integer | No | head officer id |
| officer_count | integer | Yes | active officer count |
| created_at | datetime | Yes | created timestamp |
| updated_at | datetime | No | updated timestamp |
| deleted_at | datetime | No | deleted timestamp |
| department_head.officer_id | integer | No | head officer id |
| department_head.first_name | string | No | head first name |
| department_head.last_name | string | No | head last name |
| department_head.rank | string | No | head rank |
| department_head.badge_number | string | No | head badge |

```json
{
  "department_id": 2,
  "name": "CID",
  "location_id": 1,
  "department_head_officer_id": null,
  "officer_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null,
  "deleted_at": null,
  "department_head": null
}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 201 | Created | Department created |
| 403 | Forbidden | Insufficient role |
| 409 | Conflict | Name already exists |
| 422 | Validation Error | Invalid body |

**Error Responses:**

```json
{"detail": "A department with this name already exists"}
```

**Business Logic Side Effects:** Creates department row.

**Frontend Handling Notes:** Handle duplicate name conflict.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Require non-empty name.

**Recommended Caching Behavior:** Invalidate department lists.

**Realtime Refresh Considerations:** Refresh department list views.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - GET /api/v1/departments

**Purpose:** List departments.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles.

**Permission Scope:** None beyond authentication.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

None

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of DepartmentListItemResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].department_id | integer | Yes | department id |
| items[].name | string | Yes | name |
| items[].location_id | integer | No | location id |
| items[].department_head_officer_id | integer | No | head officer id |
| items[].officer_count | integer | Yes | active officer count |
| items[].created_at | datetime | Yes | created timestamp |
| items[].updated_at | datetime | No | updated timestamp |
| items[].department_head.* | object | No | head summary |

```json
{
  "items": [
    {
      "department_id": 2,
      "name": "CID",
      "location_id": 1,
      "department_head_officer_id": null,
      "officer_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null,
      "department_head": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 422 | Validation Error | Invalid query params |

**Error Responses:**

```json
{"detail": "Validation error"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use pagination.

**Loading State Considerations:** Moderate for large lists.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per page.

**Realtime Refresh Considerations:** Refresh after department mutations.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - GET /api/v1/departments/{department_id}

**Purpose:** Get a department by id.

**Authentication Required:** Yes

**Allowed Roles:** All authenticated roles.

**Permission Scope:** None beyond authentication.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

Same as DepartmentResponse (see create department response).

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Department found |
| 404 | Not Found | Department not found |

**Error Responses:**

```json
{"detail": "Department not found"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Show not-found state on 404.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Cache by id.

**Realtime Refresh Considerations:** Refresh after updates.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - PATCH /api/v1/departments/{department_id}

**Purpose:** Update a department.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Admin/superadmin only.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| name | string | No | null | min_length=1, max_length=100 | unique |
| location_id | integer | No | null | - | - |

```json
{"name": "CID West"}
```

**Response Schema:**

Same as DepartmentResponse.

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Department updated |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Department not found |
| 409 | Conflict | Name already exists |
| 422 | Validation Error | Invalid body |

**Error Responses:**

```json
{"detail": "A department with this name already exists"}
```

**Business Logic Side Effects:** Updates department record.

**Frontend Handling Notes:** Handle duplicate name conflicts.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Require name length if provided.

**Recommended Caching Behavior:** Invalidate department caches.

**Realtime Refresh Considerations:** Refresh department views.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - DELETE /api/v1/departments/{department_id}

**Purpose:** Soft delete a department.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Admin/superadmin only.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

None

**Request Body Schema:**

No request body.

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |

```json
{"message": "Department deleted"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Department deleted |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Department not found |
| 409 | Conflict | Department has active officers |

**Error Responses:**

```json
{"detail": "Cannot delete a department with active officers"}
```

**Business Logic Side Effects:** Soft deletes department.

**Frontend Handling Notes:** Prevent delete if officer_count > 0.

**Loading State Considerations:** Short.

**Form Validation Requirements:** None

**Recommended Caching Behavior:** Invalidate department caches.

**Realtime Refresh Considerations:** Refresh lists.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - POST /api/v1/departments/{department_id}/assign-head

**Purpose:** Assign a department head.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin.

**Permission Scope:** Admin/superadmin only.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| officer_id | integer | Yes | - | - | must belong to department |

```json
{"officer_id": 10}
```

**Response Schema:**

Same as DepartmentResponse.

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Head assigned |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Department not found |
| 422 | Validation Error | Officer not in department |

**Error Responses:**

```json
{"detail": "Officer does not belong to this department"}
```

**Business Logic Side Effects:** Updates department head; writes audit log.

**Frontend Handling Notes:** Require department officer selection.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Ensure officer belongs to department.

**Recommended Caching Behavior:** Invalidate department caches.

**Realtime Refresh Considerations:** Refresh department detail.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - DELETE /api/v1/departments/{department_id}/head

**Purpose:** Remove department head and optionally demote role.

**Authentication Required:** Yes

**Allowed Roles:** superadmin.

**Permission Scope:** Superadmin only.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

None

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| demote_to_role_id | integer | No | null | - | defaults to investigator role |

```json
{"demote_to_role_id": 4}
```

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| message | string | Yes | status message |
| demoted_to_role | string | Yes | role name |

```json
{"message": "Department head removed", "demoted_to_role": "investigator"}
```

**Pagination:** No

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | Head removed |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Department or head not found |
| 422 | Validation Error | Invalid demotion role |

**Error Responses:**

```json
{"detail": "This department currently has no assigned department head"}
```

**Business Logic Side Effects:** Updates department and officer role; writes audit logs.

**Frontend Handling Notes:** Provide optional demotion role selector.

**Loading State Considerations:** Short.

**Form Validation Requirements:** Validate role id if provided.

**Recommended Caching Behavior:** Invalidate department and officer caches.

**Realtime Refresh Considerations:** Refresh department detail and officer data.

**Upload Handling Requirements:** Not applicable.

---
#### DEPARTMENTS - GET /api/v1/departments/{department_id}/officers

**Purpose:** List officers in a department.

**Authentication Required:** Yes

**Allowed Roles:** admin, superadmin, or department_head of that department.

**Permission Scope:** Department scope enforced in service.

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | No | - |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| department_id | integer | department id | required |

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| role_id | integer | No | null | filter by role id | - |
| active_only | boolean | No | true | active only | - |
| page | integer | No | 1 | page number | ge=1 |
| size | integer | No | 20 | page size | ge=1, le=100 |

**Request Body Schema:**

No request body.

**Response Schema:**

Paginated list of DepartmentOfficerResponse.

| Field | Type | Always Present | Description |
|---|---|---|---|
| items[].officer_id | integer | Yes | officer id |
| items[].badge_number | string | No | badge |
| items[].rank | string | No | rank |
| items[].role_name | string | Yes | role name |
| items[].is_active | boolean | Yes | active flag |
| items[].person.person_id | integer | Yes | person id |
| items[].person.first_name | string | Yes | first name |
| items[].person.last_name | string | Yes | last name |

```json
{
  "items": [
    {
      "officer_id": 10,
      "badge_number": "B-100",
      "rank": "Sergeant",
      "role_name": "investigator",
      "is_active": true,
      "person": {"person_id": 1, "first_name": "John", "last_name": "Doe"}
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

**Pagination:** Yes (page, size)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | List returned |
| 403 | Forbidden | Insufficient role or wrong department |
| 404 | Not Found | Department not found |
| 422 | Validation Error | Invalid query params |

**Error Responses:**

```json
{"detail": "Insufficient privileges"}
```

**Business Logic Side Effects:** None

**Frontend Handling Notes:** Use department scope to hide unauthorized access.

**Loading State Considerations:** Moderate.

**Form Validation Requirements:** Validate page/size.

**Recommended Caching Behavior:** Cache per department/page.

**Realtime Refresh Considerations:** Refresh on officer changes.

**Upload Handling Requirements:** Not applicable.

# 5. Frontend Module Organization

| Module | API Prefix | Endpoints |
|---|---|---|
| auth | /api/v1/auth | POST /login, POST /refresh, POST /logout, POST /activity-ping, POST /password-reset-request, POST /password-reset-confirm, PATCH /password |
| personnel | /api/v1/personnel | persons, officers, suspects, victims, witnesses |
| departments | /api/v1/departments | CRUD + head assignment + officers |
| cases | /api/v1/cases | case CRUD, assignments, persons, charges, arrests, notes, reports, permissions |
| arrests | /api/v1/arrests | standalone arrest CRUD + case arrests list |
| interrogation | /api/v1/cases/{case_id}/interrogations | create + list interrogations |
| evidence | /api/v1/cases/{case_id}/evidence, /api/v1/evidence | evidence lifecycle, custody, forensic, photos |
| legal | /api/v1/cases/{case_id}/court-case, /api/v1/court-cases, /api/v1/charges | court case, charge status, sentencing |
| reports | /api/v1/reports | analytics dashboards and counts |

Auth module covers login, refresh, logout, and password management. State includes tokens, session_id, and permissions.

Personnel module covers persons, officers, and civilian roles (suspect, victim, witness). State includes lists, filters, and detail records, with role restrictions for management operations.

Departments module handles department CRUD and head assignment. State includes department lists and officer counts; role restriction: admin/superadmin (head removal is superadmin only).

Cases module covers all case CRUD and related entities. State includes case lists, case detail, assignments, linked persons, notes, and permissions. Access is case-level and role-based.

Arrests module provides standalone arrest management and a paginated case arrest list. Access is restricted to investigator+ roles and case access where applicable.

Interrogation module handles case interrogations and requires case write/read access.

Evidence module handles evidence lifecycle, custody chain, forensic reports, vehicle/weapon details, and case photos. Access is case-level; some actions restricted to admin/superadmin or forensic roles.

Legal module handles court case lifecycle, charge status changes, and sentences. Access is restricted to legal_officer/admin/superadmin with case access for some reads.

Reports module provides analytics; access restricted by role and department scope.

# 6. Form Requirements

**POST /api/v1/auth/login**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| national_id | text | Yes | min 1, max 100 | - | trimmed |
| password | password | Yes | min 8 | - | - |

**POST /api/v1/auth/refresh**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| refresh_token | text | Yes | min 1 | - | - |

**POST /api/v1/auth/logout**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| refresh_token | text | No | - | - | optional |

**POST /api/v1/auth/password-reset-request**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| national_id | text | Yes | min 1, max 100 | - | trimmed |

**POST /api/v1/auth/password-reset-confirm**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| token | text | Yes | min 1 | - | - |
| new_password | password | Yes | min 8 | - | - |

**PATCH /api/v1/auth/password**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| current_password | password | Yes | min 1 | - | - |
| new_password | password | Yes | min 8 | - | - |

**POST /api/v1/personnel/persons**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| first_name | text | Yes | min 1, max 100 | - | trimmed |
| last_name | text | Yes | min 1, max 100 | - | trimmed |
| national_id | text | Yes | min 1, max 100 | - | immutable after creation |
| gender | select | No | - | male, female, other, undisclosed | - |
| dob | date | No | must be past date | - | - |
| phone | text | No | E.164 | - | +251911234567 |
| address | text | No | max 255 | - | - |

**PATCH /api/v1/personnel/persons/{person_id}**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| first_name | text | No | min 1, max 100 | - | - |
| last_name | text | No | min 1, max 100 | - | - |
| gender | select | No | - | male, female, other, undisclosed | - |
| dob | date | No | past date | - | - |
| phone | text | No | E.164 | - | - |
| address | text | No | max 255 | - | - |

**POST /api/v1/personnel/officers**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| person_id | number | Yes | - | - | existing person |
| department_id | number | Yes | - | - | existing department |
| role_id | number | Yes | - | - | existing role |
| password | password | Yes | min 8 | - | - |
| rank | text | No | max 50 | - | - |
| badge_number | text | No | max 50 | - | unique |

**PATCH /api/v1/personnel/officers/{officer_id}**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| rank | text | No | max 50 | - | - |
| badge_number | text | No | max 50 | - | unique |
| role_id | number | No | not null | - | - |
| department_id | number | No | - | - | - |

**POST /api/v1/personnel/persons/{person_id}/suspect**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| risk_level | select | No | - | low, medium, high, critical | - |
| criminal_record | textarea | No | - | - | - |

**POST /api/v1/personnel/persons/{person_id}/victim**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| notes | textarea | No | - | - | - |

**POST /api/v1/personnel/persons/{person_id}/witness**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| credibility_notes | textarea | No | - | - | - |
| is_protected | checkbox | No | - | - | default false |

**POST /api/v1/departments**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| name | text | Yes | min 1, max 100 | - | unique |
| location_id | number | No | - | - | - |

**PATCH /api/v1/departments/{department_id}**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| name | text | No | min 1, max 100 | - | unique |
| location_id | number | No | - | - | - |

**POST /api/v1/departments/{department_id}/assign-head**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| officer_id | number | Yes | officer in department | - | - |

**DELETE /api/v1/departments/{department_id}/head**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| demote_to_role_id | number | No | existing role | - | defaults to investigator |

# 7. State Management Requirements

## 7.1 Authentication State
- Store access_token, refresh_token, expires_in, session_id, and permissions (from token context).
- Store access_token in memory; refresh_token in durable storage if required by UX.
- Clear all tokens and user state on logout or session expiration.

## 7.2 Session State
- Track last activity for idle timeout; reset on any API call or user interaction.

## 7.3 Role and Permission State
- Role and permissions are returned in `CurrentOfficerContext` via auth dependencies.
- Cache permissions for the session; refresh on login or role changes.

## 7.4 Case Permission State
- Case access is case-level (permissions, assignments, lead officer, department scope).
- Fetch case permissions via `/cases/{case_id}/permissions` when needed for admin actions.

## 7.5 Pagination State
- Maintain page and size per list view; use query params for shareable URLs.

## 7.6 Caching Recommendations
- Cache list endpoints with pagination; invalidate on mutations.
- Do not cache auth endpoints or write operations.

## 7.7 Optimistic Update Safety
- Avoid optimistic updates for case status transitions, permissions, and legal actions.
- Safe candidates: simple list toggles after success (e.g., delete person after success).

# 8. Error Handling Matrix

| Error Source | HTTP Status | Error Code / Key | Error Message Pattern | Frontend UX Action | Retryable |
|---|---|---|---|---|---|
| Invalid credentials | 401 | - | Invalid credentials | Show login error | No |
| Invalid/expired token | 401 | - | Invalid or expired token | Refresh once, then logout | Yes (once) |
| Session expired | 401 | - | Session expired due to inactivity | Logout and redirect | No |
| Insufficient role | 403 | - | Access denied / Insufficient privileges | Show forbidden state | No |
| Not found | 404 | - | Resource not found | Show not found | No |
| Conflict | 409 | - | Resource conflict | Show conflict message | No |
| Validation error | 422 | - | Validation failed | Show field-level errors | No |
| Token leakage | 400 | - | Token leakage detected | Clear tokens, report error | No |
| Request too large | 413 | - | Request too large | Show file/body size error | No |
| Rate limit | 429 | - | Rate limit exceeded | Backoff and retry | Yes |
| Service unavailable | 503 | - | Service temporarily unavailable | Show maintenance banner | Yes |

## 8.1 Validation Error Rendering (HTTP 422)
- Body shape: `{"detail": [{"loc": ["body", "field"], "msg": "..."}]}`.
- Map `loc` to form fields; display `msg` inline.

## 8.2 Authentication Failure Flow
- 401 -> if refresh token exists, attempt refresh.
- If refresh fails -> clear auth state and redirect to login.

## 8.3 Network Error Handling
- Handle timeouts and offline states with retry options for GET endpoints.

## 8.4 Concurrent Request Error Handling
- Use single-flight refresh; queue requests until refresh completes.

# 9. Role and Permission Matrix

## 9.1 Role Definitions

| Role | Description | Privilege Level |
|---|---|---|
| readonly | Not defined in code | Low |
| forensic | Not defined in code | Medium |
| legal_officer | Not defined in code | Medium |
| investigator | Not defined in code | Medium |
| department_head | Not defined in code | High |
| admin | Not defined in code | High |
| superadmin | Not defined in code | Highest |

## 9.2 Endpoint Access Matrix

| Module / Endpoint Group | readonly | forensic | legal_officer | investigator | department_head | admin | superadmin |
|---|---|---|---|---|---|---|---|
| auth (login/refresh/logout/pwd) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| personnel (manage persons/officers) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| departments (manage) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| cases (basic read) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| cases (write/admin) | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| arrests/interrogations | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| evidence (read/write) | ✓ (read if case access) | ✓ | ✓ (read if case access) | ✓ | ✓ | ✓ | ✓ |
| legal (court/charges/sentences) | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| reports | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |

## 9.3 Module Visibility by Role

| Module | Visible To |
|---|---|
| auth | All |
| personnel | department_head, admin, superadmin |
| departments | admin, superadmin (list visible to all) |
| cases | All authenticated roles (filtered by access rules) |
| arrests/interrogations | investigator, department_head, admin, superadmin |
| evidence | all roles with case access (forensic has special update/report privileges) |
| legal | legal_officer, admin, superadmin (some reads for case access) |
| reports | department_head, admin, superadmin |

## 9.4 Case-Level Permission Implications
- Case access uses `case_permission` (read/write/admin), assignments, lead officer, and department head scope.
- Frontend should only show admin actions (assignments, permissions) when `case_permission` access_level is admin or role is admin/superadmin.

## 9.5 Department Scope Restrictions
- Department heads can list officers only in their department.
- Reporting endpoints enforce department scope and officer scope based on role.

## 9.6 Admin-Only Operations
- Create/update/delete departments.
- Assign department head.
- Delete officers.
- Deactivate suspects/victims/witnesses.
- Delete arrests.
- Delete evidence (admin/superadmin).

## 9.7 Superadmin-Only Operations
- Remove department head.
- Delete cases.
- Some case status transitions (reopen closed case).

# 10. Frontend Security Requirements

## 10.1 Token Storage
- Access token must be sent in Authorization header.
- Refresh token is required for refresh/logout; store securely on client.

## 10.2 Token Handling
- Never send tokens in query parameters or JSON bodies except refresh/logout.
- Never log tokens.

## 10.3 Refresh Token Handling
- Single-flight refresh; on failure, clear auth state and redirect.

## 10.4 Inactivity Handling
- Implement client idle timer (3600s) and log out when expired.

## 10.5 Logout Behavior
- Call logout endpoint, then clear all auth state.

## 10.6 Secure Storage Recommendations
- Prefer memory or secure storage; avoid localStorage if possible.

## 10.7 CSRF Considerations
- Cookie-based auth is not used; CSRF tokens are not required.

## 10.8 Session Expiration Handling
- On 401 with session expired, clear tokens and redirect.

## 10.9 Forbidden Route Handling
- Block rendering of unauthorized views until role checks complete.

## 10.10 Content Security
- Do not expose tokens in URLs.
- Validate file URLs (images) before display.
