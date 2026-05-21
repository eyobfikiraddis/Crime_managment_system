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

Response:

{
  "officer_id": 1,
  "person_id": 1,
  "person_name": "Test Officer",
  "national_id": "OFF-0001",
  "rank": "Detective",
  "badge_number": "BN-0100",
  "role_id": 4,
  "role_name": "investigator",
  "department_id": 1,
  "department_name": "Homicide",
  "is_active": true
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

Response:

{
  "total": 4,
  "page": 1,
  "size": 20,
  "items": [
    {
      "officer_id": 1,
      "person_name": "Selam Super",
      "national_id": "SUPER-0001",
      "rank": "Commissioner",
      "badge_number": "SUP-001",
      "role_name": "superadmin",
      "is_active": true
    }
  ]
}

### GET {{base_url}}/api/v1/personnel/officers/{officer_id}

Path params:
- officer_id (required)

Response:

{
  "officer_id": 1,
  "person_name": "Selam Super",
  "national_id": "SUPER-0001",
  "rank": "Commissioner",
  "badge_number": "SUP-001",
  "role_name": "superadmin",
  "department_name": null,
  "is_active": true,
  "created_at": "2026-05-11T00:00:00Z"
}

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

### GET {{base_url}}/api/v1/personnel/officers/{officer_id}/history

Query params (optional):
- page
- size

Response:

{
  "total": 1,
  "page": 1,
  "size": 20,
  "items": [
    {
      "date": "2026-05-11T00:00:00Z",
      "event_type": "assignment",
      "description": "Assigned to case CASE-2026-0001"
    }
  ]
}

### POST {{base_url}}/api/v1/personnel/persons/{person_id}/suspect

Body (optional):

{
  "risk_level": "high",
  "notes": "Known criminal"
}

### DELETE {{base_url}}/api/v1/personnel/persons/{person_id}/suspect

### POST {{base_url}}/api/v1/personnel/persons/{person_id}/victim

Body (optional):

{
  "needs_protection": true,
  "notes": "Requires witness protection"
}

### DELETE {{base_url}}/api/v1/personnel/persons/{person_id}/victim

### POST {{base_url}}/api/v1/personnel/persons/{person_id}/witness

Body (optional):

{
  "reliability": "high",
  "notes": "Credible witness"
}

### DELETE {{base_url}}/api/v1/personnel/persons/{person_id}/witness

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

Response:

{
  "department_id": 1,
  "name": "Homicide",
  "location": "Central HQ",
  "department_head": "Muna Head",
  "department_head_officer_id": 3,
  "officer_count": 4,
  "created_at": "2026-05-11T00:00:00Z"
}

### DELETE {{base_url}}/api/v1/departments/{department_id}/remove-head

Body: none

## Case Management Module (All routes require Authorization)

### GET {{base_url}}/api/v1/cases/

Query params (optional):
- page
- size

Example:
{{base_url}}/api/v1/cases/?page=1&size=20

Response:

{
  "total": 1,
  "page": 1,
  "size": 20,
  "items": [
    {
      "case_id": 1,
      "case_number": "CASE-2026-0001",
      "title": "Seeded Homicide Case",
      "crime_type": "Homicide",
      "status": "open",
      "severity": "felony",
      "lead_officer": "Kebede Investigator",
      "opened_at": "2026-05-11T00:00:00Z",
      "risk_level": "high"
    }
  ]
}

### GET {{base_url}}/api/v1/cases/search

Query params (optional):
- q: general search text
- case_number: case number
- suspect_name: suspect name
- officer_id: officer ID
- department_id: department ID
- crime_type_id: crime type ID
- status_id: status ID
- severity: severity level
- date_from: start date
- date_to: end date
- page
- size
- sort_by: field to sort by (default: created_at)
- sort_order: asc or desc (default: desc)

### GET {{base_url}}/api/v1/cases/{case_id}

Response:

{
  "case_id": 1,
  "case_number": "CASE-2026-0001",
  "title": "Seeded Homicide Case",
  "description": "Initial seeded case for development",
  "crime_type": {
    "crime_type_id": 1,
    "name": "Homicide"
  },
  "status": {
    "status_id": 1,
    "status_name": "open"
  },
  "severity": "felony",
  "risk_level": "high",
  "primary_location": "Downtown District",
  "lead_officer": "Kebede Investigator",
  "opened_at": "2026-05-11T00:00:00Z",
  "suspects": [],
  "victims": [],
  "witnesses": [],
  "charges": [],
  "assigned_officers": [],
  "evidence_count": 1
}

### POST {{base_url}}/api/v1/cases/

Body (required fields: case_number, title, crime_type_id, status_id, primary_location_id):

{
  "case_number": "CASE-2026-0002",
  "title": "Robbery Investigation",
  "description": "Street robbery case",
  "crime_type_id": 1,
  "status_id": 1,
  "severity": "felony",
  "primary_location_id": 2,
  "risk_level": "high"
}

### PUT {{base_url}}/api/v1/cases/{case_id}

Body (all optional):

{
  "title": "Updated Case Title",
  "description": "Updated description",
  "severity": "misdemeanor",
  "risk_level": "medium"
}

### PATCH {{base_url}}/api/v1/cases/{case_id}/status

Body (required):

{
  "status_id": 2
}

### DELETE {{base_url}}/api/v1/cases/{case_id}

Body: none

### POST {{base_url}}/api/v1/cases/{case_id}/officers

Body (required):

{
  "officer_id": 2,
  "role_in_case": "supervisor"
}

### GET {{base_url}}/api/v1/cases/{case_id}/officers

Response:

[
  {
    "assignment_id": 1,
    "officer_id": 1,
    "officer_name": "Kebede Investigator",
    "role_in_case": "lead_investigator",
    "assigned_at": "2026-05-11T00:00:00Z"
  }
]

### DELETE {{base_url}}/api/v1/cases/{case_id}/officers/{officer_id}

Body: none

### POST {{base_url}}/api/v1/cases/{case_id}/suspects/{person_id}

Body (optional):

{
  "notes": "Primary suspect in the case"
}

### GET {{base_url}}/api/v1/cases/{case_id}/suspects

Response:

[
  {
    "case_person_id": 1,
    "person_id": 1,
    "person_name": "Alex Smith",
    "role_type": "suspect",
    "is_primary": true,
    "notes": "Primary suspect in the case"
  }
]

### DELETE {{base_url}}/api/v1/cases/{case_id}/suspects/{person_id}

Body: none

### POST {{base_url}}/api/v1/cases/{case_id}/victims/{person_id}

Body (optional):

{
  "notes": "Victim information"
}

### GET {{base_url}}/api/v1/cases/{case_id}/victims

### DELETE {{base_url}}/api/v1/cases/{case_id}/victims/{person_id}

### POST {{base_url}}/api/v1/cases/{case_id}/witnesses/{person_id}

Body (optional):

{
  "notes": "Witness statement information"
}

### GET {{base_url}}/api/v1/cases/{case_id}/witnesses

### DELETE {{base_url}}/api/v1/cases/{case_id}/witnesses/{person_id}

### POST {{base_url}}/api/v1/cases/{case_id}/charges

Body (required fields: person_id, crime_type_id, charge_status):

{
  "person_id": 1,
  "crime_type_id": 1,
  "charge_status": "filed",
  "description": "Murder charge",
  "verdict": "pending"
}

### GET {{base_url}}/api/v1/cases/{case_id}/charges

Response:

[
  {
    "charge_id": 1,
    "person_id": 1,
    "crime_type": "Homicide",
    "charge_status": "filed",
    "description": "Murder charge",
    "filed_at": "2026-05-11T00:00:00Z",
    "verdict": "pending"
  }
]

### PUT {{base_url}}/api/v1/cases/{case_id}/charges/{charge_id}

Body (all optional):

{
  "description": "Updated charge description",
  "verdict": "guilty"
}

### PATCH {{base_url}}/api/v1/cases/{case_id}/charges/{charge_id}/status

Body (required):

{
  "charge_status": "dismissed"
}

### POST {{base_url}}/api/v1/cases/{case_id}/arrests

Body (required fields: suspect_id, officer_id):

{
  "suspect_id": 1,
  "officer_id": 1,
  "booking_number": "ARR-2026-0001",
  "location_id": 1,
  "bail_amount": 50000,
  "notes": "Arrest notes"
}

### GET {{base_url}}/api/v1/cases/{case_id}/arrests

## Evidence Module (All routes require Authorization)

### POST {{base_url}}/api/v1/cases/{case_id}/evidence

Body (required fields: evidence_tag, name, collected_by_officer_id):

{
  "evidence_tag": "EVD-0002",
  "name": "Murder Weapon",
  "description": "Knife found at scene",
  "evidence_type_id": 1,
  "is_sensitive": true,
  "storage_location_id": 1,
  "collected_by_officer_id": 1,
  "chain_of_custody_notes": "Initial collection at scene"
}

### GET {{base_url}}/api/v1/cases/{case_id}/evidence

Response:

[
  {
    "evidence_id": 1,
    "evidence_tag": "EVD-0001",
    "name": "Knife",
    "description": "Seeded evidence item",
    "storage_location": "Central HQ",
    "collected_by": "Kebede Investigator",
    "collected_at": "2026-05-11T00:00:00Z",
    "is_sensitive": false
  }
]

### PUT {{base_url}}/api/v1/cases/{case_id}/evidence/{evidence_id}

Body (all optional):

{
  "name": "Updated evidence name",
  "description": "Updated description"
}

### POST {{base_url}}/api/v1/cases/{case_id}/evidence/{evidence_id}/chain

Body (required fields: receiving_officer_id, status):

{
  "receiving_officer_id": 2,
  "status": "in_transit",
  "notes": "Evidence transferred to forensics"
}

### GET {{base_url}}/api/v1/cases/{case_id}/evidence/{evidence_id}/chain

Response:

[
  {
    "entry_id": 1,
    "evidence_id": 1,
    "releasing_officer": "Kebede Investigator",
    "receiving_officer": "Lab Technician",
    "status": "in_transit",
    "notes": "Evidence transferred",
    "timestamp": "2026-05-11T00:00:00Z"
  }
]

### GET {{base_url}}/api/v1/evidence/{evidence_id}

### PATCH {{base_url}}/api/v1/evidence/{evidence_id}

### DELETE {{base_url}}/api/v1/evidence/{evidence_id}

### POST {{base_url}}/api/v1/evidence/{evidence_id}/vehicle

Body (optional):

{
  "plate_number": "ABC-1234",
  "type": "Sedan",
  "make": "Toyota",
  "model": "Camry",
  "color": "Black",
  "year": 2020,
  "vin": "1234567890ABCDEF"
}

### POST {{base_url}}/api/v1/evidence/{evidence_id}/weapon

Body (optional):

{
  "type": "Handgun",
  "make": "Glock",
  "serial_number": "SN-12345",
  "caliber": "9mm"
}

### GET {{base_url}}/api/v1/evidence/{evidence_id}/custody

### POST {{base_url}}/api/v1/evidence/{evidence_id}/custody

### POST {{base_url}}/api/v1/evidence/{evidence_id}/forensic-report

Body (required fields: findings, report_date, officer_id):

{
  "findings": "DNA match found",
  "methodology": "DNA analysis",
  "report_date": "2026-05-11",
  "lab_reference": "LAB-REF-001",
  "officer_id": 1
}

### GET {{base_url}}/api/v1/evidence/{evidence_id}/forensic-report

### GET {{base_url}}/api/v1/cases/{case_id}/photos

Query params (optional):
- page
- size

### POST {{base_url}}/api/v1/cases/{case_id}/photos

Body (required fields: image_url, captured_by):

{
  "image_url": "https://example.com/photo.jpg",
  "description": "Crime scene photo",
  "captured_at": "2026-05-11T10:00:00Z",
  "captured_by": 1
}

## Reports Module (All routes require Authorization)

### GET {{base_url}}/api/v1/reports/cases/summary

Query params (optional):
- date_from
- date_to
- department_id

Response:

{
  "total_cases": 10,
  "open_cases": 5,
  "closed_cases": 5,
  "average_resolution_time_days": 45,
  "high_risk_cases": 2
}

### GET {{base_url}}/api/v1/reports/cases/by-status

Query params (optional):
- date_from
- date_to
- page
- size

Response:

{
  "total": 2,
  "page": 1,
  "size": 20,
  "items": [
    {
      "status_name": "open",
      "count": 5
    },
    {
      "status_name": "closed",
      "count": 5
    }
  ]
}

### GET {{base_url}}/api/v1/reports/cases/by-crime-type

Query params (optional):
- date_from
- date_to
- page
- size

### GET {{base_url}}/api/v1/reports/cases/by-department

### GET {{base_url}}/api/v1/reports/cases/monthly

### GET {{base_url}}/api/v1/reports/arrests/summary

Response:

{
  "total_arrests": 50,
  "this_month": 5,
  "repeat_offenders": 8
}

### GET {{base_url}}/api/v1/reports/arrests/monthly

### GET {{base_url}}/api/v1/reports/arrests/by-department

### GET {{base_url}}/api/v1/reports/evidence/summary

Response:

{
  "total_evidence_items": 100,
  "in_storage": 85,
  "in_transit": 10,
  "released": 5
}

### GET {{base_url}}/api/v1/reports/evidence/by-status

### GET {{base_url}}/api/v1/reports/evidence/storage-utilization

### GET {{base_url}}/api/v1/reports/officers/performance

Response:

{
  "total": 1,
  "page": 1,
  "size": 20,
  "items": [
    {
      "officer_id": 1,
      "officer_name": "Kebede Investigator",
      "cases_closed": 5,
      "cases_pending": 2,
      "arrests_made": 10
    }
  ]
}

### GET {{base_url}}/api/v1/reports/officers/case-load

### GET {{base_url}}/api/v1/reports/officers/activity
