# Instruction.md

---

## AGENT TASK: Generate Frontend_Guide.md from FastAPI Backend Repository

---

## PRIMARY OBJECTIVE

You are a VS Code coding agent operating inside a FastAPI backend repository.

Your sole task is to scan the entire backend codebase, analyze every file relevant to API behavior, and produce a single output file named `Frontend_Guide.md`.

This document will serve as the definitive API integration and frontend behavior specification for frontend developers. It is not UI design. It is not styling. It is a structured, implementation-derived specification document.

You must derive every piece of information from the actual code. You must never hallucinate endpoints, schemas, fields, or behaviors. If implementation conflicts with comments or docstrings, the implementation is authoritative.

---

## STEP 1: CODEBASE TRAVERSAL

Before writing a single line of `Frontend_Guide.md`, perform a full recursive traversal of the repository.

Execute the following analysis passes in order:

### 1.1 Identify the FastAPI Application Entrypoints

- Locate every file that instantiates a `FastAPI()` app object.
- Locate every `main.py`, `app.py`, `application.py`, or equivalent entrypoint.
- Identify all `include_router()` calls and trace every router being mounted.
- Record every route prefix, tag, and default response model applied at the router mount level.
- Identify all middleware registered via `app.add_middleware()` or `@app.middleware()`.
- Identify all exception handlers registered via `@app.exception_handler()`.
- Identify all startup and shutdown event hooks.

### 1.2 Recursively Locate All Router Files

- Recursively search the entire repository for every file containing `APIRouter()`.
- For each router file found, record:
  - The file path
  - The router prefix
  - The router tags
  - Every route declared on it
- Trace all nested router inclusions (routers included inside other routers).
- Build a complete flat list of every registered endpoint in the application.

### 1.3 Inspect Every Endpoint Declaration

For every route decorator found (`@router.get`, `@router.post`, `@router.put`, `@router.patch`, `@router.delete`, `@router.options`, `@router.head`, `@router.websocket`, etc.), extract:

- HTTP method
- Path string (including path parameters)
- Full resolved path (prefix + path)
- `response_model` if declared
- `status_code` if declared
- `tags` if declared
- `summary` and `description` if declared
- `dependencies` list passed at the decorator level
- `include_in_schema` flag if set
- `response_model_exclude_unset`, `response_model_exclude_none` if set

### 1.4 Inspect Every Request Schema

For every endpoint, identify all input sources:

- **Path parameters**: every `Path(...)` declaration and every path variable in the route string
- **Query parameters**: every `Query(...)` declaration and every function parameter not annotated as Body/Form/File
- **Request body**: every `Body(...)`, every Pydantic model used as a body parameter
- **Form data**: every `Form(...)` declaration
- **File uploads**: every `File(...)`, `UploadFile` usage
- **Headers**: every `Header(...)` declaration

For every Pydantic model used as a request schema, inspect the model class directly:

- Every field name
- Every field type
- Every field default value
- Every `Field(...)` declaration (alias, min_length, max_length, regex, ge, le, gt, lt, description)
- Every `@validator` and `@field_validator` decorator and the logic inside it
- Every `@root_validator` or `@model_validator` decorator and the logic inside it
- Every `class Config` or `model_config` setting (e.g., `use_enum_values`, `populate_by_name`)
- Every inherited base model and its fields

### 1.5 Inspect Every Response Schema

For every `response_model` declared on an endpoint, or any Pydantic model returned by an endpoint:

- Every field name
- Every field type
- Whether fields are optional or required
- Any `Field(...)` metadata
- Nested models and their fields (recursively)
- Any `@computed_field` or `@property` used in serialization

Also inspect:

- Every custom response wrapper (e.g., a generic `ResponseEnvelope`, `PaginatedResponse`, `APIResponse` model)
- Every `JSONResponse`, `Response`, or `StreamingResponse` returned directly (note these bypass `response_model`)

### 1.6 Inspect Every Dependency

For every `Depends()` call found in endpoint signatures or decorator-level dependencies:

- Identify the dependency function or class
- Trace what it does (authentication check, permission check, database session injection, current user extraction, etc.)
- If it raises exceptions, note which exceptions and under what conditions
- If it returns a value, note the type and how it is used by the endpoint
- Trace nested dependencies (dependencies that themselves use `Depends()`)

Pay special attention to:

