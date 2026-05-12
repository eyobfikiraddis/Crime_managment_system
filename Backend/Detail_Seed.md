# Detail Seed Data

## Seed Script

- Script path: scripts/seed_core_data.py
- Purpose: Populate core tables for auth, personnel, departments, case management, and evidence management.
- Behavior: Safe to re-run; it updates existing rows by natural keys (case_number, national_id, department name, status_name, etc.).

## Data Seeding Overview

The seed script now populates the following tables with comprehensive test data:

### Locations

- Central HQ - Headquarters location
- Downtown District - Downtown investigation center
- Airport Terminal - Airport location
- Port Harbor - Harbor/port location

### Departments

- Homicide (Central HQ location)
- Cyber (Central HQ location)
- Robbery (Downtown District location)

### Personnel

#### Officers (4 seeded)

- Selam Super (SUPER-0001) - Role: superadmin, Department: None
- Dawit Admin (ADMIN-0001) - Role: admin, Department: Homicide
- Muna Head (HEAD-0001) - Role: department_head, Department: Homicide (Department head)
- Kebede Investigator (INV-0001) - Role: investigator, Department: Homicide

#### Civilians (5 seeded)

- Alex Smith (CIV-0001) - Male
- Ruth Bekele (CIV-0002) - Female
- Noah Tadesse (CIV-0003) - Undisclosed
- Hiwot Getnet (CIV-0004) - Female
- Tariku Demissew (CIV-0005) - Male

### Crime Types (7 seeded)

- Homicide (Felony)
- Robbery (Felony)
- Assault (Felony)
- Burglary (Felony)
- Theft (Misdemeanor)
- Fraud (Misdemeanor)
- DUI (Misdemeanor)

### Case Statuses (5 seeded)

- open (Non-terminal)
- closed (Terminal)
- archived (Terminal)
- pending (Non-terminal)
- under_investigation (Non-terminal)

### Evidence Types (7 seeded)

- Weapon - Firearms, blades, and other weapons
- Biological - Blood, saliva, tissue samples
- Digital - Computers, phones, storage devices
- Trace - Fibers, hair, DNA samples
- Document - Written records and documents
- Vehicle - Cars and other vehicles
- Controlled Substance - Drugs and narcotics

### Cases

#### Case 1: CASE-2026-0001 (Homicide Investigation)

- Case Number: CASE-2026-0001
- Title: Seeded Homicide Case
- Crime Type: Homicide
- Status: open
- Lead Officer: Kebede Investigator
- Primary Location: Downtown District
- Severity: felony
- Risk Level: high
- Opened: 2026-05-11

**Participants:**
- CIV-0001 (Alex Smith) - Suspect (Primary)
- CIV-0002 (Ruth Bekele) - Victim
- CIV-0003 (Noah Tadesse) - Witness

**Assigned Officers:**
- Kebede Investigator - lead_investigator
- Muna Head - supervisor

**Charges:**
- CIV-0001: Homicide charge, Status: filed, Verdict: pending

**Evidence:**
- EVD-0001: Knife (weapon), Storage: Central HQ, Collected by: Kebede Investigator

**Case Notes:**
- One internal note by investigator: "Initial seeded case note"

#### Case 2: CASE-2026-0002 (Robbery Investigation)

- Case Number: CASE-2026-0002
- Title: Seeded Robbery Case
- Crime Type: Robbery
- Status: pending
- Lead Officer: Dawit Admin
- Primary Location: Downtown District
- Severity: felony
- Opened: 2026-05-11

**Participants:**
- CIV-0004 (Hiwot Getnet) - Suspect (Primary)
- CIV-0005 (Tariku Demissew) - Victim

**Assigned Officers:**
- Dawit Admin - lead_investigator

**Evidence:**
- EVD-0002: Stolen Cash ($5000), Storage: Central HQ, Collected by: Dawit Admin

## Login Credentials

Use these credentials to log in:

- **Superadmin**
  - National ID: SUPER-0001
  - Password: SuperPass123!

- **Admin**
  - National ID: ADMIN-0001
  - Password: AdminPass123!

- **Department Head**
  - National ID: HEAD-0001
  - Password: HeadPass123!

- **Investigator**
  - National ID: INV-0001
  - Password: InvestPass123!

## Testing Recommendations

1. Start by logging in with different user roles to test RBAC
2. View case lists with different user roles to verify case permissions
3. Create new evidence entries for the existing cases
4. Add case notes and updates
5. Test case status transitions
6. Verify officer assignments and role-in-case assignments
7. Test evidence custody chain tracking
