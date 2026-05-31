# CCMS Frontend — Phase 7: Personnel Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 6 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all 12 key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab, status transition drawer
- **Evidence Module**: Evidence tab, upload drawer (Cloudinary three-step flow), chain of custody timeline, lightbox viewer
- **Arrests Module**: Arrests tab (DataTable + filter bar), create arrest drawer, arrest detail drawer, update detention/bail status drawer
- **Interrogations Module**: Interrogations tab (DataTable + filter bar), create interrogation drawer, read-only interrogation detail drawer
- **Legal Module**: Legal tab (court case panel + charges table), create/update court case drawers, add/update/drop charge drawers, record/view sentence drawers, court cases list page
- **Route coverage**: All nine case tab skeletons replaced with real content; `/personnel/persons`, `/personnel/persons/[personId]`, `/personnel/officers`, `/personnel/officers/[officerId]` skeleton routes are in place; admin and settings skeletons render
- **i18n completeness**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases`, `evidence`, `arrests`, `interrogations`, and `legal` namespaces

## 1.2 Phase 7 Objective

Phase 7 delivers the **Personnel Module** — the system's directory of persons (civilians linked to investigations) and officers (authenticated users of the system). It is the authoritative source for identities referenced throughout every other module.

The personnel module introduces two concepts absent from prior phases:

1. **PII Field Masking** — Personally Identifiable Information (national ID, date of birth, phone number) is masked by default for officers below `dept_head` rank. An admin-level reveal mechanism shows full values and logs an audit event.
2. **Role Promotion Workflow** — A civilian person record starts neutral. It is promoted into specific investigative roles (Suspect, Victim, Witness) via dedicated drawers. Each promotion is permanent and role-specific; de-promotion is a backend-only admin action not exposed in this phase's UI.

**Phase 7 delivers six sub-systems:**

1. **Person List Page** — Replaces the Phase 1 skeleton at `/personnel/persons`. Full DataTable with role filter, risk level filter, PII-masked national ID column.
2. **Person Detail Page** — Replaces the Phase 1 skeleton at `/personnel/persons/[personId]`. Single-column page (NOT tabbed) with identity card (PII masking), role cards, promotion action buttons, and associated cases table.
3. **Person Management Drawers** — `CreatePersonDrawer`, `PromoteToSuspectDrawer`, `PromoteToVictimDrawer`, `PromoteToWitnessDrawer`.
4. **Officer List Page** — Replaces the Phase 1 skeleton at `/personnel/officers`. Full DataTable with status, department, and role filters.
5. **Officer Detail Page** — Replaces the Phase 1 skeleton at `/personnel/officers/[officerId]`. Identity card, assigned cases summary, department info, activation status.
6. **Officer Management Dialogs** — `CreateOfficerDrawer` (admin only), `DeactivateOfficerDialog`, `ActivateOfficerDialog`, `ResetPasswordDialog`.

**Also in scope:**

- `personnel` feature module: full type definitions, Zod schemas, service implementation, React Query hooks
- Full population of `messages/en/personnel.json` and `messages/am/personnel.json`
- `personnelKeys` query key factory at `src/services/query/keys/personnelKeys.ts`
- `personnel.service.ts` replacing all stubs with real Axios calls (all 21 endpoints)
- The `SensitiveField` shared component is already built in Phase 1. Personnel module consumes it — do not rebuild it.

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Personnel service (`src/services/domain/personnel.service.ts`):**
- Replace all stubs with real Axios calls
- All 21 endpoints across persons and officers (see §8)
- Response validation via Zod `.parse()` on every response
- Typed return values throughout — no `any`

**Types and schemas:**
- All person types: `Person`, `PersonListItem`, `PersonRole`, `RiskLevel`, `SuspectProfile`, `VictimProfile`, `WitnessProfile`, `PersonFilters`, `CreatePersonPayload`, `UpdatePersonPayload`, `PromoteToSuspectPayload`, `PromoteToVictimPayload`, `PromoteToWitnessPayload`, `PersonCaseSummary`
- All officer types: `Officer`, `OfficerListItem`, `OfficerRole`, `OfficerStatus`, `OfficerFilters`, `CreateOfficerPayload`, `UpdateOfficerPayload`, `ResetPasswordPayload`, `OfficerCaseSummary`
- All Zod schemas: create/update/promotion form schemas, API response schemas, filter schemas

**React Query hooks — Persons:**
- `usePersonList(filters)` — paginated list
- `usePersonDetail(personId)` — single person detail
- `useCreatePerson()` — create mutation
- `usePromoteToSuspect(personId)` — promotion mutation
- `usePromoteToVictim(personId)` — promotion mutation
- `usePromoteToWitness(personId)` — promotion mutation
- `usePersonCases(personId)` — cases linked to this person

**React Query hooks — Officers:**
- `useOfficerList(filters)` — paginated list
- `useOfficerDetail(officerId)` — single officer detail
- `useCreateOfficer()` — create mutation (admin+)
- `useActivateOfficer(officerId)` — activate mutation (admin+)
- `useDeactivateOfficer(officerId)` — deactivate mutation (admin+)
- `useResetOfficerPassword(officerId)` — reset password mutation (admin+)
- `useOfficerCases(officerId)` — recent cases assigned to this officer

**i18n messages:**
- Fully populate `messages/en/personnel.json`
- Fully populate `messages/am/personnel.json`

## 1.5 What Must NOT Be Implemented

- **Person de-promotion** — removing a role (SUSPECT/VICTIM/WITNESS) from a person is a backend-only admin action. No UI for it in this phase.
- **Updating suspect/victim/witness profiles after promotion** — e.g., changing a suspect's risk level after the initial promotion. Deferred to Phase 11.
- **Full audit history timeline on person/officer detail** — the full `AuditTimeline` component is a Phase 11 deliverable. Include only a compact "Recent Activity" section (last 5 audit entries as a simple list) for admin+ on the person and officer detail pages, using a lightweight separate endpoint.
- **Bulk person or officer operations** — deferred to Phase 11.
- **Person or officer CSV export** — deferred to Phase 11.
- **Department management** — department list/detail/create/edit is Phase 8.
- **Officer profile editing by the officer themselves** — that is handled by `/settings/profile` (already stubbed in Phase 1). The officer management in this phase is admin-level management only.
- **MSW mocking** — still deferred.

## 1.6 Handoff Standard

When Phase 7 finishes:
- Navigating to `/personnel/persons` shows the full persons DataTable (not the skeleton)
- Persons list shows masked national IDs in the table for roles below `dept_head`
- Clicking a person row navigates to `/personnel/persons/[personId]` which shows the single-column detail page
- PII fields on person detail are masked for non-admin; admin+ sees a "Reveal" button that shows the full value after clicking
- "Promote to Suspect" button (if role not yet assigned) opens `PromoteToSuspectDrawer`; completing it adds the suspect card to the detail page
- Navigating to `/personnel/officers` shows the full officers DataTable
- Officer rows show badge number, name, role badge, department, status badge; `dept_head` sees their own department only, `admin+` sees all
- Clicking an officer row navigates to `/personnel/officers/[officerId]` showing the detail page
- Admin-only "Deactivate" button on officer detail opens `DeactivateOfficerDialog`; confirming deactivates the officer and refreshes the list
- Admin-only "Reset Password" button opens `ResetPasswordDialog`; confirming sends the reset
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds
- i18n completeness test passes for the `personnel` namespace in both EN and AM

---

# 2. Dependencies

No new packages are required. All dependencies from prior phases are already installed:

```bash
pnpm why @tanstack/react-query
pnpm why react-hook-form
pnpm why zod
pnpm why nuqs
pnpm why date-fns
pnpm why lucide-react
```

---

# 3. File & Directory Structure

```
src/
├── features/
│   └── personnel/
│       ├── components/
│       │   ├── persons/
│       │   │   ├── PersonsList.tsx              # List page component
│       │   │   ├── PersonDetail.tsx             # Detail page orchestration wrapper
│       │   │   ├── PersonIdentityCard.tsx       # PII-aware identity metadata card
│       │   │   ├── PersonRoleCards.tsx          # Suspect / Victim / Witness role cards
│       │   │   ├── PersonCasesTable.tsx         # Associated cases compact DataTable
│       │   │   ├── CreatePersonDrawer.tsx       # SlideOverDrawer — create person
│       │   │   ├── PromoteToSuspectDrawer.tsx   # SlideOverDrawer — promote to suspect
│       │   │   ├── PromoteToVictimDrawer.tsx    # SlideOverDrawer — promote to victim
│       │   │   └── PromoteToWitnessDrawer.tsx   # SlideOverDrawer — promote to witness
│       │   └── officers/
│       │       ├── OfficersList.tsx             # List page component
│       │       ├── OfficerDetail.tsx            # Detail page orchestration wrapper
│       │       ├── OfficerIdentityCard.tsx      # Officer identity metadata card
│       │       ├── OfficerCasesSummary.tsx      # Compact recent cases list
│       │       ├── CreateOfficerDrawer.tsx      # SlideOverDrawer — create officer (admin+)
│       │       ├── DeactivateOfficerDialog.tsx  # DestructiveConfirmDialog wrapper
│       │       ├── ActivateOfficerDialog.tsx    # ConfirmDialog wrapper
│       │       └── ResetPasswordDialog.tsx      # ConfirmDialog wrapper (admin+)
│       ├── hooks/
│       │   ├── usePersonList.ts
│       │   ├── usePersonDetail.ts
│       │   ├── useCreatePerson.ts
│       │   ├── usePromoteToSuspect.ts
│       │   ├── usePromoteToVictim.ts
│       │   ├── usePromoteToWitness.ts
│       │   ├── usePersonCases.ts
│       │   ├── useOfficerList.ts
│       │   ├── useOfficerDetail.ts
│       │   ├── useCreateOfficer.ts
│       │   ├── useActivateOfficer.ts
│       │   ├── useDeactivateOfficer.ts
│       │   ├── useResetOfficerPassword.ts
│       │   ├── useOfficerCases.ts
│       │   └── index.ts
│       ├── schemas/
│       │   ├── person.schema.ts
│       │   ├── officer.schema.ts
│       │   ├── personnel-api.schema.ts
│       │   └── personnel-filters.schema.ts
│       ├── types/
│       │   ├── personnel.types.ts
│       │   └── index.ts
│       ├── utils/
│       │   └── personnelUtils.ts
│       └── index.ts

├── services/
│   └── query/
│       └── keys/
│           └── personnelKeys.ts                # New — query key factory

└── app/
    └── (dashboard)/
        └── personnel/
            ├── persons/
            │   ├── page.tsx                    # Replaces Phase 1 skeleton
            │   └── [personId]/
            │       └── page.tsx               # Replaces Phase 1 skeleton
            └── officers/
                ├── page.tsx                    # Replaces Phase 1 skeleton
                └── [officerId]/
                    └── page.tsx               # Replaces Phase 1 skeleton

messages/
├── en/
│   └── personnel.json                         # Full EN population
└── am/
    └── personnel.json                         # Full AM population
```

---

# 4. TypeScript Types

## 4.1 `src/features/personnel/types/personnel.types.ts`

```typescript
// ─── Person Role enum ─────────────────────────────────────────────────────────
export const PersonRole = {
  SUSPECT:  'SUSPECT',
  VICTIM:   'VICTIM',
  WITNESS:  'WITNESS',
} as const
export type PersonRole = (typeof PersonRole)[keyof typeof PersonRole]

// ─── Risk Level enum ──────────────────────────────────────────────────────────
export const RiskLevel = {
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
} as const
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