- Any dependency that extracts a user from a token (e.g., `get_current_user`, `get_current_active_user`)
- Any dependency that checks roles or permissions
- Any dependency that validates session state
- Any dependency that reads from Redis or a session store
- Any dependency that enforces rate limits

### 1.7 Inspect Every Authentication Flow

Locate all authentication-related code:

- Token generation logic (JWT creation, claims included, expiry values)
- Token validation logic (signature verification, expiry check, claims extraction)
- Refresh token logic (storage, rotation, expiry)
- Session management logic (Redis keys, session TTL, session invalidation)
- Activity ping endpoints (endpoints that reset session TTL)
- Logout logic (token blacklisting, session deletion, cookie clearing)
- OAuth2 scheme declarations (`OAuth2PasswordBearer`, `OAuth2PasswordRequestForm`)
- Cookie-based auth if present
- Any `SecurityScopes` usage

Record:

- Access token TTL
- Refresh token TTL
- Session TTL
- Idle timeout values
- Token storage mechanism (cookie vs Authorization header vs both)
- Any token rotation policy

### 1.8 Inspect Every Permission and Role Check

For every endpoint or dependency that checks roles or permissions:

- What roles are allowed (extract the actual role values from enums or constants)
- What permission scopes are checked
- Whether checks are AND or OR logic
- Whether checks are case-level (per-resource) or global
- Whether checks are department-scoped
- Whether superadmin bypasses checks

Locate all role enums, permission enums, and role hierarchy definitions.

### 1.9 Inspect Every Exception and Error Response

Locate all custom exception classes defined in the codebase.

For each exception:

- Class name
- HTTP status code it maps to
- Error message or message template
- Error code or error key if present
- Where it is raised (which endpoints or dependencies)

Locate all exception handlers. For each handler:

- What exception type it catches
- What response it returns (status code, body structure)

Build a complete map of: exception → HTTP status code → response body structure.

### 1.10 Inspect Every Enum

Locate all Python `Enum` classes used anywhere in schemas, models, or business logic.

For each enum:

- Enum name
- All member names and values
- Where it is used (which endpoints, which fields)

### 1.11 Inspect Pagination Utilities

Locate all pagination-related code:

- Pagination query parameter schemas (page, page_size, limit, offset, cursor, etc.)
- Pagination response wrapper models (total, items, page, pages, next, previous, etc.)
- Any sorting or ordering parameters
- Any filtering parameter patterns

### 1.12 Inspect Middleware

For every middleware registered:

- What it does
- What headers it reads or writes
- Whether it modifies requests or responses
- Whether it handles CORS (record allowed origins, methods, headers)
- Whether it handles authentication (record what it does with tokens)
- Whether it logs requests
- Whether it enforces rate limits

### 1.13 Inspect WebSocket Endpoints

For every `@router.websocket()` or `@app.websocket()` found:

- Full path
- Authentication mechanism used
- Message format sent and received
- Connection lifecycle events
- Error handling behavior

### 1.14 Inspect File Upload Endpoints

For every endpoint using `UploadFile` or `File(...)`:

- Allowed file types (check validators)
- Maximum file size (check validators or middleware)
- Whether multipart/form-data is used
- What other form fields accompany the file
- What happens to the file after upload (storage path, processing)

### 1.15 Inspect Background Tasks

For every `BackgroundTasks` usage:

- What task is triggered
- What endpoint triggers it
- Whether the frontend needs to poll for results

---

## STEP 2: ORGANIZE FINDINGS INTO FRONTEND MODULES

After completing all analysis passes, organize every endpoint into logical frontend modules based on their router prefixes, tags, and business domain.

Expected modules include (but are not limited to, derive from actual code):

- `auth` — login, logout, refresh, session, ping
- `personnel` — user management, profiles
- `departments` — department CRUD and assignments
- `cases` — case management
- `evidence` — evidence records and file attachments
- `investigation` — investigation workflows
- `legal` — legal proceedings and documents
- `reports` — report generation and retrieval
- `reference_data` — lookup tables, enumerations, static data
- `admin` — administrative operations
- `websockets` — realtime connections if present

For each module, list every endpoint belonging to it.

---

## STEP 3: GENERATE Frontend_Guide.md

Now generate the file `Frontend_Guide.md` in the root of the repository (or a `/docs/` directory if one exists).

The file must contain every section described below. Every section must be populated from the actual codebase findings. No section may be left with placeholder text. If a feature does not exist in the backend, state explicitly that it is not implemented rather than omitting the section.

