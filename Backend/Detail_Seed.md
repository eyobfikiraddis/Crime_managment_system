# Detail Seed Data

## Seed Script

- Script path: scripts/seed_core_data.py
- Purpose: Populate core tables for auth, personnel, departments, and case management.
- Behavior: Safe to re-run; it updates existing rows by natural keys (case_number, national_id, department name).

## Tables Added By Migration 002

The following tables were added and are seeded with valid relationships:

- case
  - Linked to crime_type, case_status, location, and officer (lead_officer_id).
- case_person
  - Links person entries to case entries with role_type values (suspect/victim/witness).
- charge
  - Linked to case, person, and crime_type.
- case_officer
  - Links officer assignments to case entries with role_in_case.
- evidence
  - Linked to case, officer (collected_by_officer_id), and location (storage).
- case_note
  - Linked to case and officer.
- department_audit_log
  - Linked to department and officer, append-only audit trail.

## Seeded Records Overview

- location
  - Central HQ
  - Downtown District

- department
  - Homicide (uses Central HQ)
  - Cyber (uses Central HQ)

- person
  - Officers: SUPER-0001, ADMIN-0001, HEAD-0001, INV-0001
  - Civilians: CIV-0001, CIV-0002, CIV-0003

- officer
  - Roles: superadmin, admin, department_head, investigator
  - Homicide head set as department_head officer.

- crime_type
  - Homicide

- case
  - CASE-2026-0001
  - Lead officer: investigator
  - Status: open
  - Location: Downtown District

- case_person
  - CIV-0001 as suspect
  - CIV-0002 as victim
  - CIV-0003 as witness

- charge
  - Filed charge for CIV-0001 on CASE-2026-0001

- case_officer
  - Investigator as lead_investigator
  - Department head as supervisor

- evidence
  - EVD-0001 linked to CASE-2026-0001

- case_note
  - One internal note by investigator

- department_audit_log
  - One entry for department head assignment

## Login Credentials

Use these credentials to log in:

- superadmin
  - National ID: SUPER-0001
  - Password: SuperPass123!

- admin
  - National ID: ADMIN-0001
  - Password: AdminPass123!

- department_head
  - National ID: HEAD-0001
  - Password: HeadPass123!

- investigator
  - National ID: INV-0001
  - Password: InvestPass123!