// ─── Gender enum ──────────────────────────────────────────────────────────────
export const Gender = {
  MALE:    'MALE',
  FEMALE:  'FEMALE',
  OTHER:   'OTHER',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

// ─── Officer Role enum ────────────────────────────────────────────────────────
export const OfficerRole = {
  INVESTIGATOR:    'INVESTIGATOR',
  FORENSIC:        'FORENSIC',
  LEGAL_OFFICER:   'LEGAL_OFFICER',
  DEPT_HEAD:       'DEPT_HEAD',
  ADMIN:           'ADMIN',
  SUPERADMIN:      'SUPERADMIN',
} as const
export type OfficerRole = (typeof OfficerRole)[keyof typeof OfficerRole]

// ─── Officer Status enum ──────────────────────────────────────────────────────
export const OfficerStatus = {
  ACTIVE:   'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type OfficerStatus = (typeof OfficerStatus)[keyof typeof OfficerStatus]

// ─── Linked Role Profiles ─────────────────────────────────────────────────────
export interface SuspectProfile {
  riskLevel: RiskLevel
  notes: string | null
  promotedAt: string                 // ISO 8601
  promotedByOfficerId: string
}

export interface VictimProfile {
  notes: string | null
  promotedAt: string
  promotedByOfficerId: string
}

export interface WitnessProfile {
  credibilityNotes: string | null
  isProtected: boolean
  protectionLevel: string | null     // e.g. "STANDARD", "HIGH" — null if not protected
  promotedAt: string
  promotedByOfficerId: string
}

// ─── PII container ────────────────────────────────────────────────────────────
// The API returns masked values for roles below dept_head.
// For admin+, values are full. The SensitiveField component handles the toggle.
export interface PersonPII {
  nationalId: string | null          // Masked: "***-***-1234" for < dept_head
  dateOfBirth: string | null         // ISO 8601 full date; masked: year only for < dept_head
  phone: string | null               // Masked: "+251 *** *** 789" for < dept_head
}

// ─── Person List Item (for DataTable) ────────────────────────────────────────
export interface PersonListItem {
  id: string
  firstName: string
  lastName: string
  nationalIdMasked: string | null    // Always the masked version for all roles in list view
  gender: Gender | null
  roles: PersonRole[]
  riskLevel: RiskLevel | null        // Non-null only if SUSPECT role is assigned
  isProtectedWitness: boolean
  createdAt: string
}

// ─── Person Detail ────────────────────────────────────────────────────────────
export interface Person {
  id: string
  firstName: string
  lastName: string
  gender: Gender | null
  pii: PersonPII                     // PII fields; values depend on caller's role
  address: string | null
  photoUrl: string | null
  roles: PersonRole[]
  riskLevel: RiskLevel | null
  isProtectedWitness: boolean
  suspectProfile: SuspectProfile | null
  victimProfile: VictimProfile | null
  witnessProfile: WitnessProfile | null
  createdAt: string
  updatedAt: string
}

// ─── Person Case Summary ──────────────────────────────────────────────────────
export interface PersonCaseSummary {
  caseId: string
  caseNumber: string
  title: string
  roleOnCase: PersonRole
  caseStatus: string                 // Case status string (maps to existing CaseStatus enum)
  createdAt: string
}

// ─── Person Filters ───────────────────────────────────────────────────────────
export interface PersonFilters {
  search?: string                    // First name, last name, or masked national ID
  roles?: PersonRole[]
  riskLevel?: RiskLevel[]
  isProtectedWitness?: boolean
  page?: number
  pageSize?: number
  sortField?: 'firstName' | 'lastName' | 'createdAt' | 'riskLevel'
  sortDirection?: 'asc' | 'desc'
}

// ─── Person Payloads ──────────────────────────────────────────────────────────
export interface CreatePersonPayload {
  firstName: string
  lastName: string
  gender?: Gender
  nationalId?: string
  dateOfBirth?: string               // ISO 8601 date
  phone?: string
  address?: string
}

export interface UpdatePersonPayload {
  firstName?: string
  lastName?: string
  gender?: Gender | null
  phone?: string | null
  address?: string | null
}

export interface PromoteToSuspectPayload {
  riskLevel: RiskLevel
  notes?: string
}

export interface PromoteToVictimPayload {
  notes?: string
}

export interface PromoteToWitnessPayload {
  credibilityNotes?: string
  isProtected: boolean
  protectionLevel?: string | null
}

// ─── Officer List Item (for DataTable) ───────────────────────────────────────
export interface OfficerListItem {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  role: OfficerRole
  status: OfficerStatus
  departmentId: string
  departmentName: string
  lastActivityAt: string | null      // Returned only for admin+; null for dept_head
  createdAt: string
}

// ─── Officer Detail ───────────────────────────────────────────────────────────
export interface Officer extends OfficerListItem {
  phone: string | null
  activeCaseCount: number
  totalCaseCount: number
}

// ─── Officer Case Summary ─────────────────────────────────────────────────────
export interface OfficerCaseSummary {
  caseId: string
  caseNumber: string
  title: string
  status: string
  assignedAt: string
}

// ─── Officer Filters ──────────────────────────────────────────────────────────
export interface OfficerFilters {
  search?: string                    // Badge number or full name
  status?: OfficerStatus[]
  role?: OfficerRole[]
  departmentId?: string              // Admin+ can filter by department; dept_head sees only their dept
  page?: number
  pageSize?: number
  sortField?: 'badgeNumber' | 'firstName' | 'lastName' | 'status' | 'lastActivityAt'
  sortDirection?: 'asc' | 'desc'
}

// ─── Officer Payloads ──────────────────────────────────────────────────────────
export interface CreateOfficerPayload {
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  role: OfficerRole
  departmentId: string
  phone?: string
}

export interface UpdateOfficerPayload {
  role?: OfficerRole
  departmentId?: string
  phone?: string | null
}

export interface ResetPasswordPayload {
  // No body required — backend triggers a reset email or generates temp password
}
```

## 4.2 `src/features/personnel/types/index.ts`

```typescript
export * from './personnel.types'
```

---

# 5. Zod Schemas

## 5.1 `src/features/personnel/schemas/person.schema.ts`

```typescript
import { z } from 'zod'
import { Gender, RiskLevel } from '../types/personnel.types'

// ─── Create Person ────────────────────────────────────────────────────────────
export const createPersonSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required.' })
    .max(100),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required.' })
    .max(100),
  gender: z.nativeEnum(Gender).optional(),
  nationalId: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),    // ISO 8601 date string
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
})

export type CreatePersonValues = z.infer<typeof createPersonSchema>

// ─── Promote to Suspect ───────────────────────────────────────────────────────
export const promoteToSuspectSchema = z.object({
  riskLevel: z.nativeEnum(RiskLevel, {
    errorMap: () => ({ message: 'Risk level is required.' }),
  }),
  notes: z.string().max(2000).optional(),
})

export type PromoteToSuspectValues = z.infer<typeof promoteToSuspectSchema>

// ─── Promote to Victim ────────────────────────────────────────────────────────
export const promoteToVictimSchema = z.object({
  notes: z.string().max(2000).optional(),
})

export type PromoteToVictimValues = z.infer<typeof promoteToVictimSchema>

// ─── Promote to Witness ───────────────────────────────────────────────────────
export const promoteToWitnessSchema = z.object({
  credibilityNotes: z.string().max(2000).optional(),
  isProtected: z.boolean().default(false),
  protectionLevel: z.string().max(50).nullable().optional(),
}).refine(
  (data) => {
    // protectionLevel is required when isProtected is true
    if (data.isProtected && !data.protectionLevel) return false
    return true
  },
  {
    message: 'Protection level is required when witness protection is enabled.',
    path: ['protectionLevel'],
  },
)

export type PromoteToWitnessValues = z.infer<typeof promoteToWitnessSchema>
```

## 5.2 `src/features/personnel/schemas/officer.schema.ts`

```typescript
import { z } from 'zod'
import { OfficerRole } from '../types/personnel.types'

// ─── Create Officer ───────────────────────────────────────────────────────────
export const createOfficerSchema = z.object({
  badgeNumber: z
    .string()
    .min(1, { message: 'Badge number is required.' })
    .max(20)
    .regex(/^[A-Z0-9-]+$/, {
      message: 'Badge number must contain only uppercase letters, digits, and hyphens.',
    }),
  firstName: z
    .string()
    .min(1, { message: 'First name is required.' })
    .max(100),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required.' })
    .max(100),
  email: z
    .string()
    .email({ message: 'A valid email address is required.' })
    .max(200),
  role: z.nativeEnum(OfficerRole, {
    errorMap: () => ({ message: 'Officer role is required.' }),
  }),
  departmentId: z
    .string()
    .min(1, { message: 'Department is required.' }),
  phone: z.string().max(20).optional(),
})

export type CreateOfficerValues = z.infer<typeof createOfficerSchema>
```

## 5.3 `src/features/personnel/schemas/personnel-api.schema.ts`

```typescript
import { z } from 'zod'
import { Gender, RiskLevel, PersonRole, OfficerRole, OfficerStatus } from '../types/personnel.types'