Use structured Markdown throughout. Use tables wherever tabular data improves clarity. Use fenced code blocks for all JSON examples. Use consistent heading levels throughout.

---

### SECTION 1 — SYSTEM OVERVIEW

Write a summary of:

**1.1 Backend Architecture**
- Framework and version if detectable
- Project structure (monolith vs modular, number of router modules, etc.)
- Database integrations detected
- Cache integrations detected (Redis, Memcached)
- External service integrations detected

**1.2 Authentication Architecture**
- Authentication mechanism (JWT, session-based, OAuth2, API key, combination)
- Token types in use
- Where tokens are expected by the API (Authorization header, cookie, both)
- Token format (Bearer, etc.)

**1.3 Session Architecture**
- Whether sessions are stateful or stateless
- Session storage mechanism
- Session TTL
- Idle timeout behavior

**1.4 Token Lifecycle**
- Access token expiry
- Refresh token expiry
- Token rotation policy
- Blacklisting mechanism if present

**1.5 Role Hierarchy**
- All roles defined in the system (extract from enums or constants)
- Role hierarchy if defined
- Which roles have elevated privileges

**1.6 Permission Architecture**
- Permission model (role-based, attribute-based, resource-level, combination)
- Whether permissions are per-endpoint, per-module, or per-resource
- Case-level permission implications if present
- Department-scope restrictions if present

**1.7 Module Structure**
- List all frontend modules derived from backend routers
- For each module, state the API path prefix and the number of endpoints

---

### SECTION 2 — API BASE CONFIGURATION

**2.1 Base URL**
- Document the base URL pattern
- Document any versioning in the URL (e.g., `/api/v1`)
- Note any environment-specific configuration needed

**2.2 Required Headers**

Produce a table:

| Header | Required | Value | Notes |
|---|---|---|---|
| Authorization | Yes/No | Bearer {token} | ... |
| Content-Type | Conditional | application/json | ... |
| ... | | | |

**2.3 Authorization Format**
- Exact format of the Authorization header
- Whether token is also accepted via cookie (name of cookie if so)

**2.4 Content Types**
- Default content type for requests with bodies
- Content type for file upload endpoints
- Content type for form data endpoints

**2.5 Timeout Recommendations**
- Recommended request timeout for standard endpoints
- Recommended timeout for file upload endpoints
- Recommended timeout for report generation endpoints if applicable

**2.6 Pagination Standards**
- Pagination parameter names (page, size, limit, offset, cursor)
- Default page size
- Maximum page size if enforced
- Response envelope structure for paginated responses

Provide a JSON example of the standard paginated response envelope.

**2.7 Standard Error Response Envelope**

Document the exact structure of error responses. Provide a JSON example.

**2.8 Standard Success Response Envelope**

If the backend wraps all responses in a standard envelope, document it. Provide a JSON example.

---

### SECTION 3 — AUTHENTICATION FLOW

Document the complete frontend authentication behavior derived from the backend implementation.

**3.1 Login**
- Endpoint: method, path
- Request schema: all fields, types, validation rules
- Response schema: tokens returned, user object returned
- Token storage recommendation based on backend mechanism
- What to do with the response on success
- Error responses and frontend handling for each

**3.2 Logout**
- Endpoint: method, path
- What the backend does (token blacklist, session deletion, cookie clear)
- Frontend responsibilities on logout (clear storage, redirect)
- Error handling

**3.3 Token Refresh Flow**
- Endpoint: method, path
- When to trigger refresh (before expiry, on 401, etc.)
- Request schema
- Response schema
- How to handle refresh failure
- How to handle concurrent refresh requests from multiple tabs (locking recommendation)
- Token rotation behavior

**3.4 Activity Ping**
- Endpoint if present: method, path
- When to call it
- Frequency recommendation
- What it returns
- What happens if it fails

**3.5 Idle Timeout Handling**
- Idle timeout duration from backend config
- Frontend timer implementation recommendation
- What events should reset the idle timer
- What to do when idle timeout is reached (call logout endpoint, clear state, redirect)

**3.6 Session Expiration Handling**
- How the backend signals session expiration (HTTP status code, error body)
- Frontend behavior on session expiration
- Whether to attempt refresh before treating as expired

**3.7 Browser Close Behavior**
- Whether tokens are session-scoped (cleared on browser close) or persistent
- Recommendation based on backend token storage mechanism

