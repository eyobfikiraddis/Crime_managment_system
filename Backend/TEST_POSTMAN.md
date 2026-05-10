# Postman Test Guide

## Base URL and Variables

- Set a Postman environment variable: base_url = http://localhost:8000
- Set access_token and refresh_token after login.

## Common Headers

- Content-Type: application/json
- Authorization: Bearer {{access_token}} (required for protected routes)

## Seeded Login Credentials (from scripts/seed_core_data.py)

- superadmin
  - national_id: SUPER-0001
  - password: SuperPass123!
- admin
  - national_id: ADMIN-0001
  - password: AdminPass123!
- department_head
  - national_id: HEAD-0001
  - password: HeadPass123!
- investigator
  - national_id: INV-0001
  - password: InvestPass123!

## Auth Module

### POST {{base_url}}/api/v1/auth/login

Body (required):

{
  "national_id": "SUPER-0001",
  "password": "SuperPass123!"
}

### POST {{base_url}}/api/v1/auth/refresh

Body (required):

{
  "refresh_token": "{{refresh_token}}"
}

### POST {{base_url}}/api/v1/auth/logout

Headers:
- Authorization: Bearer {{access_token}}

Body (optional):

{
  "refresh_token": "{{refresh_token}}"
}

### POST {{base_url}}/api/v1/auth/activity-ping

Headers:
- Authorization: Bearer {{access_token}}

Body: none

### POST {{base_url}}/api/v1/auth/password-reset-request

Body (required):

{
  "national_id": "INV-0001"
}

### POST {{base_url}}/api/v1/auth/password-reset-confirm

Body (required):

{
  "token": "<reset_token>",
  "new_password": "NewStrongPass123!"
}

### PATCH {{base_url}}/api/v1/auth/password

Headers:
- Authorization: Bearer {{access_token}}

Body (required):

{
  "current_password": "SuperPass123!",
  "new_password": "NewStrongPass123!"
}

## Personnel Module (All routes require Authorization)

### POST {{base_url}}/api/v1/personnel/persons

Body (required fields: first_name, last_name, national_id):

{
  "first_name": "Liya",
  "last_name": "Mengistu",
  "national_id": "CIV-0100",
  "gender": "female",
  "dob": "1995-04-12",
  "phone": "+251911000111",
  "address": "Addis Ababa"
}

### GET {{base_url}}/api/v1/personnel/persons

Query params (optional):
- search
- active_only
- page
- size

Example:
{{base_url}}/api/v1/personnel/persons?search=Li&page=1&size=20&active_only=true

### GET {{base_url}}/api/v1/personnel/persons/{person_id}

Path params:
- person_id (required)

### PATCH {{base_url}}/api/v1/personnel/persons/{person_id}

Body (all optional):

{
  "first_name": "Liya",
  "last_name": "Bekele",
  "gender": "female",
  "dob": "1995-04-12",
  "phone": "+251911222333",
  "address": "Addis Ababa"
}

### DELETE {{base_url}}/api/v1/personnel/persons/{person_id}

Body: none

### POST {{base_url}}/api/v1/personnel/officers

Body (required fields: person_id, department_id, role_id, password):

{
  "person_id": 1,
  "department_id": 1,
  "role_id": 4,
  "password": "StrongPass123!",
  "rank": "Detective",
  "badge_number": "BN-0100"
}

### GET {{base_url}}/api/v1/personnel/officers

Query params (optional):
- department_id
- role_id
- search
- active_only
- page
- size

Example:
{{base_url}}/api/v1/personnel/officers?department_id=1&page=1&size=20

### GET {{base_url}}/api/v1/personnel/officers/{officer_id}

Path params:
- officer_id (required)

### PATCH {{base_url}}/api/v1/personnel/officers/{officer_id}

Body (all optional):

{
  "rank": "Senior Detective",
  "badge_number": "BN-0100",
  "role_id": 4,
  "department_id": 1
}

### DELETE {{base_url}}/api/v1/personnel/officers/{officer_id}

Body: none

## Departments Module (All routes require Authorization)

### POST {{base_url}}/api/v1/departments/

Body (required fields: name):

{
  "name": "Forensics",
  "location_id": 1
}

### GET {{base_url}}/api/v1/departments/

Query params (optional):
- page
- size

Example:
{{base_url}}/api/v1/departments/?page=1&size=20

### GET {{base_url}}/api/v1/departments/{department_id}

Path params:
- department_id (required)

### PATCH {{base_url}}/api/v1/departments/{department_id}

Body (all optional):

{
  "name": "Forensics Unit",
  "location_id": 1
}

### DELETE {{base_url}}/api/v1/departments/{department_id}

Body: none

### POST {{base_url}}/api/v1/departments/{department_id}/assign-head

Body (required):

{
  "officer_id": 2
}

## Case Management Module

No API routes are defined yet for case_management. Models exist, but there is no router. Once routes are added, extend this document with the request schemas for those endpoints.