// ─── Shared sub-schemas ───────────────────────────────────────────────────────
const suspectProfileSchema = z.object({
  riskLevel: z.nativeEnum(RiskLevel),
  notes: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const victimProfileSchema = z.object({
  notes: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const witnessProfileSchema = z.object({
  credibilityNotes: z.string().nullable(),
  isProtected: z.boolean(),
  protectionLevel: z.string().nullable(),
  promotedAt: z.string(),
  promotedByOfficerId: z.string().uuid(),
})

const personPIISchema = z.object({
  nationalId: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  phone: z.string().nullable(),
})

// ─── Person List Item ─────────────────────────────────────────────────────────
export const personListItemSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  nationalIdMasked: z.string().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  roles: z.array(z.nativeEnum(PersonRole)),
  riskLevel: z.nativeEnum(RiskLevel).nullable(),
  isProtectedWitness: z.boolean(),
  createdAt: z.string(),
})

// ─── Person Detail ────────────────────────────────────────────────────────────
export const personDetailSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.nativeEnum(Gender).nullable(),
  pii: personPIISchema,
  address: z.string().nullable(),
  photoUrl: z.string().nullable(),
  roles: z.array(z.nativeEnum(PersonRole)),
  riskLevel: z.nativeEnum(RiskLevel).nullable(),
  isProtectedWitness: z.boolean(),
  suspectProfile: suspectProfileSchema.nullable(),
  victimProfile: victimProfileSchema.nullable(),
  witnessProfile: witnessProfileSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ─── Paginated persons ────────────────────────────────────────────────────────
export const paginatedPersonsSchema = z.object({
  data: z.array(personListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Person Case Summary ──────────────────────────────────────────────────────
export const personCaseSummarySchema = z.object({
  caseId: z.string().uuid(),
  caseNumber: z.string(),
  title: z.string(),
  roleOnCase: z.nativeEnum(PersonRole),
  caseStatus: z.string(),
  createdAt: z.string(),
})

export const personCasesResponseSchema = z.object({
  data: z.array(personCaseSummarySchema),
  total: z.number(),
})

// ─── Officer List Item ────────────────────────────────────────────────────────
export const officerListItemSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.nativeEnum(OfficerRole),
  status: z.nativeEnum(OfficerStatus),
  departmentId: z.string().uuid(),
  departmentName: z.string(),
  lastActivityAt: z.string().nullable(),
  createdAt: z.string(),
})

// ─── Officer Detail ───────────────────────────────────────────────────────────
export const officerDetailSchema = officerListItemSchema.extend({
  phone: z.string().nullable(),
  activeCaseCount: z.number(),
  totalCaseCount: z.number(),
})

// ─── Paginated officers ───────────────────────────────────────────────────────
export const paginatedOfficersSchema = z.object({
  data: z.array(officerListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Officer Case Summary ─────────────────────────────────────────────────────
export const officerCaseSummarySchema = z.object({
  caseId: z.string().uuid(),
  caseNumber: z.string(),
  title: z.string(),
  status: z.string(),
  assignedAt: z.string(),
})

export const officerCasesResponseSchema = z.object({
  data: z.array(officerCaseSummarySchema),
  total: z.number(),
})
```

## 5.4 `src/features/personnel/schemas/personnel-filters.schema.ts`

```typescript
import { z } from 'zod'
import { PersonRole, RiskLevel, OfficerStatus, OfficerRole } from '../types/personnel.types'

export const personFiltersSchema = z.object({
  search: z.string().optional(),
  roles: z.array(z.nativeEnum(PersonRole)).optional(),
  riskLevel: z.array(z.nativeEnum(RiskLevel)).optional(),
  isProtectedWitness: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['firstName', 'lastName', 'createdAt', 'riskLevel'])
    .optional()
    .default('lastName'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const officerFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(OfficerStatus)).optional(),
  role: z.array(z.nativeEnum(OfficerRole)).optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['badgeNumber', 'firstName', 'lastName', 'status', 'lastActivityAt'])
    .optional()
    .default('badgeNumber'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})
```

---

# 6. `src/features/personnel/utils/personnelUtils.ts`

```typescript
import { RiskLevel, OfficerRole, OfficerStatus, PersonRole } from '../types/personnel.types'
import type { BadgeVariant } from '@shared/types/ui.types'

// ─── Risk Level badge variant mapping ────────────────────────────────────────
export const RISK_LEVEL_VARIANTS: Record<RiskLevel, BadgeVariant> = {
  LOW:    'success',      // Green — low risk
  MEDIUM: 'warning',      // Amber — medium risk
  HIGH:   'destructive',  // Red — high risk
}

// ─── Officer Status badge variant mapping ────────────────────────────────────
export const OFFICER_STATUS_VARIANTS: Record<OfficerStatus, BadgeVariant> = {
  ACTIVE:   'success',  // Green — officer is active
  INACTIVE: 'muted',    // Slate — officer is inactive
}

// ─── Officer Role badge variant mapping ──────────────────────────────────────
export const OFFICER_ROLE_VARIANTS: Record<OfficerRole, BadgeVariant> = {
  INVESTIGATOR:  'primary',
  FORENSIC:      'accent',
  LEGAL_OFFICER: 'accent',
  DEPT_HEAD:     'warning',
  ADMIN:         'destructive',
  SUPERADMIN:    'destructive',
}

// ─── Person Role badge variant mapping ───────────────────────────────────────
export const PERSON_ROLE_VARIANTS: Record<PersonRole, BadgeVariant> = {
  SUSPECT: 'warning',
  VICTIM:  'muted',
  WITNESS: 'primary',
}

// ─── Full name helper ─────────────────────────────────────────────────────────
export function getFullName(first: string, last: string): string {
  return `${first} ${last}`.trim()
}

// ─── Officer display name helper ──────────────────────────────────────────────
// Returns: "Insp. Alem Tadesse (BD-00142)"
export function getOfficerDisplayName(
  firstName: string,
  lastName: string,
  badgeNumber: string,
): string {
  return `${firstName} ${lastName} (${badgeNumber})`
}

// ─── Risk level ordinal (for sorting) ────────────────────────────────────────
export const RISK_LEVEL_ORDINAL: Record<RiskLevel, number> = {
  LOW:    0,
  MEDIUM: 1,
  HIGH:   2,
}

// ─── Check if a role is already assigned to a person ──────────────────────────
export function hasRole(roles: PersonRole[], role: PersonRole): boolean {
  return roles.includes(role)
}

// ─── Roles not yet assigned to a person ──────────────────────────────────────
export function getUnassignedRoles(roles: PersonRole[]): PersonRole[] {
  return Object.values(PersonRole).filter((r) => !roles.includes(r))
}
```

---

# 7. Query Key Factory

## 7.1 `src/services/query/keys/personnelKeys.ts`

```typescript
export const personnelKeys = {
  // ── Persons root ─────────────────────────────────────────────────────────────
  persons: () => ['persons'] as const,

  personList: () => [...personnelKeys.persons(), 'list'] as const,
  personListFiltered: (filters: Record<string, unknown>) =>
    [...personnelKeys.personList(), filters] as const,

  personDetail: () => [...personnelKeys.persons(), 'detail'] as const,
  person: (personId: string) =>
    [...personnelKeys.personDetail(), personId] as const,

  personCases: (personId: string) =>
    [...personnelKeys.person(personId), 'cases'] as const,

  // ── Officers root ─────────────────────────────────────────────────────────────
  officers: () => ['officers'] as const,

  officerList: () => [...personnelKeys.officers(), 'list'] as const,
  officerListFiltered: (filters: Record<string, unknown>) =>
    [...personnelKeys.officerList(), filters] as const,

  officerDetail: () => [...personnelKeys.officers(), 'detail'] as const,
  officer: (officerId: string) =>
    [...personnelKeys.officerDetail(), officerId] as const,

  officerCases: (officerId: string) =>
    [...personnelKeys.officer(officerId), 'cases'] as const,
} as const
```

---

# 8. Service Layer

## 8.1 `src/services/domain/personnel.service.ts`

Replace all stubs. Every response validated with Zod. No `any` types.

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedPersonsSchema,
  personDetailSchema,
  personCasesResponseSchema,
  paginatedOfficersSchema,
  officerDetailSchema,
  officerCasesResponseSchema,
} from '@features/personnel/schemas/personnel-api.schema'
import type {
  Person,
  PersonListItem,
  PersonFilters,
  PersonCaseSummary,
  CreatePersonPayload,
  PromoteToSuspectPayload,
  PromoteToVictimPayload,
  PromoteToWitnessPayload,
  Officer,
  OfficerListItem,
  OfficerFilters,
  OfficerCaseSummary,
  CreateOfficerPayload,
} from '@features/personnel/types/personnel.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONS (12 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/personnel/persons — list with filters */
export async function getPersons(
  filters: PersonFilters,
): Promise<PaginatedResponse<PersonListItem>> {
  const params = buildPersonParams(filters)
  const raw = await apiClient.get(`/api/v1/personnel/persons?${params}`)
  return paginatedPersonsSchema.parse(raw)
}

/** GET /api/v1/personnel/persons/:id — single person detail */
export async function getPerson(personId: string): Promise<Person> {
  const raw = await apiClient.get(`/api/v1/personnel/persons/${personId}`)
  return personDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/persons — create new person */
export async function createPerson(
  payload: CreatePersonPayload,
): Promise<Person> {
  const raw = await apiClient.post('/api/v1/personnel/persons', payload)
  return personDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/persons/:id/suspect — promote to suspect */
export async function promoteToSuspect(
  personId: string,
  payload: PromoteToSuspectPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/suspect`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/persons/:id/victim — promote to victim */
export async function promoteToVictim(
  personId: string,
  payload: PromoteToVictimPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/victim`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/persons/:id/witness — promote to witness */
export async function promoteToWitness(
  personId: string,
  payload: PromoteToWitnessPayload,
): Promise<Person> {
  const raw = await apiClient.post(
    `/api/v1/personnel/persons/${personId}/witness`,
    payload,
  )
  return personDetailSchema.parse(raw)
}

/**
 * GET /api/v1/personnel/persons/:id/cases
 * Cases this person is linked to (as suspect, victim, or witness).
 * page and pageSize supported; returns up to 100 for the detail page.
 */
export async function getPersonCases(
  personId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: PersonCaseSummary[]; total: number }> {
  const p = new URLSearchParams()
  p.set('page', String(params.page ?? 1))
  p.set('pageSize', String(params.pageSize ?? 25))
  const raw = await apiClient.get(
    `/api/v1/personnel/persons/${personId}/cases?${p.toString()}`,
  )
  return personCasesResponseSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFICERS (9 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/personnel/officers — list with filters */
export async function getOfficers(
  filters: OfficerFilters,
): Promise<PaginatedResponse<OfficerListItem>> {
  const params = buildOfficerParams(filters)
  const raw = await apiClient.get(`/api/v1/personnel/officers?${params}`)
  return paginatedOfficersSchema.parse(raw)
}

/** GET /api/v1/personnel/officers/:id — single officer detail */
export async function getOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.get(`/api/v1/personnel/officers/${officerId}`)
  return officerDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/officers — create new officer (admin+) */
export async function createOfficer(
  payload: CreateOfficerPayload,
): Promise<Officer> {
  const raw = await apiClient.post('/api/v1/personnel/officers', payload)
  return officerDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/officers/:id/activate — reactivate officer (admin+) */
export async function activateOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.post(
    `/api/v1/personnel/officers/${officerId}/activate`,
  )
  return officerDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/officers/:id/deactivate — deactivate officer (admin+) */
export async function deactivateOfficer(officerId: string): Promise<Officer> {
  const raw = await apiClient.post(
    `/api/v1/personnel/officers/${officerId}/deactivate`,
  )
  return officerDetailSchema.parse(raw)
}

/** POST /api/v1/personnel/officers/:id/reset-password — trigger password reset (admin+) */
export async function resetOfficerPassword(officerId: string): Promise<void> {
  await apiClient.post(`/api/v1/personnel/officers/${officerId}/reset-password`)
}

/**
 * GET /api/v1/personnel/officers/:id/cases
 * Recent cases assigned to this officer. Returns last 10 by default.
 */
export async function getOfficerCases(
  officerId: string,
): Promise<{ data: OfficerCaseSummary[]; total: number }> {
  const raw = await apiClient.get(
    `/api/v1/personnel/officers/${officerId}/cases?pageSize=10&sortField=assignedAt&sortDirection=desc`,
  )
  return officerCasesResponseSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildPersonParams(filters: PersonFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.roles?.length) p.set('roles', filters.roles.join(','))
  if (filters.riskLevel?.length) p.set('riskLevel', filters.riskLevel.join(','))
  if (filters.isProtectedWitness !== undefined)
    p.set('isProtectedWitness', String(filters.isProtectedWitness))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function buildOfficerParams(filters: OfficerFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  if (filters.role?.length) p.set('role', filters.role.join(','))
  if (filters.departmentId) p.set('departmentId', filters.departmentId)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
```

---

# 9. React Query Hooks

Create all hooks in `src/features/personnel/hooks/`.

## 9.1 `usePersonList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPersons } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import type { PersonFilters } from '../types/personnel.types'

export function usePersonList(filters: PersonFilters) {
  return useQuery({
    queryKey: personnelKeys.personListFiltered(filters as Record<string, unknown>),
    queryFn: () => getPersons(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
```

## 9.2 `usePersonDetail.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPerson } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function usePersonDetail(personId: string) {
  return useQuery({
    queryKey: personnelKeys.person(personId),
    queryFn: () => getPerson(personId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(personId),
  })
}
```

## 9.3 `useCreatePerson.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createPerson } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreatePersonPayload } from '../types/personnel.types'

export function useCreatePerson() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: CreatePersonPayload) => createPerson(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({ message: t('persons.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('persons.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.4 `usePromoteToSuspect.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { promoteToSuspect } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PromoteToSuspectPayload } from '../types/personnel.types'

export function usePromoteToSuspect(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: PromoteToSuspectPayload) =>
      promoteToSuspect(personId, payload),
    onSuccess: () => {
      // Invalidate the person detail — the suspectProfile will now be populated
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      // Invalidate the list — the roles column and risk badge update
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({ message: t('persons.promoteToSuspect.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('persons.promoteToSuspect.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.5 `usePromoteToVictim.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { promoteToVictim } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PromoteToVictimPayload } from '../types/personnel.types'

export function usePromoteToVictim(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: PromoteToVictimPayload) =>
      promoteToVictim(personId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({ message: t('persons.promoteToVictim.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('persons.promoteToVictim.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.6 `usePromoteToWitness.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { promoteToWitness } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PromoteToWitnessPayload } from '../types/personnel.types'

export function usePromoteToWitness(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: PromoteToWitnessPayload) =>
      promoteToWitness(personId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({ message: t('persons.promoteToWitness.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('persons.promoteToWitness.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.7 `usePersonCases.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPersonCases } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function usePersonCases(
  personId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: [...personnelKeys.personCases(personId), params],
    queryFn: () => getPersonCases(personId, params),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(personId),
  })
}
```

## 9.8 `useOfficerList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getOfficers } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import type { OfficerFilters } from '../types/personnel.types'

export function useOfficerList(filters: OfficerFilters) {
  return useQuery({
    queryKey: personnelKeys.officerListFiltered(filters as Record<string, unknown>),
    queryFn: () => getOfficers(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
```

## 9.9 `useOfficerDetail.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function useOfficerDetail(officerId: string) {
  return useQuery({
    queryKey: personnelKeys.officer(officerId),
    queryFn: () => getOfficer(officerId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(officerId),
  })
}
```

## 9.10 `useCreateOfficer.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateOfficerPayload } from '../types/personnel.types'

export function useCreateOfficer() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: (payload: CreateOfficerPayload) => createOfficer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officerList() })
      addToast({ message: t('officers.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('officers.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.11 `useActivateOfficer.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { activateOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useActivateOfficer(officerId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: () => activateOfficer(officerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officer(officerId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officerList() })
      addToast({ message: t('officers.activate.successMessage'), variant: 'success' })
    },
  })
}
```

## 9.12 `useDeactivateOfficer.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deactivateOfficer } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeactivateOfficer(officerId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    // Not optimistic — officer deactivation is a security-sensitive action
    mutationFn: () => deactivateOfficer(officerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officer(officerId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.officerList() })
      addToast({ message: t('officers.deactivate.successMessage'), variant: 'success' })
    },
  })
}
```

## 9.13 `useResetOfficerPassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { resetOfficerPassword } from '@services/domain/personnel.service'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useResetOfficerPassword(officerId: string) {
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    mutationFn: () => resetOfficerPassword(officerId),
    onSuccess: () => {
      addToast({ message: t('officers.resetPassword.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('officers.resetPassword.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.14 `useOfficerCases.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getOfficerCases } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'

export function useOfficerCases(officerId: string) {
  return useQuery({
    queryKey: personnelKeys.officerCases(officerId),
    queryFn: () => getOfficerCases(officerId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(officerId),
  })
}
```

## 9.15 `src/features/personnel/hooks/index.ts`

```typescript
export { usePersonList } from './usePersonList'
export { usePersonDetail } from './usePersonDetail'
export { useCreatePerson } from './useCreatePerson'
export { usePromoteToSuspect } from './usePromoteToSuspect'
export { usePromoteToVictim } from './usePromoteToVictim'
export { usePromoteToWitness } from './usePromoteToWitness'
export { usePersonCases } from './usePersonCases'
export { useOfficerList } from './useOfficerList'
export { useOfficerDetail } from './useOfficerDetail'
export { useCreateOfficer } from './useCreateOfficer'
export { useActivateOfficer } from './useActivateOfficer'
export { useDeactivateOfficer } from './useDeactivateOfficer'
export { useResetOfficerPassword } from './useResetOfficerPassword'
export { useOfficerCases } from './useOfficerCases'
```

---

# 10. i18n Messages — Personnel

## 10.1 `messages/en/personnel.json` — Full Population

```json
{
  "persons": {
    "pageTitle": "Persons",
    "list": {
      "heading": "Persons",
      "entityCount": "{count} person(s)",
      "addPersonButton": "Add Person",
      "filters": {
        "search": "Search by name or ID...",
        "roles": "Role",
        "riskLevel": "Risk Level",
        "protectedWitness": "Protected Witness Only",
        "clearAll": "Clear all filters"
      },
      "loading": "Loading persons...",
      "empty": {
        "title": "No Persons Found",
        "description": "No person records have been created yet.",
        "cta": "Add the first person using the button above."
      },
      "emptyFiltered": "No persons match your current filters.",
      "columns": {
        "name": "Name",
        "nationalId": "National ID",
        "roles": "Roles",
        "riskLevel": "Risk",
        "protected": "Protected",
        "createdAt": "Added",
        "actions": "Actions"
      },
      "protectedYes": "Protected",
      "rowActions": {
        "view": "View Details"
      }
    },
    "detail": {
      "breadcrumb": "Persons",
      "identityCard": {
        "title": "Identity",
        "firstName": "First Name",
        "lastName": "Last Name",
        "gender": "Gender",
        "nationalId": "National ID",
        "dateOfBirth": "Date of Birth",
        "phone": "Phone",
        "address": "Address",
        "noAddress": "Not recorded",
        "createdAt": "Record Created",
        "updatedAt": "Last Updated"
      },
      "pii": {
        "masked": "Hidden for privacy",
        "revealButton": "Reveal",
        "hideButton": "Hide",
        "dobYearOnly": "Year only visible for your role",
        "revealAuditNotice": "Revealing this field will be logged in the audit trail."
      },
      "rolesSection": {
        "title": "Roles & Profiles",
        "noRoles": "No roles assigned yet.",
        "noRolesDescription": "This person has not been linked to any investigation roles.",
        "promoteSection": "Assign Roles",
        "promoteHint": "Use the buttons below to assign this person to an investigative role. Each assignment is permanent."
      },
      "suspectCard": {
        "title": "Suspect Profile",
        "riskLevel": "Risk Level",
        "notes": "Notes",
        "noNotes": "No notes.",
        "promotedAt": "Designated",
        "promotedBy": "By"
      },
      "victimCard": {
        "title": "Victim Profile",
        "notes": "Notes",
        "noNotes": "No notes.",
        "promotedAt": "Designated",
        "promotedBy": "By"
      },
      "witnessCard": {
        "title": "Witness Profile",
        "credibilityNotes": "Credibility Notes",
        "noNotes": "No notes.",
        "isProtected": "Under Protection",
        "protectionLevel": "Protection Level",
        "notProtected": "No protection",
        "promotedAt": "Designated",
        "promotedBy": "By"
      },
      "casesSection": {
        "title": "Associated Cases",
        "entityCount": "{count} case(s)",
        "loading": "Loading cases...",
        "empty": "This person is not linked to any cases.",
        "columns": {
          "caseNumber": "Case No.",
          "title": "Case Title",
          "roleOnCase": "Role",
          "caseStatus": "Status",
          "createdAt": "Since"
        }
      },
      "actions": {
        "promoteToSuspect": "Add as Suspect",
        "promoteToVictim": "Add as Victim",
        "promoteToWitness": "Add as Witness"
      }
    },
    "riskLevel": {
      "LOW": "Low",
      "MEDIUM": "Medium",
      "HIGH": "High"
    },
    "role": {
      "SUSPECT": "Suspect",
      "VICTIM": "Victim",
      "WITNESS": "Witness"
    },
    "gender": {
      "MALE": "Male",
      "FEMALE": "Female",
      "OTHER": "Other"
    },
    "create": {
      "drawerTitle": "Add Person",
      "drawerDescription": "Create a new person record in the system.",
      "section1Title": "Basic Information",
      "section2Title": "Contact & Identity",
      "firstNameLabel": "First Name",
      "firstNamePlaceholder": "e.g. Alem",
      "lastNameLabel": "Last Name",
      "lastNamePlaceholder": "e.g. Tadesse",
      "genderLabel": "Gender (optional)",
      "nationalIdLabel": "National ID (optional)",
      "nationalIdPlaceholder": "e.g. ETH-1234567890",
      "nationalIdHint": "This field is treated as sensitive PII and will be masked for lower roles.",
      "dateOfBirthLabel": "Date of Birth (optional)",
      "phoneLabel": "Phone Number (optional)",
      "phonePlaceholder": "e.g. +251 91 234 5678",
      "addressLabel": "Address (optional)",
      "addressPlaceholder": "e.g. Bole Sub-City, Addis Ababa",
      "submitButton": "Add Person",
      "cancelButton": "Cancel",
      "successMessage": "Person record created successfully.",
      "errorMessage": "Failed to create person record. Please try again."
    },
    "promoteToSuspect": {
      "drawerTitle": "Add as Suspect",
      "drawerDescription": "Link this person to the investigation as a suspect. This assignment is permanent.",
      "permanenceNotice": "Once a person is designated as a Suspect, this cannot be undone from the UI. Contact an administrator if this was made in error.",
      "section1Title": "Suspect Details",
      "riskLevelLabel": "Risk Level",
      "riskLevelHint": "Assess the risk level based on available intelligence.",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Any notes relevant to the suspect designation...",
      "submitButton": "Confirm — Add as Suspect",
      "cancelButton": "Cancel",
      "successMessage": "Person designated as Suspect successfully.",
      "errorMessage": "Failed to designate as Suspect. Please try again."
    },
    "promoteToVictim": {
      "drawerTitle": "Add as Victim",
      "drawerDescription": "Link this person to the investigation as a victim. This assignment is permanent.",
      "permanenceNotice": "Once a person is designated as a Victim, this cannot be undone from the UI.",
      "section1Title": "Victim Details",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Any notes relevant to the victim designation...",
      "submitButton": "Confirm — Add as Victim",
      "cancelButton": "Cancel",
      "successMessage": "Person designated as Victim successfully.",
      "errorMessage": "Failed to designate as Victim. Please try again."
    },
    "promoteToWitness": {
      "drawerTitle": "Add as Witness",
      "drawerDescription": "Link this person to the investigation as a witness. This assignment is permanent.",
      "permanenceNotice": "Once a person is designated as a Witness, this cannot be undone from the UI.",
      "section1Title": "Witness Details",
      "section2Title": "Witness Protection",
      "credibilityNotesLabel": "Credibility Notes (optional)",
      "credibilityNotesPlaceholder": "Notes on witness credibility and reliability...",
      "isProtectedLabel": "Under Witness Protection",
      "protectionLevelLabel": "Protection Level",
      "protectionLevelPlaceholder": "e.g. STANDARD, HIGH",
      "protectionLevelHint": "Required when witness protection is enabled.",
      "protectedBadge": "Protected Witness",
      "submitButton": "Confirm — Add as Witness",
      "cancelButton": "Cancel",
      "successMessage": "Person designated as Witness successfully.",
      "errorMessage": "Failed to designate as Witness. Please try again."
    }
  },
  "officers": {
    "pageTitle": "Officers",
    "list": {
      "heading": "Officers",
      "entityCount": "{count} officer(s)",
      "addOfficerButton": "Add Officer",
      "filters": {
        "search": "Search by badge or name...",
        "status": "Status",
        "role": "Role",
        "department": "Department",
        "clearAll": "Clear all filters"
      },
      "loading": "Loading officers...",
      "empty": {
        "title": "No Officers Found",
        "description": "No officer accounts exist in this scope."
      },
      "emptyFiltered": "No officers match your current filters.",
      "columns": {
        "badgeNumber": "Badge",
        "name": "Name",
        "role": "Role",
        "department": "Department",
        "status": "Status",
        "lastActivity": "Last Active",
        "actions": "Actions"
      },
      "lastActivityNever": "Never",
      "rowActions": {
        "view": "View Details",
        "activate": "Activate",
        "deactivate": "Deactivate",
        "resetPassword": "Reset Password"
      }
    },
    "detail": {
      "breadcrumb": "Officers",
      "identityCard": {
        "title": "Officer Identity",
        "badgeNumber": "Badge Number",
        "firstName": "First Name",
        "lastName": "Last Name",
        "email": "Email",
        "phone": "Phone",
        "noPhone": "Not recorded",
        "role": "Role",
        "department": "Department",
        "status": "Status",
        "lastActivity": "Last Active",
        "lastActivityNever": "Never",
        "activeCases": "Active Cases",
        "totalCases": "Total Cases",
        "createdAt": "Account Created"
      },
      "casesSection": {
        "title": "Recent Assigned Cases",
        "loading": "Loading cases...",
        "empty": "No cases assigned to this officer.",
        "viewAll": "View all cases",
        "columns": {
          "caseNumber": "Case No.",
          "title": "Title",
          "status": "Status",
          "assignedAt": "Assigned"
        }
      },
      "actions": {
        "deactivate": "Deactivate Officer",
        "activate": "Activate Officer",
        "resetPassword": "Reset Password"
      }
    },
    "officerRole": {
      "INVESTIGATOR": "Investigator",
      "FORENSIC": "Forensic Officer",
      "LEGAL_OFFICER": "Legal Officer",
      "DEPT_HEAD": "Department Head",
      "ADMIN": "Administrator",
      "SUPERADMIN": "Super Administrator"
    },
    "officerStatus": {
      "ACTIVE": "Active",
      "INACTIVE": "Inactive"
    },
    "create": {
      "drawerTitle": "Add Officer",
      "drawerDescription": "Create a new officer account. The officer will receive an email to set their password.",
      "section1Title": "Identity",
      "section2Title": "Account Details",
      "badgeNumberLabel": "Badge Number",
      "badgeNumberPlaceholder": "e.g. BD-00142",
      "badgeNumberHint": "Must be unique. Use uppercase letters, digits, and hyphens only.",
      "firstNameLabel": "First Name",
      "firstNamePlaceholder": "e.g. Sara",
      "lastNameLabel": "Last Name",
      "lastNamePlaceholder": "e.g. Haile",
      "emailLabel": "Email Address",
      "emailPlaceholder": "e.g. sara.haile@police.gov.et",
      "phoneLabel": "Phone Number (optional)",
      "phonePlaceholder": "e.g. +251 91 234 5678",
      "roleLabel": "Officer Role",
      "departmentLabel": "Department",
      "departmentPlaceholder": "Select department...",
      "submitButton": "Create Officer Account",
      "cancelButton": "Cancel",
      "successMessage": "Officer account created. An email has been sent with login instructions.",
      "errorMessage": "Failed to create officer account. Please try again."
    },
    "deactivate": {
      "confirmTitle": "Deactivate this officer?",
      "confirmDescription": "Officer {badgeNumber} — {officerName} will be deactivated and will no longer be able to log in. All active sessions will be terminated. This action is logged.",
      "confirmButton": "Deactivate Officer",
      "cancelButton": "Cancel",
      "successMessage": "Officer deactivated successfully.",
      "errorMessage": "Failed to deactivate officer. Please try again."
    },
    "activate": {
      "confirmTitle": "Activate this officer?",
      "confirmDescription": "Officer {badgeNumber} — {officerName} will be reactivated and will be able to log in again.",
      "confirmButton": "Activate Officer",
      "cancelButton": "Cancel",
      "successMessage": "Officer activated successfully.",
      "errorMessage": "Failed to activate officer. Please try again."
    },
    "resetPassword": {
      "confirmTitle": "Reset officer password?",
      "confirmDescription": "A password reset email will be sent to {officerEmail}. The officer's current password will be invalidated immediately. This action is logged.",
      "confirmButton": "Send Reset Email",
      "cancelButton": "Cancel",
      "successMessage": "Password reset email sent successfully.",
      "errorMessage": "Failed to send password reset. Please try again."
    }
  }
}
```

## 10.2 `messages/am/personnel.json` — Full Amharic Equivalent

Every key in `en/personnel.json` must appear with the identical key path:

```json
{
  "persons": {
    "pageTitle": "ሰዎች",
    "list": {
      "heading": "ሰዎች",
      "entityCount": "{count} ሰው(ዎች)",
      "addPersonButton": "ሰው ጨምር",
      "filters": {
        "search": "በስም ወይም ፓስፖርት ፈልግ...",
        "roles": "ሚና",
        "riskLevel": "የስጋት ደረጃ",
        "protectedWitness": "የተጠበቁ ምስክሮች ብቻ",
        "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
      },
      "loading": "ሰዎችን እየጫነ ነው...",
      "empty": {
        "title": "ምንም ሰዎች አልተገኙም",
        "description": "ምንም የሰው መዝገቦች ገና አልተፈጠሩም።",
        "cta": "ከላይ ያለውን አዝራር በመጠቀም የመጀመሪያ ሰው ያስፈልጋሉ።"
      },
      "emptyFiltered": "ምንም ሰዎች ከማጣሪያዎ ጋር አይዛመዱም።",
      "columns": {
        "name": "ስም",
        "nationalId": "ብሔራዊ መታወቂያ",
        "roles": "ሚናዎች",
        "riskLevel": "ስጋት",
        "protected": "ጥበቃ",
        "createdAt": "ቀን",
        "actions": "ድርጊቶች"
      },
      "protectedYes": "ጥበቃ ስር",
      "rowActions": {
        "view": "ዝርዝሮች ተመልከት"
      }
    },
    "detail": {
      "breadcrumb": "ሰዎች",
      "identityCard": {
        "title": "ማንነት",
        "firstName": "የመጀመሪያ ስም",
        "lastName": "የአባት ስም",
        "gender": "ፆታ",
        "nationalId": "ብሔራዊ መታወቂያ",
        "dateOfBirth": "የትውልድ ቀን",
        "phone": "ስልክ",
        "address": "አድራሻ",
        "noAddress": "አልተመዘገበም",
        "createdAt": "መዝገብ ቀን",
        "updatedAt": "መጨረሻ ዝማኔ"
      },
      "pii": {
        "masked": "ለግላዊነት ተደብቋል",
        "revealButton": "አሳይ",
        "hideButton": "ደብቅ",
        "dobYearOnly": "ለሚናዎ ዓመቱ ብቻ ይታያል",
        "revealAuditNotice": "ይህን መስክ ማሳየት በኦዲት ዱካ ይመዘገባል።"
      },
      "rolesSection": {
        "title": "ሚናዎች እና መገለጫዎች",
        "noRoles": "ምንም ሚናዎች ገና አልተሰጡም።",
        "noRolesDescription": "ይህ ሰው ለምርመራ ሚና ገና አልተጣበቀም።",
        "promoteSection": "ሚናዎች ሰጥ",
        "promoteHint": "ይህን ሰው ለምርመራ ሚና ለመሰጠት ከታች ያሉ አዝራሮች ይጠቀሙ። እያንዳንዱ ሚና ቋሚ ነው።"
      },
      "suspectCard": {
        "title": "የተጠርጣሪ መገለጫ",
        "riskLevel": "የስጋት ደረጃ",
        "notes": "ማስታወሻ",
        "noNotes": "ምንም ማስታወሻ የለም።",
        "promotedAt": "ተሰጥቷል",
        "promotedBy": "በ"
      },
      "victimCard": {
        "title": "የሰለባ መገለጫ",
        "notes": "ማስታወሻ",
        "noNotes": "ምንም ማስታወሻ የለም።",
        "promotedAt": "ተሰጥቷል",
        "promotedBy": "በ"
      },
      "witnessCard": {
        "title": "የምስክር መገለጫ",
        "credibilityNotes": "የአስተማማኝነት ማስታወሻ",
        "noNotes": "ምንም ማስታወሻ የለም።",
        "isProtected": "ጥበቃ ስር",
        "protectionLevel": "የጥበቃ ደረጃ",
        "notProtected": "ምንም ጥበቃ የለም",
        "promotedAt": "ተሰጥቷል",
        "promotedBy": "በ"
      },
      "casesSection": {
        "title": "ተያያዥ ጉዳዮች",
        "entityCount": "{count} ጉዳይ(ዎች)",
        "loading": "ጉዳዮችን እየጫነ ነው...",
        "empty": "ይህ ሰው ከምንም ጉዳዮች ጋር አልተጣበቀም።",
        "columns": {
          "caseNumber": "ጉዳይ ቁ.",
          "title": "ርዕስ",
          "roleOnCase": "ሚና",
          "caseStatus": "ሁኔታ",
          "createdAt": "ጀምሮ"
        }
      },
      "actions": {
        "promoteToSuspect": "ተጠርጣሪ አድርግ",
        "promoteToVictim": "ሰለባ አድርግ",
        "promoteToWitness": "ምስክር አድርግ"
      }
    },
    "riskLevel": {
      "LOW": "ዝቅተኛ",
      "MEDIUM": "መካከለኛ",
      "HIGH": "ከፍተኛ"
    },
    "role": {
      "SUSPECT": "ተጠርጣሪ",
      "VICTIM": "ሰለባ",
      "WITNESS": "ምስክር"
    },
    "gender": {
      "MALE": "ወንድ",
      "FEMALE": "ሴት",
      "OTHER": "ሌላ"
    },
    "create": {
      "drawerTitle": "ሰው ጨምር",
      "drawerDescription": "ለስርዓቱ አዲስ የሰው መዝገብ ፍጠር።",
      "section1Title": "መሰረታዊ መረጃ",
      "section2Title": "ግኑኝነት እና ማንነት",
      "firstNameLabel": "የመጀመሪያ ስም",
      "firstNamePlaceholder": "ለምሳሌ አለም",
      "lastNameLabel": "የአባት ስም",
      "lastNamePlaceholder": "ለምሳሌ ታደሰ",
      "genderLabel": "ፆታ (አማራጭ)",
      "nationalIdLabel": "ብሔራዊ መታወቂያ (አማራጭ)",
      "nationalIdPlaceholder": "ለምሳሌ ETH-1234567890",
      "nationalIdHint": "ይህ መስክ እንደ ሚስጥራዊ ፒአይአይ ይቆጠራል።",
      "dateOfBirthLabel": "የትውልድ ቀን (አማራጭ)",
      "phoneLabel": "ስልክ ቁጥር (አማራጭ)",
      "phonePlaceholder": "ለምሳሌ +251 91 234 5678",
      "addressLabel": "አድራሻ (አማራጭ)",
      "addressPlaceholder": "ለምሳሌ ቦሌ ክፍለ ከተማ፣ አዲስ አበባ",
      "submitButton": "ሰው ጨምር",
      "cancelButton": "ሰርዝ",
      "successMessage": "የሰው መዝገብ በተሳካ ሁኔታ ተፈጥሯል።",
      "errorMessage": "የሰው መዝገብ ለመፍጠር አልተሳካም። እንደገና ይሞክሩ።"
    },
    "promoteToSuspect": {
      "drawerTitle": "ተጠርጣሪ አድርግ",
      "drawerDescription": "ይህን ሰው ለምርመራ ተጠርጣሪ ሆኖ ያጣምሩ። ይህ ሚና ቋሚ ነው።",
      "permanenceNotice": "አንድ ሰው ተጠርጣሪ ሆኖ ከተሰጠ፣ ከUI ሊቀለበስ አይችልም። ስህተት ከሆነ አስተዳዳሪን ያነጋግሩ።",
      "section1Title": "የተጠርጣሪ ዝርዝሮች",
      "riskLevelLabel": "የስጋት ደረጃ",
      "riskLevelHint": "ከሚገኝ መረጃ ስጋቱን ይገምቱ።",
      "notesLabel": "ማስታወሻ (አማራጭ)",
      "notesPlaceholder": "ስለ ተጠርጣሪ ሚናው ማናቸውም ማስታወሻዎች...",
      "submitButton": "አረጋግጥ — ተጠርጣሪ አድርግ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ሰው ተጠርጣሪ ሆኖ ተሰጥቷል።",
      "errorMessage": "ተጠርጣሪ ለማድረግ አልተሳካም። እንደገና ይሞክሩ።"
    },
    "promoteToVictim": {
      "drawerTitle": "ሰለባ አድርግ",
      "drawerDescription": "ይህን ሰው ለምርመራ ሰለባ ሆኖ ያጣምሩ። ይህ ሚና ቋሚ ነው።",
      "permanenceNotice": "አንድ ሰው ሰለባ ሆኖ ከተሰጠ፣ ከUI ሊቀለበስ አይችልም።",
      "section1Title": "የሰለባ ዝርዝሮች",
      "notesLabel": "ማስታወሻ (አማራጭ)",
      "notesPlaceholder": "ስለ ሰለባ ሚናው ማናቸውም ማስታወሻዎች...",
      "submitButton": "አረጋግጥ — ሰለባ አድርግ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ሰው ሰለባ ሆኖ ተሰጥቷል።",
      "errorMessage": "ሰለባ ለማድረግ አልተሳካም። እንደገና ይሞክሩ።"
    },
    "promoteToWitness": {
      "drawerTitle": "ምስክር አድርግ",
      "drawerDescription": "ይህን ሰው ለምርመራ ምስክር ሆኖ ያጣምሩ። ይህ ሚና ቋሚ ነው።",
      "permanenceNotice": "አንድ ሰው ምስክር ሆኖ ከተሰጠ፣ ከUI ሊቀለበስ አይችልም።",
      "section1Title": "የምስክር ዝርዝሮች",
      "section2Title": "የምስክር ጥበቃ",
      "credibilityNotesLabel": "የአስተማማኝነት ማስታወሻ (አማራጭ)",
      "credibilityNotesPlaceholder": "ስለ ምስክሩ አስተማማኝነት ማስታወሻዎች...",
      "isProtectedLabel": "ጥበቃ ስር",
      "protectionLevelLabel": "የጥበቃ ደረጃ",
      "protectionLevelPlaceholder": "ለምሳሌ STANDARD፣ HIGH",
      "protectionLevelHint": "ጥበቃ ሲበቃ ያስፈልጋል።",
      "protectedBadge": "የተጠበቀ ምስክር",
      "submitButton": "አረጋግጥ — ምስክር አድርግ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ሰው ምስክር ሆኖ ተሰጥቷል።",
      "errorMessage": "ምስክር ለማድረግ አልተሳካም። እንደገና ይሞክሩ።"
    }
  },
  "officers": {
    "pageTitle": "ፖሊሶች",
    "list": {
      "heading": "ፖሊሶች",
      "entityCount": "{count} ፖሊስ(ዎች)",
      "addOfficerButton": "ፖሊስ ጨምር",
      "filters": {
        "search": "በባጅ ቁጥር ወይም ስም ፈልግ...",
        "status": "ሁኔታ",
        "role": "ሚና",
        "department": "ክፍል",
        "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
      },
      "loading": "ፖሊሶችን እየጫነ ነው...",
      "empty": {
        "title": "ምንም ፖሊሶች አልተገኙም",
        "description": "ምንም የፖሊስ መለያዎች በዚህ ወሰን ውስጥ የሉም።"
      },
      "emptyFiltered": "ምንም ፖሊሶች ከማጣሪያዎ ጋር አይዛመዱም።",
      "columns": {
        "badgeNumber": "ባጅ",
        "name": "ስም",
        "role": "ሚና",
        "department": "ክፍል",
        "status": "ሁኔታ",
        "lastActivity": "መጨረሻ ንቁ",
        "actions": "ድርጊቶች"
      },
      "lastActivityNever": "ፈጽሞ አይደለም",
      "rowActions": {
        "view": "ዝርዝሮች ተመልከት",
        "activate": "ንቁ አድርግ",
        "deactivate": "አቁም",
        "resetPassword": "የይለፍ ቃል ዳግም አስጀምር"
      }
    },
    "detail": {
      "breadcrumb": "ፖሊሶች",
      "identityCard": {
        "title": "የፖሊስ ማንነት",
        "badgeNumber": "ባጅ ቁጥር",
        "firstName": "የመጀመሪያ ስም",
        "lastName": "የአባት ስም",
        "email": "ኢሜይል",
        "phone": "ስልክ",
        "noPhone": "አልተመዘገበም",
        "role": "ሚና",
        "department": "ክፍል",
        "status": "ሁኔታ",
        "lastActivity": "መጨረሻ ንቁ",
        "lastActivityNever": "ፈጽሞ አይደለም",
        "activeCases": "ንቁ ጉዳዮች",
        "totalCases": "ጠቅላላ ጉዳዮች",
        "createdAt": "መለያ ተፈጥሯል"
      },
      "casesSection": {
        "title": "ቅርብ ጊዜ የተሰጡ ጉዳዮች",
        "loading": "ጉዳዮችን እየጫነ ነው...",
        "empty": "ለዚህ ፖሊስ ምንም ጉዳዮች አልተሰጡም።",
        "viewAll": "ሁሉም ጉዳዮች ተመልከት",
        "columns": {
          "caseNumber": "ጉዳይ ቁ.",
          "title": "ርዕስ",
          "status": "ሁኔታ",
          "assignedAt": "ተሰጥቷል"
        }
      },
      "actions": {
        "deactivate": "ፖሊስ አቁም",
        "activate": "ፖሊስ ንቁ አድርግ",
        "resetPassword": "የይለፍ ቃል ዳግም አስጀምር"
      }
    },
    "officerRole": {
      "INVESTIGATOR": "መርማሪ",
      "FORENSIC": "ፎረንሲክ ፖሊስ",
      "LEGAL_OFFICER": "ሕጋዊ ባለሙያ",
      "DEPT_HEAD": "የክፍል ኃላፊ",
      "ADMIN": "አስተዳዳሪ",
      "SUPERADMIN": "ከፍተኛ አስተዳዳሪ"
    },
    "officerStatus": {
      "ACTIVE": "ንቁ",
      "INACTIVE": "ንቁ ያይደለ"
    },
    "create": {
      "drawerTitle": "ፖሊስ ጨምር",
      "drawerDescription": "አዲስ የፖሊስ መለያ ፍጠር። ፖሊሱ የይለፍ ቃል ለማስቀናት ኢሜይል ይቀበላል።",
      "section1Title": "ማንነት",
      "section2Title": "የመለያ ዝርዝሮች",
      "badgeNumberLabel": "ባጅ ቁጥር",
      "badgeNumberPlaceholder": "ለምሳሌ BD-00142",
      "badgeNumberHint": "ልዩ መሆን አለበት። ትልቁ ፊደሎች፣ ቁጥሮች፣ እና ሰረዞች ብቻ።",
      "firstNameLabel": "የመጀመሪያ ስም",
      "firstNamePlaceholder": "ለምሳሌ ሳራ",
      "lastNameLabel": "የአባት ስም",
      "lastNamePlaceholder": "ለምሳሌ ሃይሌ",
      "emailLabel": "ኢሜይል አድራሻ",
      "emailPlaceholder": "ለምሳሌ sara.haile@police.gov.et",
      "phoneLabel": "ስልክ ቁጥር (አማራጭ)",
      "phonePlaceholder": "ለምሳሌ +251 91 234 5678",
      "roleLabel": "የፖሊስ ሚና",
      "departmentLabel": "ክፍል",
      "departmentPlaceholder": "ክፍል ምረጥ...",
      "submitButton": "የፖሊስ መለያ ፍጠር",
      "cancelButton": "ሰርዝ",
      "successMessage": "የፖሊስ መለያ ተፈጥሯል። ለመግቢያ መመሪያዎች ኢሜይል ተልኳል።",
      "errorMessage": "የፖሊስ መለያ ለመፍጠር አልተሳካም። እንደገና ይሞክሩ።"
    },
    "deactivate": {
      "confirmTitle": "ፖሊሱን ያቁሙ?",
      "confirmDescription": "ፖሊስ {badgeNumber} — {officerName} ይቆማል እና ከእንግዲህ ወዲህ መግባት አይችልም። ሁሉም ንቁ ክፍለ ጊዜዎች ይዘጋሉ።",
      "confirmButton": "ፖሊስ አቁም",
      "cancelButton": "ሰርዝ",
      "successMessage": "ፖሊስ በተሳካ ሁኔታ ቆሟል።",
      "errorMessage": "ፖሊሱን ለማቆም አልተሳካም። እንደገና ይሞክሩ።"
    },
    "activate": {
      "confirmTitle": "ፖሊሱን ያንቁ?",
      "confirmDescription": "ፖሊስ {badgeNumber} — {officerName} እንደገና ንቁ ይሆናል እና ወደ ስርዓቱ መግባት ይችላል።",
      "confirmButton": "ፖሊስ ንቁ አድርግ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ፖሊስ በተሳካ ሁኔታ ንቁ ሆኗል።",
      "errorMessage": "ፖሊሱን ለማንቃት አልተሳካም። እንደገና ይሞክሩ።"
    },
    "resetPassword": {
      "confirmTitle": "የፖሊስ የይለፍ ቃል ዳግም ያስጀምሩ?",
      "confirmDescription": "ለ {officerEmail} የይለፍ ቃል ዳግም የማስጀመሪያ ኢሜይል ይላካል። የፖሊሱ አሁናዊ የይለፍ ቃል ወዲያውኑ ይሰረዛል።",
      "confirmButton": "ዳግም ማስጀመሪያ ኢሜይል ላክ",
      "cancelButton": "ሰርዝ",
      "successMessage": "የይለፍ ቃል ዳግም ኢሜይል በተሳካ ሁኔታ ተልኳል።",
      "errorMessage": "የይለፍ ቃል ዳግም ለማስጀመር አልተሳካም። እንደገና ይሞክሩ።"
    }
  }
}
```

---

# 11. Route Pages

## 11.1 `src/app/(dashboard)/personnel/persons/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { PersonsList } from '@features/personnel/components/persons/PersonsList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('persons.pageTitle') }
}

export default function PersonsPage() {
  return <PersonsList />
}
```

## 11.2 `src/app/(dashboard)/personnel/persons/[personId]/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { PersonDetail } from '@features/personnel/components/persons/PersonDetail'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('persons.pageTitle') }
}

export default function PersonDetailPage({
  params,
}: {
  params: { personId: string }
}) {
  return <PersonDetail personId={params.personId} />
}
```

## 11.3 `src/app/(dashboard)/personnel/officers/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { OfficersList } from '@features/personnel/components/officers/OfficersList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('officers.pageTitle') }
}

export default function OfficersPage() {
  return <OfficersList />
}
```

## 11.4 `src/app/(dashboard)/personnel/officers/[officerId]/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { OfficerDetail } from '@features/personnel/components/officers/OfficerDetail'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('officers.pageTitle') }
}

export default function OfficerDetailPage({
  params,
}: {
  params: { officerId: string }
}) {
  return <OfficerDetail officerId={params.officerId} />
}
```

---

# 12. UI Implementation — PersonsList

## 12.1 `PersonsList.tsx`

Client Component. Manages URL-driven filter state.

### 12.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  roles: parseAsArrayOf(parseAsString).withDefault([]),
  riskLevel: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('lastName'),
  sortDirection: parseAsString.withDefault('asc'),
})
```

### 12.1.2 PageHeader

```tsx
<PageHeader
  title={t('persons.list.heading')}
  description={`${data?.total ?? 0} ${t('persons.list.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('persons.list.addPersonButton')}
      </Button>
    </PermissionGuard>
  }
/>
```

### 12.1.3 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `name` | `firstName lastName` as a link to detail page | Yes | 160px |
| `nationalIdMasked` | Masked value (`***-***-1234`), or `—` if null | No | 130px |
| `roles` | Row of role badges using `PERSON_ROLE_VARIANTS` | No | 180px |
| `riskLevel` | `StatusBadge` using `RISK_LEVEL_VARIANTS`; `—` if null | Yes | 100px |
| `isProtectedWitness` | `accent` badge "Protected" when true; empty when false | No | 110px |
| `createdAt` | `dd MMM yyyy` | Yes | 100px |
| `actions` | Kebab menu | No | 48px |

**Row click behaviour:** Clicking the name link or anywhere on the row navigates to `/personnel/persons/[personId]`.

**Kebab actions:**
- `t('persons.list.rowActions.view')` → `router.push(\`/personnel/persons/${row.id}\`)`

**Role badges:** Each role in `person.roles` renders as a small badge. Multiple roles stack horizontally. Order: SUSPECT, VICTIM, WITNESS.

### 12.1.4 Active filter chips

Chips appear below the filter bar. Each chip: `Role: Suspect ×`, `Risk: High ×`. The `×` removes that specific filter value. A "Clear all filters" link appears when any filter is active.

---

# 13. UI Implementation — PersonDetail

## 13.1 `PersonDetail.tsx`

Client Component. Orchestration wrapper for the person detail page. **This is a single-column full page — not a tabbed layout.**

### 13.1.1 Drawer state

```typescript
const [promoteToSuspectOpen, setPromoteToSuspectOpen] = useState(false)
const [promoteToVictimOpen, setPromoteToVictimOpen] = useState(false)
const [promoteToWitnessOpen, setPromoteToWitnessOpen] = useState(false)
```

### 13.1.2 Data

```typescript
const { data: person, isLoading, isError } = usePersonDetail(personId)
```

### 13.1.3 Page layout

```
PersonDetail (single column)
──────────────────────────────────────────────────────────────────────
PageHeader
  Breadcrumb: Persons > [Full Name]
  Title: [Full Name]
  Actions: [Promote to ▼] dropdown (PermissionGuard: PERSONNEL_MANAGE)
             Options: Add as Suspect (if not already), Add as Victim, Add as Witness
──────────────────────────────────────────────────────────────────────

[isLoading] → Full-page skeleton matching the below layout

<PersonIdentityCard person={person} />    (§13.2)

<PersonRoleCards person={person}          (§13.3)
  onPromoteSuspect={...}
  onPromoteVictim={...}
  onPromoteWitness={...}
/>

<PersonCasesTable personId={person.id} /> (§13.4)

<!-- Drawers (always mounted, open/close controlled) -->
<PromoteToSuspectDrawer open={...} personId={...} onClose={...} />
<PromoteToVictimDrawer open={...} personId={...} onClose={...} />
<PromoteToWitnessDrawer open={...} personId={...} onClose={...} />
```

### 13.1.4 Promote dropdown menu

The "Promote to" action in the PageHeader renders as a `DropdownMenu` (not individual buttons):

```tsx
<PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        {t('persons.detail.actions.promoteSection')} <ChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {!hasRole(person.roles, PersonRole.SUSPECT) && (
        <DropdownMenuItem onClick={() => setPromoteToSuspectOpen(true)}>
          <UserX className="mr-2 h-4 w-4" />
          {t('persons.detail.actions.promoteToSuspect')}
        </DropdownMenuItem>
      )}
      {!hasRole(person.roles, PersonRole.VICTIM) && (
        <DropdownMenuItem onClick={() => setPromoteToVictimOpen(true)}>
          <Heart className="mr-2 h-4 w-4" />
          {t('persons.detail.actions.promoteToVictim')}
        </DropdownMenuItem>
      )}
      {!hasRole(person.roles, PersonRole.WITNESS) && (
        <DropdownMenuItem onClick={() => setPromoteToWitnessOpen(true)}>
          <Eye className="mr-2 h-4 w-4" />
          {t('persons.detail.actions.promoteToWitness')}
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
</PermissionGuard>
```

If all three roles are assigned, hide the dropdown entirely (all options would be filtered out).

---

# 14. UI Implementation — PersonIdentityCard

## 14.1 `PersonIdentityCard.tsx`

Client Component. Receives the full `Person` object.

### 14.1.1 Layout

```
PersonIdentityCard
──────────────────────────────────────────────────────────────
  Identity
──────────────────────────────────────────────────────────────
 ┌── Two-column metadata grid ──────────────────────────────┐
 │  First Name      Alem          │  Gender        Male     │
 │  Last Name       Tadesse       │  Risk Level    [High]   │
 │                                                           │
 │  National ID     [SensitiveField: ***-***-1234] [Reveal] │
 │  Date of Birth   [SensitiveField: 1988 (year only)]      │
 │  Phone           [SensitiveField: +251 *** *** 789]      │
 │                                                           │
 │  Address         Bole Sub-City, Addis Ababa              │
 │                  (or "Not recorded" in muted)            │
 │                                                           │
 │  Record Created  14 Jan 2026    Last Updated  20 Jun 2026│
 └───────────────────────────────────────────────────────────┘
```

### 14.1.2 PII field rendering with `SensitiveField`

Use the existing `SensitiveField` shared component from `shared/components/display/SensitiveField.tsx`. Do not rebuild it.

```tsx
<SensitiveField
  label={t('persons.detail.identityCard.nationalId')}
  maskedValue={person.pii.nationalId ?? '—'}
  fullValue={person.pii.nationalId}   // Same field — backend returns appropriate value
  canReveal={hasPermission(Permission.PII_REVEAL)}
  onReveal={() => logPIIRevealEvent(person.id, 'nationalId')}
/>
```

The `SensitiveField` component already handles the toggle between masked and revealed states using local component state. The `onReveal` callback fires `logPIIRevealEvent` — a fire-and-forget POST to log the access. Implement this function as:

```typescript
// In PersonIdentityCard.tsx — not a hook, just a fire-and-forget call
function logPIIRevealEvent(personId: string, field: string): void {
  // Non-blocking audit call — do not await, do not show error to user
  void apiClient
    .post(`/api/v1/personnel/persons/${personId}/pii-access`, { field })
    .catch(() => {
      // Silent fail — audit failure must not block the reveal UX
    })
}
```

### 14.1.3 Risk level display

Risk level is shown only if `person.riskLevel !== null` (i.e., the person is a suspect). Use `RISK_LEVEL_VARIANTS` from `personnelUtils.ts`. If `riskLevel === null`, render `—` in muted text.

---

# 15. UI Implementation — PersonRoleCards

## 15.1 `PersonRoleCards.tsx`

Client Component. Receives the full `Person` object and promotion callbacks.

### 15.1.1 Section structure

```
PersonRoleCards
──────────────────────────────────────────────────────────────
  Roles & Profiles
──────────────────────────────────────────────────────────────

[Rendered only if person.suspectProfile exists]
┌── Suspect Profile ───────────────────────────────────────────┐
│  [Warning badge: Suspect]                                   │
│  Risk Level: [High badge]                                   │
│  Notes: ...or "No notes."                                   │
│  Designated: 14 Jan 2026  By: Insp. Sara Haile (BD-082)    │
└──────────────────────────────────────────────────────────────┘

[Rendered only if person.victimProfile exists]
┌── Victim Profile ────────────────────────────────────────────┐
│  [Muted badge: Victim]                                      │
│  Notes: ...or "No notes."                                   │
│  Designated: 14 Jan 2026  By: Insp. Dawit Bekele (BD-091)  │
└──────────────────────────────────────────────────────────────┘

[Rendered only if person.witnessProfile exists]
┌── Witness Profile ───────────────────────────────────────────┐
│  [Primary badge: Witness]  [Accent badge: Protected Witness]│
│  Protection Level: HIGH                                     │
│  Credibility Notes: ...or "No notes."                       │
│  Designated: 14 Jan 2026  By: Insp. Sara Haile (BD-082)    │
└──────────────────────────────────────────────────────────────┘

[If NO roles at all]
┌── No Roles ──────────────────────────────────────────────────┐
│  [User icon, muted]                                         │
│  No roles assigned yet.                                     │
│  This person has not been linked to any investigation roles.│
└──────────────────────────────────────────────────────────────┘
```

Each role card is a `MetadataCard` wrapper from `shared/components/display/MetadataCard.tsx`. Each field uses the same two-column metadata grid as `PersonIdentityCard`.

The `Protected Witness` badge (`accent` variant) renders next to the "Witness" badge only when `witnessProfile.isProtected === true`.

---

# 16. UI Implementation — PersonCasesTable

## 16.1 `PersonCasesTable.tsx`

Client Component. Shows cases this person is linked to.

### 16.1.1 Data fetching

```typescript
const { data, isLoading, isError } = usePersonCases(personId, { page, pageSize: 10 })
```

### 16.1.2 Layout

```
PersonCasesTable
──────────────────────────────────────────────────────────────
  Associated Cases                              3 case(s)
──────────────────────────────────────────────────────────────
 DataTable (compact mode, 40px rows):
   Case No. | Title              | Role    | Status | Since
   0042      | Robbery at Bole..  | Suspect | Open   | Jan 2026
   0038      | Assault at...      | Witness | Closed | Nov 2025
──────────────────────────────────────────────────────────────
```

Use `SectionHeader` (not `PageHeader`). Use the DataTable in compact mode (`40px rows`).

**Column definitions:**

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `caseNumber` | Monospace `xs`, link to `/cases/[caseId]` | No | 90px |
| `title` | Truncated to 40 chars | No | 180px |
| `roleOnCase` | Role badge using `PERSON_ROLE_VARIANTS` | No | 100px |
| `caseStatus` | StatusBadge using existing case status variants | No | 100px |
| `createdAt` | `dd MMM yyyy` | No | 90px |

**Row click:** Navigates to `/cases/[caseId]`.

**Empty state:** Muted text: `t('persons.detail.casesSection.empty')`. No CTA.

---

# 17. UI Implementation — Role Promotion Drawers

## 17.1 `PromoteToSuspectDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 17.1.1 Layout

```
PromoteToSuspectDrawer (480px)
──────────────────────────────────────────────
  Add as Suspect
  Link this person to the investigation as a suspect. This assignment is permanent.
──────────────────────────────────────────────
 ┌── Permanence Notice Bar ─────────────────────┐
 │  ⚠  Once a person is designated as a Suspect, │
 │     this cannot be undone from the UI.        │
 └───────────────────────────────────────────────┘

 ┌── Section 1: Suspect Details ────────────────┐
 │  Risk Level *      [Select]                  │
 │    Options: Low | Medium | High              │
 │    (render each with its badge variant)      │
 │                                              │
 │  Notes             [Textarea, optional]      │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]              [Confirm — Add as Suspect]
```

The permanence notice bar uses the same amber style as the conviction notice bar in Phase 6 (`background: rgba(245, 158, 11, 0.08)`, `border: 1px solid var(--color-warning)`).

On submit: calls `usePromoteToSuspect(personId)`. On success: drawer closes, `PersonDetail` refreshes (the suspect profile card appears), toast confirms.

No dirty state guard on close — the form is short and the permanence notice already contextualises the gravity of the action.

## 17.2 `PromoteToVictimDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

```
PromoteToVictimDrawer (480px)
──────────────────────────────────────────────
  Add as Victim
  ...
──────────────────────────────────────────────
 [Permanence Notice Bar]

 ┌── Victim Details ────────────────────────────┐
 │  Notes             [Textarea, optional]      │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]               [Confirm — Add as Victim]
```

Uses `usePromoteToVictim(personId)`.

## 17.3 `PromoteToWitnessDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

```
PromoteToWitnessDrawer (480px)
──────────────────────────────────────────────
  Add as Witness
  ...
──────────────────────────────────────────────
 [Permanence Notice Bar]

 ┌── Section 1: Witness Details ────────────────┐
 │  Credibility Notes  [Textarea, optional]     │
 └──────────────────────────────────────────────┘

 ┌── Section 2: Witness Protection ─────────────┐
 │  Under Protection?  [Switch toggle]          │
 │                                              │
 │  Protection Level   [Input, conditional]     │
 │  (appears when toggle is ON)                 │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]              [Confirm — Add as Witness]
```

When `isProtected === true`, animate the Protection Level input into view using `max-height` expand (150ms ease-out). When toggled off, collapse and clear the value.

Uses `usePromoteToWitness(personId)`.

---

# 18. UI Implementation — CreatePersonDrawer

## 18.1 `CreatePersonDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

```
CreatePersonDrawer (480px)
──────────────────────────────────────────────
  Add Person
  Create a new person record in the system.
──────────────────────────────────────────────
 ┌── Section 1: Basic Information ──────────────┐
 │  First Name *      [Input]                   │
 │  Last Name *       [Input]                   │
 │  Gender            [Select, optional]        │
 └──────────────────────────────────────────────┘

 ┌── Section 2: Contact & Identity ─────────────┐
 │  National ID       [Input, optional]         │
 │  (PII hint below field)                      │
 │  Date of Birth     [DatePicker, optional]    │
 │  Phone             [Input, optional]         │
 │  Address           [Input, optional]         │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                          [Add Person]
```

On success: drawer closes, persons list refreshes, toast confirms.

Dirty state guard: if `formState.isDirty` and officer closes, show `ConfirmDialog`: "Discard person record? Your unsaved data will be lost."

---

# 19. UI Implementation — OfficersList

## 19.1 `OfficersList.tsx`

Client Component. Manages URL-driven filter state.

### 19.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  role: parseAsArrayOf(parseAsString).withDefault([]),
  departmentId: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('badgeNumber'),
  sortDirection: parseAsString.withDefault('asc'),
})
```

### 19.1.2 PageHeader

```tsx
<PageHeader
  title={t('officers.list.heading')}
  description={`${data?.total ?? 0} ${t('officers.list.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.OFFICERS_MANAGE}>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('officers.list.addOfficerButton')}
      </Button>
    </PermissionGuard>
  }
/>
```

### 19.1.3 Department filter visibility

The Department filter dropdown is visible only to `admin+` roles:

```tsx
<PermissionGuard permission={Permission.OFFICERS_MANAGE}>
  <DepartmentSelect
    value={filters.departmentId}
    onChange={(val) => setFilters({ departmentId: val, page: 1 })}
    placeholder={t('officers.list.filters.department')}
  />
</PermissionGuard>
```

For `dept_head`, the backend already scopes the officer list to their department. No department filter is rendered for `dept_head`.

### 19.1.4 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `badgeNumber` | Monospace `xs` | Yes | 90px |
| `name` | `firstName lastName` | Yes | 160px |
| `role` | `StatusBadge` using `OFFICER_ROLE_VARIANTS` | No | 140px |
| `departmentName` | Plain text | No | 150px |
| `status` | `StatusBadge` using `OFFICER_STATUS_VARIANTS` | Yes | 100px |
| `lastActivityAt` | Relative time (`formatDistanceToNow`) or `t('officers.list.lastActivityNever')`; **rendered only for `admin+`** | Yes | 120px |
| `actions` | Kebab menu | No | 48px |

**Row click:** Navigates to `/personnel/officers/[officerId]`.

**Kebab actions** (permission-guarded):
- `t('officers.list.rowActions.view')` → navigate to detail (all roles)
- Separator
- `t('officers.list.rowActions.activate')` — shown only when `officer.status === INACTIVE`; guarded by `OFFICERS_MANAGE`
- `t('officers.list.rowActions.deactivate')` — shown only when `officer.status === ACTIVE`; guarded by `OFFICERS_MANAGE`; destructive label (red)
- `t('officers.list.rowActions.resetPassword')` — always shown; guarded by `OFFICERS_MANAGE`

**Active officer row:** render with no special styling.
**Inactive officer row:** render with `opacity-60` to visually indicate inactivity. The status badge is `muted` variant.

---

# 20. UI Implementation — OfficerDetail

## 20.1 `OfficerDetail.tsx`

Client Component. Orchestration wrapper for the officer detail page. **Single-column layout — not tabbed.**

### 20.1.1 Drawer/dialog state

```typescript
const [createOpen, setCreateOpen] = useState(false)   // unused here — create is on list page
const [deactivateOpen, setDeactivateOpen] = useState(false)
const [activateOpen, setActivateOpen] = useState(false)
const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
```

### 20.1.2 Page layout

```
OfficerDetail (single column)
──────────────────────────────────────────────────────────────────────
PageHeader
  Breadcrumb: Officers > Officer Name
  Title: [Full Name] (Badge: BD-00142)
  Actions (all PermissionGuard: OFFICERS_MANAGE):
    [Reset Password]          — always shown for admin+
    [Deactivate] (destructive, red)  — shown when ACTIVE
    [Activate]                — shown when INACTIVE
──────────────────────────────────────────────────────────────────────

[isLoading] → Skeleton layout

<OfficerIdentityCard officer={officer} />    (§20.2)

<OfficerCasesSummary officerId={officer.id} /> (§20.3)

<!-- Dialogs -->
<DeactivateOfficerDialog open={deactivateOpen} officer={officer} onClose={...} />
<ActivateOfficerDialog open={activateOpen} officer={officer} onClose={...} />
<ResetPasswordDialog open={resetPasswordOpen} officer={officer} onClose={...} />
```

---

# 21. UI Implementation — OfficerIdentityCard

## 21.1 `OfficerIdentityCard.tsx`

Client Component. Receives the full `Officer` object.

### 21.1.1 Layout

```
OfficerIdentityCard
──────────────────────────────────────────────────────────────
  Officer Identity
──────────────────────────────────────────────────────────────
 ┌── Two-column grid ────────────────────────────────────────┐
 │  Badge Number  BD-00142       │  Status  [Active badge]   │
 │  First Name    Sara           │  Role    [Investigator]   │
 │  Last Name     Haile          │  Dept    Bole Sub-City    │
 │  Email         sara@...       │  Phone   +251 91 234 5678 │
 │                               │          (or "Not recorded")│
 │  Active Cases  3              │  Total Cases  17           │
 │  Last Active   5 minutes ago  │  Account Created  Jan 2026 │
 └───────────────────────────────────────────────────────────┘
```

**`lastActivityAt` visibility:** This field is visible only to `admin+`. For `dept_head`, this cell renders `—`.

```tsx
<PermissionGuard permission={Permission.OFFICERS_MANAGE}>
  <MetadataRow
    label={t('officers.detail.identityCard.lastActivity')}
    value={
      officer.lastActivityAt
        ? formatDistanceToNow(new Date(officer.lastActivityAt), { addSuffix: true })
        : t('officers.detail.identityCard.lastActivityNever')
    }
  />
</PermissionGuard>
```

---

# 22. UI Implementation — OfficerCasesSummary

## 22.1 `OfficerCasesSummary.tsx`

Client Component. Shows the last 10 cases assigned to this officer as a compact list.

### 22.1.1 Layout

```
OfficerCasesSummary
──────────────────────────────────────────────────────────────
  Recent Assigned Cases           17 total
                                  [View all cases →]
──────────────────────────────────────────────────────────────
 DataTable (compact mode):
   Case No. | Title             | Status | Assigned
   0042      | Robbery at Bole   | Open   | 14 Jun 2026
   0038      | Assault at...     | Closed | 12 May 2026
   ...
──────────────────────────────────────────────────────────────
```

The `View all cases →` link navigates to `/cases?assignedOfficerId={officerId}` — passing the officer ID as a filter to the cases list.

No loading skeleton needed on this section (the whole page skeleton covers the initial load). Use a compact inline loading state: a single row of three skeleton cells.

---

# 23. UI Implementation — CreateOfficerDrawer

## 23.1 `CreateOfficerDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Accessible from the officer list page via the "Add Officer" button. Admin+ only (guarded by `PermissionGuard`).

```
CreateOfficerDrawer (480px)
──────────────────────────────────────────────
  Add Officer
  Create a new officer account. The officer will receive an email to set their password.
──────────────────────────────────────────────
 ┌── Section 1: Identity ───────────────────────┐
 │  Badge Number *    [Input]                   │
 │  (hint: uppercase, digits, hyphens only)     │
 │  First Name *      [Input]                   │
 │  Last Name *       [Input]                   │
 │  Phone             [Input, optional]         │
 └──────────────────────────────────────────────┘

 ┌── Section 2: Account Details ────────────────┐
 │  Email *           [Input]                   │
 │  Role *            [Select]                  │
 │  Department *      [SearchableSelect]        │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]               [Create Officer Account]
```

**Department SearchableSelect:** Fetch from `GET /api/v1/departments?pageSize=100` (existing departments service from Phase 1 foundation). Map to `{ value: dept.id, label: dept.name }`.

**Role Select:** All values from `OfficerRole` enum, labelled via `t('officers.officerRole.*')`. Do not include `SUPERADMIN` in the options unless the current user is `superadmin`.

On success: drawer closes, officer list refreshes, toast confirms.

Dirty state guard: if `formState.isDirty`, show unsaved changes `ConfirmDialog` on close.

---

# 24. UI Implementation — Officer Action Dialogs

## 24.1 `DeactivateOfficerDialog.tsx`

Wrapper around `DestructiveConfirmDialog`:

```tsx
<DestructiveConfirmDialog
  open={open}
  onClose={onClose}
  title={t('officers.deactivate.confirmTitle')}
  description={t('officers.deactivate.confirmDescription', {
    badgeNumber: officer.badgeNumber,
    officerName: `${officer.firstName} ${officer.lastName}`,
  })}
  confirmLabel={t('officers.deactivate.confirmButton')}
  cancelLabel={t('officers.deactivate.cancelButton')}
  onConfirm={async () => {
    await deactivateOfficerMutation.mutateAsync()
    onClose()
  }}
  isLoading={deactivateOfficerMutation.isPending}
/>
```

Uses `useDeactivateOfficer(officerId)`. No confirm phrase required — deactivation is significant but not as irreversible as case deletion.

On success: dialog closes, officer detail page refreshes (status badge changes to "Inactive"), toast confirms.

## 24.2 `ActivateOfficerDialog.tsx`

Simple `ConfirmDialog` (non-destructive):

```tsx
<ConfirmDialog
  open={open}
  onClose={onClose}
  title={t('officers.activate.confirmTitle')}
  description={t('officers.activate.confirmDescription', {
    badgeNumber: officer.badgeNumber,
    officerName: `${officer.firstName} ${officer.lastName}`,
  })}
  confirmLabel={t('officers.activate.confirmButton')}
  cancelLabel={t('officers.activate.cancelButton')}
  onConfirm={async () => {
    await activateOfficerMutation.mutateAsync()
    onClose()
  }}
  isLoading={activateOfficerMutation.isPending}
/>
```

## 24.3 `ResetPasswordDialog.tsx`

Simple `ConfirmDialog` (non-destructive, but consequential):

```tsx
<ConfirmDialog
  open={open}
  onClose={onClose}
  title={t('officers.resetPassword.confirmTitle')}
  description={t('officers.resetPassword.confirmDescription', {
    officerEmail: officer.email,
  })}
  confirmLabel={t('officers.resetPassword.confirmButton')}
  cancelLabel={t('officers.resetPassword.cancelButton')}
  onConfirm={async () => {
    await resetPasswordMutation.mutateAsync()
    onClose()
  }}
  isLoading={resetPasswordMutation.isPending}
/>
```

---

# 25. `src/features/personnel/index.ts`

Public barrel export:

```typescript
// Types
export * from './types/personnel.types'

// Hooks
export {
  usePersonList,
  usePersonDetail,
  useCreatePerson,
  usePromoteToSuspect,
  usePromoteToVictim,
  usePromoteToWitness,
  usePersonCases,
  useOfficerList,
  useOfficerDetail,
  useCreateOfficer,
  useActivateOfficer,
  useDeactivateOfficer,
  useResetOfficerPassword,
  useOfficerCases,
} from './hooks'

// Components (export only those consumed outside the module)
export { PersonsList } from './components/persons/PersonsList'
export { PersonDetail } from './components/persons/PersonDetail'
export { OfficersList } from './components/officers/OfficersList'
export { OfficerDetail } from './components/officers/OfficerDetail'

// Utils
export {
  RISK_LEVEL_VARIANTS,
  OFFICER_STATUS_VARIANTS,
  OFFICER_ROLE_VARIANTS,
  PERSON_ROLE_VARIANTS,
  getFullName,
  getOfficerDisplayName,
  hasRole,
  getUnassignedRoles,
} from './utils/personnelUtils'
```

---

# 26. Role-Based Access

## 26.1 Person list and detail access

The person list (`/personnel/persons`) and person detail (`/personnel/persons/[personId]`) require `Permission.PERSONNEL_READ` (dept_head+). The middleware-level route guard from Phase 1 covers this. At the page level, wrap content in `PermissionGuard`:

```tsx
<PermissionGuard
  permission={Permission.PERSONNEL_READ}
  fallback={<ForbiddenState />}
>
  {/* page content */}
</PermissionGuard>
```

## 26.2 PII reveal

The "Reveal" button on `SensitiveField` only renders when `hasPermission(Permission.PII_REVEAL)`. For roles below `admin`, the button is entirely absent — the masked value is rendered without any reveal affordance.

```tsx
<SensitiveField
  canReveal={hasPermission(Permission.PII_REVEAL)}
  ...
/>
```

## 26.3 Officer list scoping

The backend scopes the officer list to the authenticated officer's department for `dept_head`. The frontend does not need to implement this scoping manually — it passes through to the API. However, the Department filter in the filter bar is hidden for `dept_head` (§19.1.3) since it would have no effect.

## 26.4 Admin-only actions on officer detail

The action buttons on the officer detail page header are all wrapped with `PermissionGuard permission={Permission.OFFICERS_MANAGE}`. For `dept_head` and lower roles, the page is viewable but no action buttons render.

---

# 27. Testing Requirements

## 27.1 Unit Tests — `personnelUtils.ts`

Create `src/features/personnel/utils/personnelUtils.test.ts`:

- `hasRole(['SUSPECT', 'VICTIM'], 'SUSPECT')` → `true`
- `hasRole(['SUSPECT', 'VICTIM'], 'WITNESS')` → `false`
- `hasRole([], 'SUSPECT')` → `false`
- `getUnassignedRoles(['SUSPECT'])` → `['VICTIM', 'WITNESS']`
- `getUnassignedRoles(['SUSPECT', 'VICTIM', 'WITNESS'])` → `[]`
- `getUnassignedRoles([])` → `['SUSPECT', 'VICTIM', 'WITNESS']`
- `getFullName('Sara', 'Haile')` → `"Sara Haile"`
- `getOfficerDisplayName('Sara', 'Haile', 'BD-082')` → `"Sara Haile (BD-082)"`
- `RISK_LEVEL_VARIANTS.LOW` → `'success'`
- `RISK_LEVEL_VARIANTS.HIGH` → `'destructive'`
- `OFFICER_STATUS_VARIANTS.ACTIVE` → `'success'`
- `OFFICER_STATUS_VARIANTS.INACTIVE` → `'muted'`

## 27.2 Unit Tests — Zod Schemas

Create `src/features/personnel/schemas/personnel-schemas.test.ts`:

**`createPersonSchema`:**
- Valid payload (firstName + lastName only) → no error
- Missing `firstName` → validation error on `firstName`
- Missing `lastName` → validation error on `lastName`
- Both optional fields absent → valid (all optional fields are truly optional)

**`promoteToSuspectSchema`:**
- `riskLevel: 'HIGH'` → valid
- Missing `riskLevel` → validation error on `riskLevel`
- Invalid `riskLevel: 'CRITICAL'` → validation error

**`promoteToWitnessSchema`:**
- `isProtected: false` → valid without `protectionLevel`
- `isProtected: true` + `protectionLevel: 'HIGH'` → valid
- `isProtected: true` + no `protectionLevel` → validation error on `protectionLevel`
- `isProtected: false` + `protectionLevel: 'HIGH'` → valid (protectionLevel is ignored when not protected)

**`createOfficerSchema`:**
- Valid payload → no error
- `badgeNumber: 'bd-123'` (lowercase) → validation error on `badgeNumber`
- Invalid email → validation error on `email`
- Missing `departmentId` → validation error

## 27.3 Component Tests — PersonsList

Create `src/features/personnel/components/persons/PersonsList.test.tsx`:
- Loading state renders skeleton rows
- Empty state renders when no persons and no filters
- Filtered empty state renders when filters active and no results
- "Add Person" button is visible when `PERSONNEL_MANAGE` permission is present
- "Add Person" button is absent when `PERSONNEL_MANAGE` is absent
- National ID column shows masked value (`***-***-1234`), not full value
- Role badges render for each role in the person's `roles` array
- Risk level badge renders for persons with `riskLevel` set; `—` for null
- "Protected" badge renders only when `isProtectedWitness === true`

## 27.4 Component Tests — PersonRoleCards

Create `src/features/personnel/components/persons/PersonRoleCards.test.tsx`:
- When `suspectProfile` is null: Suspect card is NOT rendered
- When `suspectProfile` is populated: Suspect card renders with correct risk badge
- When `victimProfile` is null: Victim card is NOT rendered
- When `witnessProfile` is null: Witness card is NOT rendered
- When `witnessProfile.isProtected === true`: "Protected Witness" accent badge renders
- When all three profiles are null: "No roles assigned" empty state renders
- Promote dropdown shows only unassigned roles
- Promote dropdown hidden entirely when all three roles are assigned

## 27.5 Component Tests — OfficersList

Create `src/features/personnel/components/officers/OfficersList.test.tsx`:
- "Add Officer" button is visible for `OFFICERS_MANAGE` permission
- "Add Officer" button is absent for lower roles
- Department filter is visible for `OFFICERS_MANAGE` and absent for `dept_head`
- Inactive officer rows render with `opacity-60`
- Kebab for active officer shows "Deactivate", not "Activate"
- Kebab for inactive officer shows "Activate", not "Deactivate"
- `lastActivityAt` column renders only for `OFFICERS_MANAGE` permission

## 27.6 i18n Completeness

Extend the existing i18n completeness test to cover the `personnel` namespace. All keys in `en/personnel.json` must have corresponding keys in `am/personnel.json`. Test runner: `pnpm test`.

---

# 28. Anti-Pattern Reference

The following patterns are strictly forbidden.

**PII masking violations:**
- Rendering the `pii.nationalId` raw value anywhere other than inside a `SensitiveField` component — the field must always be wrapped
- Showing the "Reveal" button for roles below `Permission.PII_REVEAL` — the button must be absent, not disabled
- Skipping the `logPIIRevealEvent` call when the reveal button is clicked — the audit trail is mandatory
- Allowing the `logPIIRevealEvent` error to surface to the user — it must fail silently
- Displaying the full national ID or DOB in the persons LIST view — the list always uses `nationalIdMasked` (the pre-masked field)

**Role promotion violations:**
- Showing "Add as Suspect" in the promote dropdown when `person.roles` already includes `SUSPECT` — check `hasRole()` first
- Omitting the permanence notice bar from any promotion drawer — officers must be clearly warned
- Creating a "Remove role" or "De-promote" button — de-promotion is backend-only in this phase
- Calling a promotion mutation without the permanence notice being visually present in the drawer

**Officer access violations:**
- Rendering the `lastActivityAt` field for roles below `OFFICERS_MANAGE` — this field is admin-only
- Showing the Department filter dropdown to `dept_head` — their list is already scoped by the backend; the filter is hidden
- Allowing `dept_head` to see the "Add Officer" button — officer creation is `OFFICERS_MANAGE` (admin+) only

**Optimistic update violations:**
- Adding optimistic updates for `useDeactivateOfficer` — the blueprint explicitly prohibits optimistic updates for officer deactivation. It is a security-sensitive action that must be confirmed by the server.
- Adding optimistic updates for `useActivateOfficer` — same rule
- Adding optimistic updates for role promotion mutations — promotions are permanent and must be server-confirmed

**Query invalidation violations:**
- Not invalidating `personnelKeys.person(personId)` after a role promotion — the role card for the new role will not appear
- Not invalidating `personnelKeys.personList()` after a role promotion — the roles column in the list will show stale data
- Not invalidating `personnelKeys.officer(officerId)` after `useDeactivateOfficer` or `useActivateOfficer` — the status badge on the detail page will remain stale
- Not invalidating `personnelKeys.officerList()` after officer status changes — the list rows will not reflect the new status

**DataTable violations:**
- Using client-side filtering on either the persons or officers list — all filters must translate to API query parameters
- Not syncing filter params to URL — filter state must survive page refresh using the `useQueryStates` (nuqs) pattern
- Rendering the full unmasked national ID in the table column — always use `person.nationalIdMasked`

**i18n violations:**
- Hardcoding risk level labels (`"High"`) instead of `t('persons.riskLevel.HIGH')`
- Hardcoding officer role labels instead of `t('officers.officerRole.*')`
- Hardcoding officer status labels instead of `t('officers.officerStatus.*')`
- Hardcoding role-on-case labels in the PersonCasesTable instead of `t('persons.role.*')`

**Layout violations:**
- Using a tabbed layout for `PersonDetail` or `OfficerDetail` — the blueprint explicitly specifies single-column full pages (not tabbed) for these entities
- Placing action buttons (Deactivate, Activate, Reset Password) inside a kebab menu on the officer detail page — they are primary actions in the `PageHeader` right zone

---

# 29. Final Verification Checklist

## 29.1 Person List Page

- [ ] `/personnel/persons` renders the full DataTable (not the skeleton)
- [ ] Search filter updates `search` URL param and refetches
- [ ] Role filter chips (Suspect, Victim, Witness) appear and can be dismissed
- [ ] Risk Level filter chips appear and can be dismissed
- [ ] Filter state survives page refresh
- [ ] `nationalIdMasked` column shows masked value for all roles
- [ ] Role badges column shows one badge per assigned role
- [ ] Risk badge renders for suspects; `—` for others
- [ ] "Protected" badge renders only when `isProtectedWitness === true`
- [ ] "Add Person" button visible for `PERSONNEL_MANAGE`
- [ ] "Add Person" button absent for roles without `PERSONNEL_MANAGE`
- [ ] Row click navigates to `/personnel/persons/[personId]`
- [ ] Loading skeleton renders on initial load
- [ ] Empty state renders when no persons
- [ ] Filtered empty state renders when filters yield no results

## 29.2 Person Detail Page

- [ ] `/personnel/persons/[personId]` renders the single-column detail page (NOT tabbed)
- [ ] Breadcrumb shows: Persons > [Person Full Name]
- [ ] `PersonIdentityCard` renders all identity fields
- [ ] National ID field uses `SensitiveField` — masked by default
- [ ] Date of Birth field uses `SensitiveField` — year only by default
- [ ] Phone field uses `SensitiveField` — masked by default
- [ ] "Reveal" button is visible for `PII_REVEAL` permission
- [ ] "Reveal" button is absent for roles without `PII_REVEAL`
- [ ] Clicking "Reveal" shows full value and fires `logPIIRevealEvent` (no error to user)
- [ ] Risk Level field shows badge when person is SUSPECT; `—` otherwise
- [ ] `PersonRoleCards` shows Suspect card only if `suspectProfile` is non-null
- [ ] `PersonRoleCards` shows Victim card only if `victimProfile` is non-null
- [ ] `PersonRoleCards` shows Witness card only if `witnessProfile` is non-null
- [ ] "Protected Witness" accent badge renders on Witness card when `isProtected === true`
- [ ] "No roles assigned" empty state renders when all role profiles are null
- [ ] "Promote to" dropdown shows only unassigned roles
- [ ] "Promote to" dropdown is absent when all three roles are assigned
- [ ] "Promote to" dropdown is absent for roles without `PERSONNEL_MANAGE`
- [ ] `PromoteToSuspectDrawer` opens; permanence notice bar is visible
- [ ] Risk Level select is required; submitting without it shows validation error
- [ ] On successful suspect promotion: drawer closes, Suspect card appears on detail page
- [ ] `PromoteToVictimDrawer` opens; permanence notice bar is visible
- [ ] On successful victim promotion: drawer closes, Victim card appears
- [ ] `PromoteToWitnessDrawer` opens; Protection Level field is hidden when toggle is OFF
- [ ] Protection Level field appears when toggle is switched ON
- [ ] Submitting `isProtected: true` without Protection Level shows validation error
- [ ] On successful witness promotion: drawer closes, Witness card appears; "Protected Witness" badge visible when `isProtected` is true
- [ ] `PersonCasesTable` shows associated cases in compact DataTable
- [ ] Case number links navigate to `/cases/[caseId]`
- [ ] Empty state renders when no linked cases

## 29.3 Officer List Page

- [ ] `/personnel/officers` renders the full DataTable (not the skeleton)
- [ ] Search filter updates URL param and refetches
- [ ] Status filter chips appear and can be dismissed
- [ ] Role filter chips appear and can be dismissed
- [ ] Department filter is visible for `OFFICERS_MANAGE` and absent for `dept_head`
- [ ] Filter state survives page refresh
- [ ] Badge number renders in monospace `xs` font
- [ ] Role badge uses `OFFICER_ROLE_VARIANTS` colour mapping
- [ ] Status badge uses `OFFICER_STATUS_VARIANTS` colour mapping
- [ ] Inactive officer rows render with `opacity-60`
- [ ] `lastActivityAt` column renders for `OFFICERS_MANAGE`; absent for `dept_head`
- [ ] "Add Officer" button visible for `OFFICERS_MANAGE`
- [ ] "Add Officer" button absent for lower roles
- [ ] Kebab for active officer: shows "Deactivate" (destructive), hides "Activate"
- [ ] Kebab for inactive officer: shows "Activate", hides "Deactivate"
- [ ] Row click navigates to `/personnel/officers/[officerId]`

## 29.4 Officer Detail Page

- [ ] `/personnel/officers/[officerId]` renders the single-column detail page (NOT tabbed)
- [ ] Breadcrumb shows: Officers > [Officer Full Name]
- [ ] `OfficerIdentityCard` renders all identity fields
- [ ] `lastActivityAt` field renders for `OFFICERS_MANAGE`; absent for `dept_head`
- [ ] Status badge colour matches `OFFICER_STATUS_VARIANTS`
- [ ] `activeCaseCount` and `totalCaseCount` render correctly
- [ ] Action buttons in PageHeader: "Deactivate" for active officers, "Activate" for inactive
- [ ] Both action buttons are absent for roles without `OFFICERS_MANAGE`
- [ ] "Reset Password" button is visible for `OFFICERS_MANAGE`
- [ ] "Reset Password" button absent for lower roles
- [ ] `DeactivateOfficerDialog` opens on "Deactivate"; shows officer name and badge in description
- [ ] Confirming deactivation: dialog closes, officer status updates to Inactive, toast confirms
- [ ] `ActivateOfficerDialog` opens on "Activate"; shows officer name
- [ ] Confirming activation: dialog closes, officer status updates to Active, toast confirms
- [ ] `ResetPasswordDialog` opens on "Reset Password"; shows officer email in description
- [ ] Confirming reset: dialog closes, success toast confirms
- [ ] `OfficerCasesSummary` shows up to 10 recent cases in compact DataTable
- [ ] "View all cases" link navigates to `/cases?assignedOfficerId=[officerId]`
- [ ] Empty state renders when officer has no assigned cases

## 29.5 Create Person Drawer

- [ ] Opens from "Add Person" button on list page
- [ ] First Name and Last Name are required; other fields optional
- [ ] PII hint renders below National ID field
- [ ] Dirty state guard triggers on close when form is dirty
- [ ] On success: drawer closes, persons list refreshes, toast confirms
- [ ] On error: drawer stays open, error toast shown

## 29.6 Create Officer Drawer

- [ ] Opens from "Add Officer" button on officer list page
- [ ] Badge number format validation fires: lowercase characters trigger inline error
- [ ] Email format validation fires
- [ ] Department `SearchableSelect` populates from departments endpoint
- [ ] Role select does not include `SUPERADMIN` unless authenticated officer is superadmin
- [ ] Dirty state guard triggers on close when form is dirty
- [ ] On success: drawer closes, officers list refreshes, toast confirms, email info in toast
- [ ] On error: drawer stays open, error toast (including 422 field errors mapped correctly)

## 29.7 i18n

- [ ] All personnel UI text is retrieved from message files (no hardcoded English)
- [ ] Switching to Amharic updates all text in persons list, person detail, all drawers, officers list, officer detail, all dialogs
- [ ] i18n completeness test passes with zero missing keys in `personnel` namespace
- [ ] Risk level labels render in selected locale
- [ ] Officer role labels render in selected locale
- [ ] Officer status labels render in selected locale
- [ ] Person role labels render in selected locale

## 29.8 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` — all personnel module tests pass
- [ ] `pnpm build` — production build succeeds without errors

---

*End of CCMS Phase 7 Instruction — Personnel Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 8 will implement the Departments module and Admin module (department list, department detail, head officer assignment, admin reference data pages — locations, crime types — and system health panel)*