**3.8 Protected Route Handling**
- How the frontend should gate access to protected routes
- What to check before rendering a protected page
- What to do if the check fails

**3.9 Unauthorized Response Handling**
- HTTP 401 behavior: trigger refresh or redirect to login
- HTTP 403 behavior: show forbidden state, do not retry
- How to distinguish expired token (refresh candidate) from invalid token (logout required)

**3.10 Forced Logout**
- Scenarios where backend forces logout (password change, admin revocation, etc.)
- How these are signaled to the frontend
- Frontend behavior on forced logout signal

**3.11 Concurrent Refresh Handling**
- Problem: multiple requests failing simultaneously with 401
- Recommendation: queue requests while refresh is in flight, retry after new token obtained
- Implementation pattern recommendation

**3.12 Automatic Redirect Behavior**
- When to redirect to login
- When to redirect to forbidden page
- Whether to preserve the intended destination URL for post-login redirect

---

### SECTION 4 — ROUTE-BY-ROUTE API DOCUMENTATION

For every single endpoint discovered in the codebase, generate a subsection.

Group endpoints by frontend module. Within each module group, order endpoints logically (list before detail, create before update before delete).

For each endpoint, use the following template exactly:

---

#### [MODULE NAME] — [HTTP METHOD] [FULL PATH]

**Purpose:**
[One to two sentence description of what this endpoint does, derived from the function name, docstring, and implementation logic.]

**Authentication Required:** Yes / No

**Allowed Roles:**
[List every role that is permitted to call this endpoint. If all authenticated users are allowed, state that. If public, state that.]

**Permission Scope:**
[Describe any additional permission logic beyond role check — e.g., case ownership, department membership, resource-level permission.]

**Request Headers:**

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Conditional | application/json |

**Path Parameters:**

| Parameter | Type | Description | Validation |
|---|---|---|---|
| ... | | | |

(State "None" if no path parameters.)

**Query Parameters:**

| Parameter | Type | Required | Default | Description | Validation |
|---|---|---|---|---|---|
| ... | | | | | |

(State "None" if no query parameters.)

**Request Body Schema:**

| Field | Type | Required | Default | Validation Rules | Notes |
|---|---|---|---|---|---|
| ... | | | | | |

Provide a complete example JSON request body:

```json
{
  ...
}
```

(State "No request body" if applicable.)

**Response Schema:**

| Field | Type | Always Present | Description |
|---|---|---|---|
| ... | | | |

Provide a complete example JSON success response:

```json
{
  ...
}
```

**Pagination:** Yes / No
(If yes, document pagination parameters and response envelope.)

**HTTP Status Codes:**

| Status Code | Meaning | When Returned |
|---|---|---|
| 200 | Success | ... |
| 201 | Created | ... |
| 400 | Bad Request | ... |
| 401 | Unauthorized | ... |
| 403 | Forbidden | ... |
| 404 | Not Found | ... |
| 422 | Validation Error | ... |
| 500 | Server Error | ... |

(Include only codes actually applicable to this endpoint.)

**Error Responses:**

For each possible error, provide:

```json
{
  "detail": "...",
  "code": "...",
  ...
}
```

**Business Logic Side Effects:**
[Describe any database changes, cache invalidations, emails sent, background tasks triggered, audit logs written, etc.]

**Frontend Handling Notes:**
[Specific guidance for frontend developers: what to do on success, what to do on each error, UX considerations, optimistic update safety, etc.]

**Loading State Considerations:**
[Whether to show a loading indicator, whether the operation is slow, whether to disable the trigger button during the request.]

**Form Validation Requirements:**
[If this endpoint accepts input, list client-side validation that should be enforced before sending the request.]

**Recommended Caching Behavior:**
[Whether the frontend should cache the response, for how long, under what cache key, and when to invalidate.]

**Realtime Refresh Considerations:**
[Whether other parts of the UI should refresh after this operation succeeds (e.g., a list that should reload after a create operation).]

**Upload Handling Requirements:**
[If this endpoint accepts file uploads: accepted MIME types, size limits, multipart form structure, progress tracking recommendation.]

---

Repeat the above template for every single endpoint in the application. Do not skip any endpoint. Do not summarize groups of endpoints.

---

### SECTION 5 — FRONTEND MODULE ORGANIZATION

Produce a table listing every frontend module, its API prefix, and all endpoints it contains:

| Module | API Prefix | Endpoints |
|---|---|---|
| auth | /api/v1/auth | POST /login, POST /logout, POST /refresh, ... |
| personnel | /api/v1/personnel | GET /users, POST /users, GET /users/{id}, ... |
| ... | | |

Then for each module, write a short paragraph describing:
- What domain this module covers
- What state the frontend needs to maintain for this module
- What role restrictions apply at the module level
- What the primary user flows are within this module

---

### SECTION 6 — FORM REQUIREMENTS

For every endpoint that accepts user input (POST, PUT, PATCH with a request body or form data), generate a form specification entry:

**[Endpoint Label]**

| Field | Input Type | Required | Validation | Enum Options | Notes |
|---|---|---|---|---|---|
| ... | text / select / date / file / ... | Yes/No | ... | ... | ... |

Include:
- Which fields are immutable after creation
- Which fields are conditionally required based on other field values
- Date format requirements
- File type and size constraints
- Any fields that must be populated from API lookup (dynamic dropdowns)

---

### SECTION 7 — STATE MANAGEMENT REQUIREMENTS

**7.1 Authentication State**
- What must be stored: access token, refresh token, token expiry, user object
- Where to store each item (memory, sessionStorage, localStorage, httpOnly cookie — recommend based on backend mechanism)
- What to clear on logout
- What to clear on session expiry

**7.2 Session State**
- Whether session state needs to be tracked frontend-side
- Idle timer state
- Last activity timestamp

**7.3 Role and Permission State**
- What role information is returned from the login response or user profile endpoint
- How to store and access role information
- Whether permissions are fetched separately or embedded in the token/user response
- Permission caching recommendation

**7.4 Case Permission State**
- If the backend has case-level permissions: how to fetch them, when to fetch them, how to store them
- Whether case permissions need to be re-fetched on navigation to a case

**7.5 Pagination State**
- What pagination state to maintain per list view (current page, page size, total count, sort, filters)
- Whether pagination state should persist across navigation (URL params recommendation)

**7.6 Caching Recommendations**
- Which API responses are safe to cache and for how long
- Which API responses must never be cached (write operations, auth endpoints)
- Recommended cache invalidation triggers

**7.7 Optimistic Update Safety**
- Which operations are safe for optimistic UI updates
- Which operations must wait for server confirmation before updating UI

---

### SECTION 8 — ERROR HANDLING MATRIX

Produce a comprehensive table of all possible errors:

| Error Source | HTTP Status | Error Code / Key | Error Message Pattern | Frontend UX Action | Retryable |
|---|---|---|---|---|---|
| Invalid credentials | 401 | ... | ... | Show login error message | No |
| Token expired | 401 | ... | ... | Attempt refresh, then redirect | Yes (once) |
| Insufficient permissions | 403 | ... | ... | Show forbidden state | No |
| Resource not found | 404 | ... | ... | Show not found state | No |
| Validation error | 422 | ... | ... | Show field-level errors | No |
| Server error | 500 | ... | ... | Show generic error, offer retry | Yes |
| ... | | | | | |

Then write individual handling guidance for:

**8.1 Validation Error Rendering (HTTP 422)**
- Structure of the 422 response body from FastAPI
- How to map `loc` array to form field names
- How to display field-level errors in forms

**8.2 Authentication Failure Flow**
- Decision tree: 401 received → check if refresh token exists → attempt refresh → if refresh fails → logout and redirect

**8.3 Network Error Handling**
- Timeout behavior
- Offline detection
- Retry recommendation

**8.4 Concurrent Request Error Handling**
- What to do if multiple requests return 401 simultaneously (see Section 3.11)

---

### SECTION 9 — ROLE AND PERMISSION MATRIX

**9.1 Role Definitions**

| Role | Description | Privilege Level |
|---|---|---|
| ... | ... | ... |

**9.2 Endpoint Access Matrix**

Produce a matrix showing which roles can access which endpoint groups:

| Module / Endpoint Group | Role A | Role B | Role C | Superadmin |
|---|---|---|---|---|
| auth — login | ✓ | ✓ | ✓ | ✓ |
| personnel — list users | ✗ | ✓ | ✓ | ✓ |
| admin — all operations | ✗ | ✗ | ✗ | ✓ |
| ... | | | | |

**9.3 Module Visibility by Role**

For each frontend module, state which roles can see it at all:

| Module | Visible To |
|---|---|
| auth | All |
| admin | Superadmin, Admin |
| ... | ... |

**9.4 Case-Level Permission Implications**
- Describe how case-level permissions restrict endpoint access
- What fields in the case object determine permission
- How the frontend should check case-level permissions before showing UI elements

**9.5 Department Scope Restrictions**
- Which endpoints filter results based on the user's department
- Whether the frontend needs to be aware of department scoping
- How department scope is communicated by the backend (filtered response vs. explicit scope field)

**9.6 Admin-Only Operations**
- List every endpoint that requires admin role

**9.7 Superadmin-Only Operations**
- List every endpoint that requires superadmin role

---

### SECTION 10 — FRONTEND SECURITY REQUIREMENTS

**10.1 Token Storage**
- Recommendation for access token storage based on backend auth mechanism
- Recommendation for refresh token storage
- Risks of each storage option and which to avoid

**10.2 Token Handling**
- Never log tokens
- Never expose tokens in URL query parameters
- Remove tokens from memory and storage on logout

**10.3 Refresh Token Handling**
- Implement single-flight refresh (one refresh request at a time, queue others)
- On refresh failure, treat as session expired: clear all tokens, redirect to login
- Never retry a failed refresh

**10.4 Inactivity Handling**
- Implement an inactivity timer on the frontend
- Timer duration based on backend idle timeout value
- Reset timer on user input events (mouse, keyboard, touch)
- On timer expiry: call logout endpoint, clear state, redirect to login
- Optionally show a warning dialog before timeout

**10.5 Logout Behavior**
- Always call the logout endpoint before clearing local state
- Clear all tokens from all storage locations
- Clear all user state from memory
- Cancel any pending API requests
- Redirect to login page

**10.6 Secure Storage Recommendations**
- Do not store sensitive data in localStorage if httpOnly cookies are available
- Do not store raw passwords ever
- Do not cache sensitive personal data beyond session

**10.7 CSRF Considerations**
- If the backend uses cookie-based auth, document whether CSRF protection is required
- If CSRF tokens are required, document how to obtain and send them

**10.8 Session Expiration Handling**
- On every API response, check for session expiration signals
- If session expired signal received: clear state, show expiration message, redirect to login

**10.9 Forbidden Route Handling**
- If user navigates to a route their role cannot access: redirect to an appropriate default page
- Do not render any UI for forbidden routes before the role check completes

**10.10 Content Security**
- Sanitize any backend-provided HTML content before rendering
- Validate file types client-side before upload (in addition to server-side validation)

---

## FORMATTING RULES FOR Frontend_Guide.md

Apply these rules throughout the entire document:

- Use ATX-style headings (`#`, `##`, `###`, `####`)
- Number all top-level sections (`1.`, `2.`, `3.`, ...)
- Number all subsections (`1.1`, `1.2`, `2.1`, ...)
- Use fenced code blocks with language identifier for all code and JSON examples
- Use Markdown tables for all tabular data
- Use `**bold**` for field names and important terms on first use
- Use horizontal rules (`---`) to separate endpoint entries in Section 4
- Ensure consistent indentation throughout
- Do not use HTML tags
- Do not use inline styles
- Every table must have a header row and an alignment row

---

## CRITICAL CONSTRAINTS FOR THE AGENT

You must strictly follow these constraints throughout the entire analysis and generation process:

1. **Derive everything from actual code.** Read every file. Do not guess.
2. **Never document an endpoint that does not exist in the codebase.**
3. **Never assume a field exists in a schema without finding it in the Pydantic model definition.**
4. **Never assume a role or permission without finding it in an enum, constant, or dependency.**
5. **Never assume token expiry values without finding them in configuration or code.**
6. **If a feature described in a comment is not implemented in code, do not document it as implemented.**
7. **If implementation differs from a docstring, follow the implementation.**
8. **Do not omit endpoints because they seem unimportant.**
9. **Do not summarize groups of similar endpoints — document each one individually.**
10. **Do not leave any section blank or with placeholder text.**
11. **If a section's feature is genuinely not present in the backend, write "Not implemented in this backend." in that section and move on.**
12. **Complete the entire document before writing it to disk — do not write partial output.**

---

## OUTPUT

Write exactly one file: `Frontend_Guide.md`

Place it at the repository root or inside a `/docs/` directory if one exists.

The file must be complete, structured, developer-oriented, and entirely derived from the actual backend implementation.