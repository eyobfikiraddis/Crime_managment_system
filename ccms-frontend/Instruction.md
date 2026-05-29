# CCMS Frontend — Phase 5: Arrests & Interrogations Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 4 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all 12 key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab (30s polling, add-note, diff viewer, print), status transition drawer
- **Evidence Module**: Evidence tab (DataTable + gallery toggle), evidence upload drawer (Cloudinary three-step flow), evidence detail drawer with chain of custody timeline (gap detection, immutability indicators), lightbox viewer (keyboard navigation, touch swipe, zoom, metadata panel), record custody event drawer, evidence detail page sub-route
- **Route coverage**: All dashboard skeleton routes render; `/403`, admin skeleton pages, settings skeleton pages, and all nine case tab skeletons created
- **i18n completeness**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases`, and `evidence` namespaces

## 1.2 Phase 5 Objective

Phase 5 delivers two tightly scoped investigative modules — **Arrests** and **Interrogations** — that live inside the case detail view. Both are accessed exclusively through the case detail tab navigation established in Phase 3.

These modules are simpler in technical complexity than evidence (no file uploads, no chain-of-custody law), but they are operationally critical. Arrest records are legal documents. Interrogation logs are court-admissible records. Every field, every label, and every interaction must reflect the weight of that context.

**Phase 5 delivers four sub-systems:**

1. **Arrests Tab** — Replaces the Phase 3 skeleton at `/cases/[caseId]/arrests`. Full DataTable with filter bar, row actions, and status badges for detention and bail.
2. **Create Arrest Drawer** — A `SlideOverDrawer` with a structured form for recording a new arrest linked to a case suspect.
3. **Arrest Detail & Update Drawers** — Inline detail view plus a separate update drawer for changing detention or bail status.
4. **Interrogations Tab** — Replaces the Phase 3 skeleton at `/cases/[caseId]/interrogations`. DataTable/list of interrogation records with create form.
5. **Create & Detail Interrogation Drawers** — Form for logging a new interrogation session and a read-only detail view.

**Also in scope:**

- `arrests` and `interrogations` feature modules: full type definitions, Zod schemas, service implementations, React Query hooks
- Full population of `messages/en/arrests.json`, `messages/am/arrests.json`, `messages/en/interrogations.json`, and `messages/am/interrogations.json`
- `arrestKeys` and `interrogationKeys` query key factories
- Case overview tab count cards for Arrests and Interrogations — already rendered as links in Phase 3; the queries they depend on (`caseKeys.arrests(caseId)` and `caseKeys.interrogations(caseId)`) must be invalidated after mutations in this phase so count cards update automatically

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Arrests service (`src/services/domain/arrests.service.ts`):**
- Replace all stubs with real Axios calls
- All 5 endpoints from Appendix C of the blueprint (`/api/v1/arrests` + `/api/v1/cases/{id}/arrests`)
- Response validation via Zod

**Arrests types and schemas:**
- All TypeScript types: `Arrest`, `ArrestListItem`, `DetentionStatus`, `BailStatus`, `ArrestFilters`, `CreateArrestPayload`, `UpdateArrestPayload`
- All Zod schemas: create form, update form, API response schemas, filter schema

**Arrests query hooks:**
- `useArrestList(caseId, filters)` — paginated list with filter params
- `useArrest(arrestId)` — single arrest detail
- `useCreateArrest(caseId)` — create mutation
- `useUpdateArrest(arrestId, caseId)` — update mutation (detention/bail status changes)
- `useDeleteArrest(arrestId, caseId)` — deletion mutation with `DestructiveConfirmDialog`

**Interrogations service (`src/services/domain/interrogations.service.ts`):**
- Replace all stubs with real Axios calls
- All 2 endpoints: `GET /api/v1/cases/{id}/interrogations` and `POST /api/v1/cases/{id}/interrogations`
- Response validation via Zod

**Interrogations types and schemas:**
- All TypeScript types: `Interrogation`, `InterrogationListItem`, `InterrogationFilters`, `CreateInterrogationPayload`
- All Zod schemas: create form, API response schemas, filter schema

**Interrogations query hooks:**
- `useInterrogationList(caseId, filters)` — paginated list
- `useCreateInterrogation(caseId)` — create mutation

**Case-level person query for form selects:**
- Both create forms require searching persons linked to the current case
- Add `getCasePersons(caseId, params)` to `cases.service.ts` (uses existing `caseKeys` factory)
- This call hits `GET /api/v1/cases/{caseId}/persons` (part of the 39 case endpoints)
- The arrests form filters by `role=SUSPECT`; the interrogations form has no role filter

**Arrests i18n messages:**
- Fully populate `messages/en/arrests.json` and `messages/am/arrests.json`

**Interrogations i18n messages:**
- Fully populate `messages/en/interrogations.json` and `messages/am/interrogations.json`

**Arrests tab (`/cases/[caseId]/arrests/page.tsx`):**
- Replace Phase 3 skeleton
- `PageHeader`: "Arrests" title + count + "Record Arrest" button (investigator+)
- Filter bar: detention status filter, search by person name, date range
- DataTable: all columns, sortable, kebab row actions
- Loading, empty, and error states

**Create Arrest Drawer:**
- `SlideOverDrawer` (480px) with arrested person select, arresting officer select, arrest date/time, location, warrant number, charges at time of arrest, notes
- Bail status defaults to `NOT_SET`; bail amount field shown conditionally when `GRANTED` or `POSTED`

**Arrest Detail Drawer:**
- Full metadata card showing all arrest fields
- "Update Detention Status" action button → opens `UpdateArrestDrawer`
- "Delete Arrest" destructive action → `DestructiveConfirmDialog`

**Update Arrest Drawer:**
- Dedicated `SlideOverDrawer` for modifying detention status and bail information only
- Uses `useUpdateArrest` mutation

**Interrogations tab (`/cases/[caseId]/interrogations/page.tsx`):**
- Replace Phase 3 skeleton
- `PageHeader`: "Interrogations" title + count + "Add Interrogation" button (investigator+)
- Filter bar: search by subject name, date range
- DataTable: all columns, row click opens detail drawer
- Loading, empty, and error states

**Create Interrogation Drawer:**
- `SlideOverDrawer` (480px) with subject (person) select, conducting officer, date/time, location, duration, legal representative fields, summary, recording reference
- Legal representative name field shown conditionally when `legalRepresentativePresent === true`

**Interrogation Detail Drawer:**
- Read-only. All fields displayed.
- No edit or delete actions (interrogation records are immutable once created)
- Padlock icon in the drawer header to indicate immutability

## 1.5 What Must NOT Be Implemented

- Interrogation editing or deletion — these records are immutable
- Bulk arrest operations — deferred to Phase 11
- Standalone `/arrests` top-level list page — deferred (arrests always accessed via case context in this phase)
- Court appearance scheduling from the arrest record — belongs to Phase 6 (Legal module)
- Printing / PDF export of arrest records — Phase 11
- MSW mocking — still deferred

## 1.6 Handoff Standard

When Phase 5 finishes:
- Navigating to `/cases/[caseId]/arrests` shows the full arrests DataTable (not the Phase 3 skeleton)
- "Record Arrest" opens the create drawer; completing it adds the arrest record and refreshes the list
- Clicking an arrest row opens the detail drawer; "Update Detention Status" opens the update drawer
- Navigating to `/cases/[caseId]/interrogations` shows the full interrogations DataTable
- "Add Interrogation" opens the create drawer; completing it adds the interrogation record and refreshes the list
- Clicking an interrogation row opens the read-only detail drawer
- Case overview tab arrest and interrogation count cards reflect the updated totals after mutations
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm test` — all arrests and interrogations tests pass
- i18n completeness test passes for the `arrests` and `interrogations` namespaces

---

# 2. Dependencies

No new packages are required. All dependencies are already installed:

```bash
# Verify core dependencies are present
pnpm why @tanstack/react-query
pnpm why react-hook-form
pnpm why zod
pnpm why nuqs
pnpm why date-fns
pnpm why lucide-react
```

If any of the above are missing, install them:
```bash
pnpm add @tanstack/react-query react-hook-form @hookform/resolvers zod nuqs date-fns lucide-react
```

---

# 3. File & Directory Structure

Create the following new directories and files. All stubs already generated in Phase 3 are replaced.

```
src/
├── features/
│   ├── arrests/
│   │   ├── components/
│   │   │   ├── ArrestsTab.tsx                # Main tab — filter bar + table + drawers
│   │   │   ├── CreateArrestDrawer.tsx         # SlideOverDrawer — new arrest form
│   │   │   ├── ArrestDetailDrawer.tsx         # SlideOverDrawer — read + actions
│   │   │   └── UpdateArrestDrawer.tsx         # SlideOverDrawer — detention/bail update
│   │   ├── hooks/
│   │   │   ├── useArrestList.ts
│   │   │   ├── useArrest.ts
│   │   │   ├── useCreateArrest.ts
│   │   │   ├── useUpdateArrest.ts
│   │   │   ├── useDeleteArrest.ts
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── create-arrest.schema.ts
│   │   │   ├── update-arrest.schema.ts
│   │   │   ├── arrest-api.schema.ts
│   │   │   └── arrest-filters.schema.ts
│   │   ├── types/
│   │   │   ├── arrest.types.ts
│   │   │   └── index.ts
│   │   └── index.ts                          # Public barrel export
│   │
│   └── interrogations/
│       ├── components/
│       │   ├── InterrogationsTab.tsx          # Main tab — filter bar + table + drawers
│       │   ├── CreateInterrogationDrawer.tsx  # SlideOverDrawer — new interrogation form
│       │   └── InterrogationDetailDrawer.tsx  # SlideOverDrawer — read-only detail
│       ├── hooks/
│       │   ├── useInterrogationList.ts
│       │   ├── useCreateInterrogation.ts
│       │   └── index.ts
│       ├── schemas/
│       │   ├── create-interrogation.schema.ts
│       │   ├── interrogation-api.schema.ts
│       │   └── interrogation-filters.schema.ts
│       ├── types/
│       │   ├── interrogation.types.ts
│       │   └── index.ts
│       └── index.ts
│
├── services/
│   └── query/
│       └── keys/
│           ├── arrestKeys.ts                  # New — query key factory
│           └── interrogationKeys.ts           # New — query key factory
│
└── app/
    └── (dashboard)/
        └── cases/
            └── [caseId]/
                ├── arrests/
                │   └── page.tsx               # Replaces Phase 3 skeleton
                └── interrogations/
                    └── page.tsx               # Replaces Phase 3 skeleton

messages/
├── en/
│   ├── arrests.json                           # Full EN population
│   └── interrogations.json                    # Full EN population
└── am/
    ├── arrests.json                           # Full AM population
    └── interrogations.json                    # Full AM population
```

---

# 4. TypeScript Types — Arrests

## 4.1 `src/features/arrests/types/arrest.types.ts`

```typescript
// ─── Detention Status enum ──────────────────────────────────────────────────
export const DetentionStatus = {
  IN_CUSTODY:          'IN_CUSTODY',
  RELEASED_ON_BAIL:    'RELEASED_ON_BAIL',
  RELEASED:            'RELEASED',
  TRANSFERRED:         'TRANSFERRED',
} as const
export type DetentionStatus = (typeof DetentionStatus)[keyof typeof DetentionStatus]

// ─── Bail Status enum ───────────────────────────────────────────────────────
export const BailStatus = {
  NOT_SET:  'NOT_SET',
  DENIED:   'DENIED',
  GRANTED:  'GRANTED',
  POSTED:   'POSTED',
} as const
export type BailStatus = (typeof BailStatus)[keyof typeof BailStatus]

// Bail statuses that require the bail amount field to be shown
export const BAIL_STATUSES_WITH_AMOUNT: BailStatus[] = [
  BailStatus.GRANTED,
  BailStatus.POSTED,
]

// ─── Shared reference shapes ────────────────────────────────────────────────
export interface PersonRef {
  id: string
  firstName: string
  lastName: string
  nationalId: string   // Masked to last 4 digits below dept head
}

export interface OfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

// ─── Core arrest entity ──────────────────────────────────────────────────────
export interface ArrestListItem {
  id: string
  arrestNumber: string              // e.g. "ARR-2026-00018"
  caseId: string
  arrestedPerson: PersonRef
  arrestingOfficer: OfficerRef
  arrestDate: string                // ISO 8601
  location: string
  detentionStatus: DetentionStatus
  bailStatus: BailStatus
  bailAmount: number | null         // In ETB; null unless bailStatus is GRANTED/POSTED
  warrantNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface Arrest extends ArrestListItem {
  chargesAtArrest: string[]         // Freetext charge descriptions at time of arrest
  notes: string | null
  courtAppearanceDate: string | null  // ISO 8601 date; populated by legal module later
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface ArrestFilters {
  search?: string                    // Search by arrested person name
  detentionStatus?: DetentionStatus[]
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortField?: 'arrestDate' | 'arrestNumber' | 'detentionStatus'
  sortDirection?: 'asc' | 'desc'
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateArrestPayload {
  arrestedPersonId: string
  arrestingOfficerId: string
  arrestDate: string                 // ISO 8601
  location: string
  warrantNumber?: string
  chargesAtArrest: string[]
  bailStatus?: BailStatus            // Defaults to NOT_SET
  notes?: string
}

export interface UpdateArrestPayload {
  detentionStatus?: DetentionStatus
  bailStatus?: BailStatus
  bailAmount?: number | null
  notes?: string
}
```

## 4.2 `src/features/arrests/types/index.ts`

Re-export all types and constants:

```typescript
export * from './arrest.types'
```

---

# 5. TypeScript Types — Interrogations

## 5.1 `src/features/interrogations/types/interrogation.types.ts`

```typescript
import type { OfficerRef } from '@features/arrests/types/arrest.types'

// Re-export PersonRef for use in this module
export type { PersonRef } from '@features/arrests/types/arrest.types'

// ─── Core interrogation entity ───────────────────────────────────────────────
export interface InterrogationListItem {
  id: string
  interrogationNumber: string          // e.g. "INT-2026-00007"
  caseId: string
  subject: {
    id: string
    firstName: string
    lastName: string
    roleOnCase: 'SUSPECT' | 'VICTIM' | 'WITNESS'
  }
  conductingOfficer: OfficerRef
  interrogationDate: string            // ISO 8601
  location: string
  durationMinutes: number | null
  legalRepresentativePresent: boolean
  createdAt: string
}

export interface Interrogation extends InterrogationListItem {
  legalRepresentativeName: string | null
  summary: string
  recordingReference: string | null
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface InterrogationFilters {
  search?: string                      // Search by subject name
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortField?: 'interrogationDate' | 'interrogationNumber'
  sortDirection?: 'asc' | 'desc'
}

// ─── Payload ─────────────────────────────────────────────────────────────────
export interface CreateInterrogationPayload {
  subjectId: string
  conductingOfficerId: string
  interrogationDate: string            // ISO 8601
  location: string
  durationMinutes?: number
  legalRepresentativePresent: boolean
  legalRepresentativeName?: string
  summary: string
  recordingReference?: string
}
```

## 5.2 `src/features/interrogations/types/index.ts`

```typescript
export * from './interrogation.types'
```

---

# 6. Zod Schemas — Arrests

## 6.1 `src/features/arrests/schemas/create-arrest.schema.ts`

```typescript
import { z } from 'zod'
import { BailStatus } from '../types/arrest.types'

export const createArrestSchema = z.object({
  arrestedPersonId: z
    .string()
    .min(1, { message: 'Arrested person is required.' }),
  arrestingOfficerId: z
    .string()
    .min(1, { message: 'Arresting officer is required.' }),
  arrestDate: z
    .string()
    .min(1, { message: 'Arrest date and time is required.' }),
  location: z
    .string()
    .min(2, { message: 'Arrest location is required.' })
    .max(300),
  warrantNumber: z.string().max(100).optional(),
  chargesAtArrest: z
    .array(z.string().min(1))
    .min(1, { message: 'At least one charge must be listed.' })
    .max(20),
  bailStatus: z.nativeEnum(BailStatus).optional().default(BailStatus.NOT_SET),
  bailAmount: z.number().positive().nullable().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    // Bail amount is required when bail is GRANTED or POSTED
    if (
      (data.bailStatus === BailStatus.GRANTED || data.bailStatus === BailStatus.POSTED) &&
      (data.bailAmount === null || data.bailAmount === undefined)
    ) {
      return false
    }
    return true
  },
  {
    message: 'Bail amount is required when bail is granted or posted.',
    path: ['bailAmount'],
  },
)

export type CreateArrestValues = z.infer<typeof createArrestSchema>
```

## 6.2 `src/features/arrests/schemas/update-arrest.schema.ts`

```typescript
import { z } from 'zod'
import { DetentionStatus, BailStatus } from '../types/arrest.types'

export const updateArrestSchema = z.object({
  detentionStatus: z.nativeEnum(DetentionStatus).optional(),
  bailStatus: z.nativeEnum(BailStatus).optional(),
  bailAmount: z.number().positive().nullable().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (
      (data.bailStatus === BailStatus.GRANTED || data.bailStatus === BailStatus.POSTED) &&
      (data.bailAmount === null || data.bailAmount === undefined)
    ) {
      return false
    }
    return true
  },
  {
    message: 'Bail amount is required when bail is granted or posted.',
    path: ['bailAmount'],
  },
)

export type UpdateArrestValues = z.infer<typeof updateArrestSchema>
```

## 6.3 `src/features/arrests/schemas/arrest-api.schema.ts`

```typescript
import { z } from 'zod'
import { DetentionStatus, BailStatus } from '../types/arrest.types'

const personRefSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  nationalId: z.string(),
})

const officerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

export const arrestListItemSchema = z.object({
  id: z.string().uuid(),
  arrestNumber: z.string(),
  caseId: z.string().uuid(),
  arrestedPerson: personRefSchema,
  arrestingOfficer: officerRefSchema,
  arrestDate: z.string(),
  location: z.string(),
  detentionStatus: z.nativeEnum(DetentionStatus),
  bailStatus: z.nativeEnum(BailStatus),
  bailAmount: z.number().nullable(),
  warrantNumber: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const arrestDetailSchema = arrestListItemSchema.extend({
  chargesAtArrest: z.array(z.string()),
  notes: z.string().nullable(),
  courtAppearanceDate: z.string().nullable(),
})

export const paginatedArrestsSchema = z.object({
  data: z.array(arrestListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})
```

## 6.4 `src/features/arrests/schemas/arrest-filters.schema.ts`

```typescript
import { z } from 'zod'
import { DetentionStatus } from '../types/arrest.types'

export const arrestFiltersSchema = z.object({
  search: z.string().optional(),
  detentionStatus: z.array(z.nativeEnum(DetentionStatus)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['arrestDate', 'arrestNumber', 'detentionStatus'])
    .optional()
    .default('arrestDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
```

---

# 7. Zod Schemas — Interrogations

## 7.1 `src/features/interrogations/schemas/create-interrogation.schema.ts`

```typescript
import { z } from 'zod'

export const createInterrogationSchema = z.object({
  subjectId: z
    .string()
    .min(1, { message: 'Subject is required.' }),
  conductingOfficerId: z
    .string()
    .min(1, { message: 'Conducting officer is required.' }),
  interrogationDate: z
    .string()
    .min(1, { message: 'Date and time is required.' }),
  location: z
    .string()
    .min(2, { message: 'Location is required.' })
    .max(300),
  durationMinutes: z.number().int().positive().max(1440).nullable().optional(),
  legalRepresentativePresent: z.boolean().default(false),
  legalRepresentativeName: z.string().max(200).optional(),
  summary: z
    .string()
    .min(10, { message: 'Summary must be at least 10 characters.' })
    .max(5000),
  recordingReference: z.string().max(200).optional(),
})

export type CreateInterrogationValues = z.infer<typeof createInterrogationSchema>
```

## 7.2 `src/features/interrogations/schemas/interrogation-api.schema.ts`

```typescript
import { z } from 'zod'

const officerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  departmentName: z.string(),
})

const subjectSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  roleOnCase: z.enum(['SUSPECT', 'VICTIM', 'WITNESS']),
})

export const interrogationListItemSchema = z.object({
  id: z.string().uuid(),
  interrogationNumber: z.string(),
  caseId: z.string().uuid(),
  subject: subjectSchema,
  conductingOfficer: officerRefSchema,
  interrogationDate: z.string(),
  location: z.string(),
  durationMinutes: z.number().nullable(),
  legalRepresentativePresent: z.boolean(),
  createdAt: z.string(),
})

export const interrogationDetailSchema = interrogationListItemSchema.extend({
  legalRepresentativeName: z.string().nullable(),
  summary: z.string(),
  recordingReference: z.string().nullable(),
})

export const paginatedInterrogationsSchema = z.object({
  data: z.array(interrogationListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})
```

## 7.3 `src/features/interrogations/schemas/interrogation-filters.schema.ts`

```typescript
import { z } from 'zod'

export const interrogationFiltersSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['interrogationDate', 'interrogationNumber'])
    .optional()
    .default('interrogationDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
```

---

# 8. Service Implementations

## 8.1 `src/services/domain/arrests.service.ts`

Replace all stubs. Every response is validated with the corresponding Zod schema.

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedArrestsSchema,
  arrestDetailSchema,
} from '@features/arrests/schemas/arrest-api.schema'
import type {
  ArrestListItem,
  Arrest,
  ArrestFilters,
  CreateArrestPayload,
  UpdateArrestPayload,
} from '@features/arrests/types/arrest.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List arrests for a case ──────────────────────────────────────────────────
export async function getCaseArrests(
  caseId: string,
  filters: ArrestFilters,
): Promise<PaginatedResponse<ArrestListItem>> {
  const params = buildArrestParams(filters)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/arrests?${params}`)
  return paginatedArrestsSchema.parse(raw)
}

// ─── Detail ───────────────────────────────────────────────────────────────────
export async function getArrest(arrestId: string): Promise<Arrest> {
  const raw = await apiClient.get(`/api/v1/arrests/${arrestId}`)
  return arrestDetailSchema.parse(raw)
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createArrest(
  caseId: string,
  payload: CreateArrestPayload,
): Promise<Arrest> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/arrests`, payload)
  return arrestDetailSchema.parse(raw)
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateArrest(
  arrestId: string,
  payload: UpdateArrestPayload,
): Promise<Arrest> {
  const raw = await apiClient.patch(`/api/v1/arrests/${arrestId}`, payload)
  return arrestDetailSchema.parse(raw)
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteArrest(arrestId: string): Promise<void> {
  await apiClient.delete(`/api/v1/arrests/${arrestId}`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildArrestParams(filters: ArrestFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.detentionStatus?.length)
    p.set('detentionStatus', filters.detentionStatus.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
```

## 8.2 `src/services/domain/interrogations.service.ts`

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedInterrogationsSchema,
  interrogationDetailSchema,
} from '@features/interrogations/schemas/interrogation-api.schema'
import type {
  InterrogationListItem,
  Interrogation,
  InterrogationFilters,
  CreateInterrogationPayload,
} from '@features/interrogations/types/interrogation.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List ─────────────────────────────────────────────────────────────────────
export async function getCaseInterrogations(
  caseId: string,
  filters: InterrogationFilters,
): Promise<PaginatedResponse<InterrogationListItem>> {
  const params = buildInterrogationParams(filters)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/interrogations?${params}`)
  return paginatedInterrogationsSchema.parse(raw)
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createInterrogation(
  caseId: string,
  payload: CreateInterrogationPayload,
): Promise<Interrogation> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/interrogations`, payload)
  return interrogationDetailSchema.parse(raw)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildInterrogationParams(filters: InterrogationFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
```

## 8.3 `src/services/domain/cases.service.ts` — Addition: `getCasePersons`

Add the following function to the existing cases service. Do not remove any existing functions.

```typescript
import type { PersonRef } from '@features/arrests/types/arrest.types'

// ─── Persons linked to a case (for SearchableSelect in arrest/interrogation forms) ─
export async function getCasePersons(
  caseId: string,
  params: { role?: 'SUSPECT' | 'VICTIM' | 'WITNESS'; search?: string },
): Promise<PersonRef[]> {
  const p = new URLSearchParams()
  if (params.role) p.set('role', params.role)
  if (params.search) p.set('search', params.search)
  // Returns a flat list — no pagination (cases rarely have more than 50 linked persons)
  const raw = await apiClient.get(`/api/v1/cases/${caseId}/persons?${p.toString()}`)
  // Validate as an array of PersonRef
  const personRefSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    nationalId: z.string(),
  })
  return z.array(personRefSchema).parse(raw)
}
```

---

# 9. Query Key Factories

## 9.1 `src/services/query/keys/arrestKeys.ts`

```typescript
import type { ArrestFilters } from '@features/arrests/types/arrest.types'

export const arrestKeys = {
  all: ['arrests'] as const,

  // All arrests for a case
  caseArrests: (caseId: string) =>
    [...arrestKeys.all, 'case', caseId] as const,
  caseArrestList: (caseId: string, filters: Record<string, unknown>) =>
    [...arrestKeys.caseArrests(caseId), 'list', filters] as const,

  // Single arrest detail
  details: () => [...arrestKeys.all, 'detail'] as const,
  detail: (arrestId: string) =>
    [...arrestKeys.details(), arrestId] as const,
}
```

## 9.2 `src/services/query/keys/interrogationKeys.ts`

```typescript
export const interrogationKeys = {
  all: ['interrogations'] as const,

  // All interrogations for a case
  caseInterrogations: (caseId: string) =>
    [...interrogationKeys.all, 'case', caseId] as const,
  caseInterrogationList: (caseId: string, filters: Record<string, unknown>) =>
    [...interrogationKeys.caseInterrogations(caseId), 'list', filters] as const,
}
```

## 9.3 Verify `caseKeys` sub-resources

Ensure `src/services/query/keys/caseKeys.ts` contains the following sub-resource keys. If they do not exist, add them now:

```typescript
// Inside caseKeys — add if missing:
arrests: (caseId: string) =>
  [...caseKeys.detail(caseId), 'arrests'] as const,
interrogations: (caseId: string) =>
  [...caseKeys.detail(caseId), 'interrogations'] as const,
```

These are the keys invalidated after mutations so the case overview tab count cards update.

---

# 10. React Query Hooks — Arrests

Create all hooks in `src/features/arrests/hooks/`.

## 10.1 `useArrestList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseArrests } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import type { ArrestFilters } from '../types/arrest.types'

export function useArrestList(caseId: string, filters: ArrestFilters) {
  return useQuery({
    queryKey: arrestKeys.caseArrestList(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseArrests(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
```

## 10.2 `useArrest.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'

export function useArrest(arrestId: string) {
  return useQuery({
    queryKey: arrestKeys.detail(arrestId),
    queryFn: () => getArrest(arrestId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(arrestId),
  })
}
```

## 10.3 `useCreateArrest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateArrestPayload } from '../types/arrest.types'

export function useCreateArrest(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (payload: CreateArrestPayload) => createArrest(caseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.arrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 10.4 `useUpdateArrest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateArrestPayload } from '../types/arrest.types'

export function useUpdateArrest(arrestId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (payload: UpdateArrestPayload) => updateArrest(arrestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.detail(arrestId) })
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 10.5 `useDeleteArrest.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteArrest } from '@services/domain/arrests.service'
import { arrestKeys } from '@services/query/keys/arrestKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeleteArrest(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('arrests')

  return useMutation({
    mutationFn: (arrestId: string) => deleteArrest(arrestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arrestKeys.caseArrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.arrests(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
    },
  })
}
```

## 10.6 `src/features/arrests/hooks/index.ts`

Export all hooks.

---

# 11. React Query Hooks — Interrogations

Create all hooks in `src/features/interrogations/hooks/`.

## 11.1 `useInterrogationList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseInterrogations } from '@services/domain/interrogations.service'
import { interrogationKeys } from '@services/query/keys/interrogationKeys'
import type { InterrogationFilters } from '../types/interrogation.types'

export function useInterrogationList(caseId: string, filters: InterrogationFilters) {
  return useQuery({
    queryKey: interrogationKeys.caseInterrogationList(
      caseId,
      filters as Record<string, unknown>,
    ),
    queryFn: () => getCaseInterrogations(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
```

## 11.2 `useCreateInterrogation.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createInterrogation } from '@services/domain/interrogations.service'
import { interrogationKeys } from '@services/query/keys/interrogationKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateInterrogationPayload } from '../types/interrogation.types'

export function useCreateInterrogation(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('interrogations')

  return useMutation({
    mutationFn: (payload: CreateInterrogationPayload) =>
      createInterrogation(caseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: interrogationKeys.caseInterrogations(caseId),
      })
      void queryClient.invalidateQueries({ queryKey: caseKeys.interrogations(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 11.3 `src/features/interrogations/hooks/index.ts`

Export all hooks.

---

# 12. i18n Messages — Arrests

## 12.1 `messages/en/arrests.json` — Full Population

```json
{
  "pageTitle": "Arrests",
  "tab": {
    "heading": "Arrests",
    "entityCount": "{count} arrest(s)",
    "recordArrest": "Record Arrest",
    "filters": {
      "search": "Search by person name...",
      "detentionStatus": "Detention Status",
      "dateRange": "Date Range",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading arrests...",
    "empty": "No arrests recorded for this case.",
    "emptyDescription": "Record the first arrest using the button above.",
    "emptyFiltered": "No arrests match your current filters.",
    "columns": {
      "arrestNumber": "Arrest No.",
      "arrestedPerson": "Arrested Person",
      "arrestingOfficer": "Arresting Officer",
      "arrestDate": "Date & Time",
      "location": "Location",
      "detentionStatus": "Detention",
      "bailStatus": "Bail",
      "actions": "Actions"
    },
    "rowActions": {
      "view": "View Details",
      "updateStatus": "Update Detention Status",
      "delete": "Delete Arrest"
    }
  },
  "detentionStatus": {
    "IN_CUSTODY": "In Custody",
    "RELEASED_ON_BAIL": "Released on Bail",
    "RELEASED": "Released",
    "TRANSFERRED": "Transferred"
  },
  "bailStatus": {
    "NOT_SET": "Not Set",
    "DENIED": "Denied",
    "GRANTED": "Granted",
    "POSTED": "Posted"
  },
  "create": {
    "drawerTitle": "Record Arrest",
    "drawerDescription": "Record a new arrest linked to this case.",
    "section1Title": "Arrest Details",
    "section2Title": "Bail Information",
    "arrestedPersonLabel": "Arrested Person",
    "arrestedPersonPlaceholder": "Search suspects linked to this case...",
    "arrestedPersonHint": "Only suspects already linked to this case are shown.",
    "arrestingOfficerLabel": "Arresting Officer",
    "arrestingOfficerPlaceholder": "Search officers...",
    "arrestDateLabel": "Date & Time of Arrest",
    "locationLabel": "Arrest Location",
    "locationPlaceholder": "e.g. Bole Road, near Edna Mall",
    "warrantNumberLabel": "Warrant Number (optional)",
    "warrantNumberPlaceholder": "e.g. WRN-2026-00041",
    "chargesAtArrestLabel": "Charges at Time of Arrest",
    "chargesAtArrestPlaceholder": "Enter a charge and press Enter...",
    "chargesAtArrestHint": "List the charges known at the time of arrest. These may differ from formal charges filed later.",
    "chargesMin": "At least one charge is required.",
    "bailStatusLabel": "Bail Status",
    "bailAmountLabel": "Bail Amount (ETB)",
    "bailAmountPlaceholder": "Enter amount in Ethiopian Birr",
    "notesLabel": "Notes (optional)",
    "notesPlaceholder": "Any notes about the circumstances of the arrest...",
    "submitButton": "Record Arrest",
    "cancelButton": "Cancel",
    "successMessage": "Arrest record created successfully.",
    "errorMessage": "Failed to record arrest. Please try again."
  },
  "detail": {
    "drawerTitle": "Arrest Details",
    "arrestNumber": "Arrest Number",
    "arrestedPerson": "Arrested Person",
    "arrestingOfficer": "Arresting Officer",
    "arrestDate": "Date & Time",
    "location": "Location",
    "warrantNumber": "Warrant Number",
    "detentionStatus": "Detention Status",
    "bailStatus": "Bail Status",
    "bailAmount": "Bail Amount",
    "bailAmountValue": "{amount} ETB",
    "noBailAmount": "—",
    "chargesAtArrest": "Charges at Time of Arrest",
    "noCharges": "No charges recorded.",
    "courtAppearanceDate": "Court Appearance Date",
    "noCourtDate": "Not yet scheduled.",
    "notes": "Notes",
    "noNotes": "No notes.",
    "updateStatusButton": "Update Detention Status",
    "noWarrant": "No warrant number recorded."
  },
  "update": {
    "drawerTitle": "Update Detention Status",
    "drawerDescription": "Update the detention and bail status for this arrest record.",
    "detentionStatusLabel": "Detention Status",
    "bailStatusLabel": "Bail Status",
    "bailAmountLabel": "Bail Amount (ETB)",
    "bailAmountPlaceholder": "Enter amount in Ethiopian Birr",
    "notesLabel": "Update Notes (optional)",
    "notesPlaceholder": "Reason for status change...",
    "submitButton": "Save Changes",
    "cancelButton": "Cancel",
    "successMessage": "Arrest record updated successfully.",
    "errorMessage": "Failed to update arrest record. Please try again."
  },
  "delete": {
    "confirmTitle": "Delete arrest record?",
    "confirmDescription": "This will permanently delete arrest record {arrestNumber}. This action cannot be undone and will be logged in the case audit trail.",
    "confirmPhrase": "delete {arrestNumber}",
    "successMessage": "Arrest record deleted successfully."
  }
}
```

## 12.2 `messages/am/arrests.json` — Full Amharic Equivalent

Every key in `en/arrests.json` must appear with the identical key path:

```json
{
  "pageTitle": "ቁርኝቶቾ",
  "tab": {
    "heading": "ቁርኝቶቾ",
    "entityCount": "{count} ቁርኝቶ(ቾ)",
    "recordArrest": "ቁርኝቶ ይምዝግቡ",
    "filters": {
      "search": "በሰው ስም ፈልግ...",
      "detentionStatus": "የቁርኝቶ ሁኔታ",
      "dateRange": "የቀን ክልል",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "ቁርኝቶቾ እየጫነ ነው...",
    "empty": "ለዚህ ጉዳይ ምንም ቁርኝቶ አልተመዘገበም።",
    "emptyDescription": "ከላይ ያለውን አዝራር በመጠቀም የመጀመሪያ ቁርኝቶ ይምዝግቡ።",
    "emptyFiltered": "ምንም ቁርኝቶ ከማጣሪያዎ ጋር አይዛመድም።",
    "columns": {
      "arrestNumber": "የቁርኝቶ ቁ.",
      "arrestedPerson": "የተያዘ ሰው",
      "arrestingOfficer": "ያዘ ፖሊስ",
      "arrestDate": "ቀን እና ሰዓት",
      "location": "ቦታ",
      "detentionStatus": "ቁርኝቶ",
      "bailStatus": "ዋስትና",
      "actions": "ድርጊቶች"
    },
    "rowActions": {
      "view": "ዝርዝሮች ተመልከት",
      "updateStatus": "የቁርኝቶ ሁኔታ አዘምን",
      "delete": "ቁርኝቶ ሰርዝ"
    }
  },
  "detentionStatus": {
    "IN_CUSTODY": "በቁጥጥር ስር",
    "RELEASED_ON_BAIL": "በዋስ ተፈቷል",
    "RELEASED": "ተፈቷል",
    "TRANSFERRED": "ተዛውሯል"
  },
  "bailStatus": {
    "NOT_SET": "አልተቀናጀም",
    "DENIED": "ተከልክሏል",
    "GRANTED": "ተፈቅዷል",
    "POSTED": "ተሰጥቷል"
  },
  "create": {
    "drawerTitle": "ቁርኝቶ ይምዝግቡ",
    "drawerDescription": "ለዚህ ጉዳይ አዲስ ቁርኝቶ ይምዝገቡ።",
    "section1Title": "የቁርኝቶ ዝርዝሮች",
    "section2Title": "የዋስትና መረጃ",
    "arrestedPersonLabel": "የተያዘ ሰው",
    "arrestedPersonPlaceholder": "ለዚህ ጉዳይ ተጠርጣሪዎችን ፈልግ...",
    "arrestedPersonHint": "ለዚህ ጉዳይ ተጠርጣሪ ሆነው የተያያዙ ሰዎች ብቻ ይታያሉ።",
    "arrestingOfficerLabel": "ያዘ ፖሊስ",
    "arrestingOfficerPlaceholder": "ፖሊስ ፈልግ...",
    "arrestDateLabel": "የቁርኝቶ ቀን እና ሰዓት",
    "locationLabel": "የቁርኝቶ ቦታ",
    "locationPlaceholder": "ለምሳሌ ቦሌ መንገድ፣ ኤድና ሞል አቅራቢያ",
    "warrantNumberLabel": "የትዕዛዝ ቁጥር (አማራጭ)",
    "warrantNumberPlaceholder": "ለምሳሌ WRN-2026-00041",
    "chargesAtArrestLabel": "በቁርኝቶ ጊዜ ክሶች",
    "chargesAtArrestPlaceholder": "ክስ ያስገቡ እና Enter ይጫኑ...",
    "chargesAtArrestHint": "በቁርኝቶ ጊዜ የታወቁ ክሶችን ይዘርዝሩ። እነዚህ ከኋላ ከሚቀርቡ ይለያዩ ይሆናሉ።",
    "chargesMin": "ቢያንስ አንድ ክስ ያስፈልጋል።",
    "bailStatusLabel": "የዋስትና ሁኔታ",
    "bailAmountLabel": "የዋስትና መጠን (ብር)",
    "bailAmountPlaceholder": "መጠን በኢትዮጵያ ብር ያስገቡ",
    "notesLabel": "ማስታወሻ (አማራጭ)",
    "notesPlaceholder": "ስለ ቁርኝቶ ሁኔታ ማስታወሻ...",
    "submitButton": "ቁርኝቶ ይምዝግቡ",
    "cancelButton": "ሰርዝ",
    "successMessage": "የቁርኝቶ መዝገብ በተሳካ ሁኔታ ተፈጥሯል።",
    "errorMessage": "ቁርኝቶ ለመምዝገብ አልተሳካም። እንደገና ይሞክሩ።"
  },
  "detail": {
    "drawerTitle": "የቁርኝቶ ዝርዝሮች",
    "arrestNumber": "የቁርኝቶ ቁጥር",
    "arrestedPerson": "የተያዘ ሰው",
    "arrestingOfficer": "ያዘ ፖሊስ",
    "arrestDate": "ቀን እና ሰዓት",
    "location": "ቦታ",
    "warrantNumber": "የትዕዛዝ ቁጥር",
    "detentionStatus": "የቁርኝቶ ሁኔታ",
    "bailStatus": "የዋስትና ሁኔታ",
    "bailAmount": "የዋስትና መጠን",
    "bailAmountValue": "{amount} ብር",
    "noBailAmount": "—",
    "chargesAtArrest": "በቁርኝቶ ጊዜ ክሶች",
    "noCharges": "ምንም ክሶች አልተመዘገቡም።",
    "courtAppearanceDate": "የፍርድ ቤት ቀን",
    "noCourtDate": "ገና አልተቀናጀም።",
    "notes": "ማስታወሻ",
    "noNotes": "ምንም ማስታወሻ የለም።",
    "updateStatusButton": "የቁርኝቶ ሁኔታ አዘምን",
    "noWarrant": "ምንም የትዕዛዝ ቁጥር አልተመዘገበም።"
  },
  "update": {
    "drawerTitle": "የቁርኝቶ ሁኔታ አዘምን",
    "drawerDescription": "ለዚህ ቁርኝቶ ሁኔታ እና የዋስትና መረጃ ያዘምኑ።",
    "detentionStatusLabel": "የቁርኝቶ ሁኔታ",
    "bailStatusLabel": "የዋስትና ሁኔታ",
    "bailAmountLabel": "የዋስትና መጠን (ብር)",
    "bailAmountPlaceholder": "መጠን በኢትዮጵያ ብር ያስገቡ",
    "notesLabel": "የዝማኔ ማስታወሻ (አማራጭ)",
    "notesPlaceholder": "ለሁኔታ ለውጥ ምክንያት...",
    "submitButton": "ለውጦች ያስቀምጡ",
    "cancelButton": "ሰርዝ",
    "successMessage": "የቁርኝቶ መዝገብ በተሳካ ሁኔታ ተዘምኗል።",
    "errorMessage": "የቁርኝቶ መዝገብ ለማዘምን አልተሳካም። እንደገና ይሞክሩ።"
  },
  "delete": {
    "confirmTitle": "የቁርኝቶ መዝገብ ሰርዝ?",
    "confirmDescription": "ቁርኝቶ ቁጥር {arrestNumber} ቋሚ ሆኖ ይሰረዛል። ይህ ድርጊት ሊቀለበስ አይችልም።",
    "confirmPhrase": "{arrestNumber} ሰርዝ",
    "successMessage": "የቁርኝቶ መዝገብ በተሳካ ሁኔታ ተሰርዟል።"
  }
}
```

---

# 13. i18n Messages — Interrogations

## 13.1 `messages/en/interrogations.json` — Full Population

```json
{
  "pageTitle": "Interrogations",
  "tab": {
    "heading": "Interrogations",
    "entityCount": "{count} record(s)",
    "addInterrogation": "Add Interrogation",
    "filters": {
      "search": "Search by subject name...",
      "dateRange": "Date Range",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading interrogation records...",
    "empty": "No interrogation records for this case.",
    "emptyDescription": "Log the first interrogation session using the button above.",
    "emptyFiltered": "No records match your current filters.",
    "columns": {
      "interrogationNumber": "Record No.",
      "subject": "Subject",
      "conductingOfficer": "Conducted By",
      "interrogationDate": "Date & Time",
      "location": "Location",
      "duration": "Duration",
      "legalRep": "Legal Rep",
      "actions": "Actions"
    },
    "durationValue": "{minutes} min",
    "durationUnknown": "—",
    "legalRepYes": "Present",
    "legalRepNo": "Absent",
    "rowActions": {
      "view": "View Record"
    }
  },
  "roleOnCase": {
    "SUSPECT": "Suspect",
    "VICTIM": "Victim",
    "WITNESS": "Witness"
  },
  "create": {
    "drawerTitle": "Add Interrogation Record",
    "drawerDescription": "Log a new interrogation session for this case.",
    "section1Title": "Session Details",
    "section2Title": "Legal Representation",
    "section3Title": "Summary",
    "subjectLabel": "Subject",
    "subjectPlaceholder": "Search persons linked to this case...",
    "conductingOfficerLabel": "Conducting Officer",
    "conductingOfficerPlaceholder": "Search officers...",
    "interrogationDateLabel": "Date & Time",
    "locationLabel": "Location",
    "locationPlaceholder": "e.g. Interview Room 3, Bole Sub-City Police Station",
    "durationLabel": "Duration (minutes, optional)",
    "durationPlaceholder": "e.g. 90",
    "legalRepresentativePresentLabel": "Legal Representative Present",
    "legalRepresentativeNameLabel": "Legal Representative Name",
    "legalRepresentativeNamePlaceholder": "Full name of the legal representative",
    "summaryLabel": "Interrogation Summary",
    "summaryPlaceholder": "Describe the key topics, statements, and outcomes of this interrogation session...",
    "summaryHint": "This summary will be permanently recorded and may be used as court documentation.",
    "recordingReferenceLabel": "Recording Reference (optional)",
    "recordingReferencePlaceholder": "e.g. VID-2026-INT-0042",
    "submitButton": "Save Record",
    "cancelButton": "Cancel",
    "successMessage": "Interrogation record saved successfully.",
    "errorMessage": "Failed to save interrogation record. Please try again."
  },
  "detail": {
    "drawerTitle": "Interrogation Record",
    "immutableNotice": "This record is permanent and cannot be edited or deleted.",
    "interrogationNumber": "Record Number",
    "subject": "Subject",
    "subjectRole": "Role on Case",
    "conductingOfficer": "Conducted By",
    "interrogationDate": "Date & Time",
    "location": "Location",
    "duration": "Duration",
    "durationValue": "{minutes} minutes",
    "durationUnknown": "Not recorded.",
    "legalRepSection": "Legal Representation",
    "legalRepPresent": "Present",
    "legalRepAbsent": "Absent",
    "legalRepName": "Representative",
    "noLegalRepName": "Name not recorded.",
    "summarySection": "Summary",
    "recordingReference": "Recording Reference",
    "noRecordingReference": "No recording reference.",
    "immutableTooltip": "Interrogation records cannot be modified or deleted."
  }
}
```

## 13.2 `messages/am/interrogations.json` — Full Amharic Equivalent

```json
{
  "pageTitle": "ምርምራዎቹ",
  "tab": {
    "heading": "ምርምራዎቹ",
    "entityCount": "{count} መዝገብ(ቤቶ)",
    "addInterrogation": "ምርምራ ጨምር",
    "filters": {
      "search": "በተጠያቂ ስም ፈልግ...",
      "dateRange": "የቀን ክልል",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "የምርምራ መዝገቦች እየጫነ ነው...",
    "empty": "ለዚህ ጉዳይ ምንም የምርምራ መዝገብ የለም።",
    "emptyDescription": "ከላይ ያለውን አዝራር ተጠቅሞ የመጀመሪያ ምርምራ ይምዝግቡ።",
    "emptyFiltered": "ምንም መዝገብ ከማጣሪያዎ ጋር አይዛመድም።",
    "columns": {
      "interrogationNumber": "መዝገብ ቁ.",
      "subject": "ተጠያቂ",
      "conductingOfficer": "ያካሄደ",
      "interrogationDate": "ቀን እና ሰዓት",
      "location": "ቦታ",
      "duration": "ቆይታ",
      "legalRep": "ጠበቃ",
      "actions": "ድርጊቶች"
    },
    "durationValue": "{minutes} ደቂቃ",
    "durationUnknown": "—",
    "legalRepYes": "ተገኝቷል",
    "legalRepNo": "አልተገኘም",
    "rowActions": {
      "view": "መዝገብ ተመልከት"
    }
  },
  "roleOnCase": {
    "SUSPECT": "ተጠርጣሪ",
    "VICTIM": "ተጎጂ",
    "WITNESS": "ምስክር"
  },
  "create": {
    "drawerTitle": "የምርምራ መዝገብ ጨምር",
    "drawerDescription": "ለዚህ ጉዳይ አዲስ የምርምራ ስብሰባ ይምዝገቡ።",
    "section1Title": "የስብሰባ ዝርዝሮች",
    "section2Title": "የህጋዊ ወኪል",
    "section3Title": "ማጠቃለያ",
    "subjectLabel": "ተጠያቂ",
    "subjectPlaceholder": "ለዚህ ጉዳይ የተያያዙ ሰዎች ፈልግ...",
    "conductingOfficerLabel": "ምርምራ ያካሄደ ፖሊስ",
    "conductingOfficerPlaceholder": "ፖሊስ ፈልግ...",
    "interrogationDateLabel": "ቀን እና ሰዓት",
    "locationLabel": "ቦታ",
    "locationPlaceholder": "ለምሳሌ ቃለ መጠይቅ ክፍል 3፣ ቦሌ ክፍለ ከተማ ፖሊስ ጣቢያ",
    "durationLabel": "ቆይታ (ደቂቃ፣ አማራጭ)",
    "durationPlaceholder": "ለምሳሌ 90",
    "legalRepresentativePresentLabel": "ጠበቃ ተገኝቷል",
    "legalRepresentativeNameLabel": "የጠበቃ ስም",
    "legalRepresentativeNamePlaceholder": "የህጋዊ ወኪሉ ሙሉ ስም",
    "summaryLabel": "የምርምራ ማጠቃለያ",
    "summaryPlaceholder": "ዋና ርዕሶቹን፣ ቃሎቹን እና ውጤቶቹን ይግለጹ...",
    "summaryHint": "ይህ ማጠቃለያ ቋሚ ሆኖ ይመዘገባል እና ለፍርድ ቤት ሰነድ ሊያገለግል ይችላል።",
    "recordingReferenceLabel": "የቅጂ ማጣቀሻ (አማራጭ)",
    "recordingReferencePlaceholder": "ለምሳሌ VID-2026-INT-0042",
    "submitButton": "መዝገብ አስቀምጥ",
    "cancelButton": "ሰርዝ",
    "successMessage": "የምርምራ መዝገብ በተሳካ ሁኔታ ተቀምጧል።",
    "errorMessage": "የምርምራ መዝገብ ለማስቀመጥ አልተሳካም። እንደገና ይሞክሩ።"
  },
  "detail": {
    "drawerTitle": "የምርምራ መዝገብ",
    "immutableNotice": "ይህ መዝገብ ቋሚ ነው፣ ሊቀናጀጥ ወይም ሊሰረዝ አይችልም።",
    "interrogationNumber": "የመዝገብ ቁጥር",
    "subject": "ተጠያቂ",
    "subjectRole": "በጉዳዩ ሚና",
    "conductingOfficer": "ያካሄደ",
    "interrogationDate": "ቀን እና ሰዓት",
    "location": "ቦታ",
    "duration": "ቆይታ",
    "durationValue": "{minutes} ደቂቃ",
    "durationUnknown": "አልተመዘገበም።",
    "legalRepSection": "የህጋዊ ወኪል",
    "legalRepPresent": "ተገኝቷል",
    "legalRepAbsent": "አልተገኘም",
    "legalRepName": "ወኪል",
    "noLegalRepName": "ስም አልተመዘገበም።",
    "summarySection": "ማጠቃለያ",
    "recordingReference": "የቅጂ ማጣቀሻ",
    "noRecordingReference": "ምንም የቅጂ ማጣቀሻ የለም።",
    "immutableTooltip": "የምርምራ መዝገቦች ሊቀናጁ ወይም ሊሰረዙ አይችሉም።"
  }
}
```

---

# 14. UI Implementation — Arrests Tab

## 14.1 Route: `src/app/(dashboard)/cases/[caseId]/arrests/page.tsx`

Replace the Phase 3 skeleton. Server Component rendering `<ArrestsTab caseId={params.caseId} />`.

```typescript
import { getTranslations } from 'next-intl/server'
import { ArrestsTab } from '@features/arrests/components/ArrestsTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('arrests')
  return { title: t('pageTitle') }
}

export default function CaseArrestsPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <ArrestsTab caseId={params.caseId} />
}
```

## 14.2 `ArrestsTab.tsx` — Component Architecture

Client Component. Manages filter state (URL-driven via `nuqs`), and three drawer states: `createOpen`, `detailOpen/selectedArrestId`, `updateOpen/updateArrestId`.

### 14.2.1 Filter state (URL-driven)

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  detentionStatus: parseAsArrayOf(parseAsString).withDefault([]),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('arrestDate'),
  sortDirection: parseAsString.withDefault('desc'),
})
```

### 14.2.2 Drawer state (component-local)

```typescript
const [createOpen, setCreateOpen] = useState(false)
const [selectedArrestId, setSelectedArrestId] = useState<string | null>(null)
const [updateArrestId, setUpdateArrestId] = useState<string | null>(null)
```

Do not store drawer IDs in Zustand. Local `useState` is correct here.

### 14.2.3 PageHeader

```tsx
<PageHeader
  title={t('tab.heading')}
  description={`${data?.total ?? 0} ${t('tab.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.ARRESTS_MANAGE}>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('tab.recordArrest')}
      </Button>
    </PermissionGuard>
  }
/>
```

### 14.2.4 Filter Bar

Rendered below the PageHeader. Contains:
- Search input (`Search` icon, placeholder from `t('tab.filters.search')`) — debounced 300ms before updating URL
- Detention status multi-select filter — uses `DetentionStatus` enum values, each labelled via `t('detentionStatus.*')`
- Date range picker (From/To date fields)
- "Clear all filters" link button — visible only when any filter is active

Active filter chips appear below the filter bar in a `flex flex-wrap gap-2` row. Each chip: label, `×` remove button. Removing a chip updates the corresponding URL param.

### 14.2.5 DataTable Column Definitions

Define in `src/features/arrests/components/ArrestsTab.tsx` or a co-located `arrests-columns.tsx`:

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `arrestNumber` | Monospace text, `xs` font | Yes | 110px |
| `arrestedPerson` | `firstName lastName` linked (or plain if role < dept head) | No | 160px |
| `arrestingOfficer` | `firstName lastName (badgeNumber)` | No | 160px |
| `arrestDate` | `dd MMM yyyy HH:mm` | Yes | 130px |
| `location` | Truncated to 40 chars, full on tooltip | No | 150px |
| `detentionStatus` | `DetentionStatusBadge` | Yes | 120px |
| `bailStatus` | `BailStatusBadge` | No | 100px |
| `actions` | Kebab menu | No | 48px |

**Row click behaviour:** Clicking any row (not the kebab) opens `ArrestDetailDrawer` for that arrest ID.

**Kebab actions:**
- `t('tab.rowActions.view')` → opens `ArrestDetailDrawer`
- `t('tab.rowActions.updateStatus')` → opens `UpdateArrestDrawer` (investigator+)
- Separator
- `t('tab.rowActions.delete')` (destructive, red label) → `DestructiveConfirmDialog` (dept head+ only)

### 14.2.6 Status Badge Variants

**Detention Status badge variant mapping:**
```typescript
const DETENTION_STATUS_VARIANTS: Record<DetentionStatus, BadgeVariant> = {
  IN_CUSTODY:       'warning',     // Amber — person is currently held
  RELEASED_ON_BAIL: 'accent',      // Indigo — released with conditions
  RELEASED:         'success',     // Green — fully released
  TRANSFERRED:      'primary',     // Blue — moved elsewhere
}
```

**Bail Status badge variant mapping:**
```typescript
const BAIL_STATUS_VARIANTS: Record<BailStatus, BadgeVariant> = {
  NOT_SET:  'muted',        // Slate — not yet determined
  DENIED:   'destructive',  // Red — bail denied
  GRANTED:  'success',      // Green — bail approved
  POSTED:   'accent',       // Indigo — bail has been paid
}
```

---

# 15. UI Implementation — Create Arrest Drawer

## 15.1 `CreateArrestDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 15.1.1 Layout

```
CreateArrestDrawer (480px)
──────────────────────────────────────────────
  Record Arrest
  Record a new arrest linked to this case.
──────────────────────────────────────────────
 ┌── Section 1: Arrest Details ──────────────┐
 │  Arrested Person *    [SearchableSelect]   │
 │  (hint: suspects on this case only)        │
 │                                            │
 │  Arresting Officer *  [SearchableSelect]   │
 │  Date & Time *        [DatePicker]         │
 │  Location *           [Input]              │
 │  Warrant Number       [Input, optional]    │
 │                                            │
 │  Charges at Time of Arrest *              │
 │  ┌──────────────────────────────────────┐ │
 │  │  [Chip] Robbery  [×]                 │ │  ← Tag-style input
 │  │  [Chip] Assault  [×]                 │ │
 │  │  [+Add charge input + Enter]         │ │
 │  └──────────────────────────────────────┘ │
 │  Notes                [Textarea, optional] │
 └────────────────────────────────────────────┘

 ┌── Section 2: Bail Information ─────────────┐
 │  Bail Status          [Select]             │
 │  Bail Amount (ETB)    [Input, conditional] │  ← Only shown when GRANTED or POSTED
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                     [Record Arrest]
```

### 15.1.2 Person SearchableSelect (suspects on this case)

Use `SearchableSelect` with server-side search. The query function:

```typescript
const searchSuspects = async (searchTerm: string): Promise<SelectOption[]> => {
  const persons = await getCasePersons(caseId, {
    role: 'SUSPECT',
    search: searchTerm,
  })
  return persons.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
  }))
}
```

Include the hint text `t('create.arrestedPersonHint')` as a `<FormField>` helper below the select. If the case has no suspects, show an empty state inside the dropdown: "No suspects are linked to this case. Add suspects via the Personnel module first."

### 15.1.3 Charges at Arrest — tag-style input

This field is not a standard `Input` or `Textarea`. It functions as a **tag input**:
- An `<input>` field at the bottom of the charges area allows the officer to type a charge and press `Enter` (or Tab) to add it as a chip.
- Each chip shows the charge text with a `×` remove button.
- The chip list is managed in local state: `const [charges, setCharges] = useState<string[]>([])`
- React Hook Form value is registered via `setValue('chargesAtArrest', charges)` whenever charges change.
- Pressing `Backspace` on an empty input removes the last chip.
- Maximum 20 charges; if at max, disable the input and show "Maximum charges reached."

Chip styles: `background: var(--color-card-hover)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-sm)`, `padding: 2px 8px`, `font-size: 12px`.

### 15.1.4 Conditional bail amount field

Watch `bailStatus` via `useWatch`. When `GRANTED` or `POSTED`:
- Show the bail amount `<Input type="number" min="0" step="0.01" />` with the label `t('create.bailAmountLabel')`
- Animate with `max-height` expand (150ms ease-out) — same technique as evidence media section
- When bail status changes to `NOT_SET` or `DENIED`, collapse and clear the amount field

```typescript
const selectedBailStatus = watch('bailStatus')
const showBailAmount = BAIL_STATUSES_WITH_AMOUNT.includes(selectedBailStatus as BailStatus)
```

### 15.1.5 Submit logic

```typescript
const onSubmit = async (values: CreateArrestValues) => {
  await createArrestMutation.mutateAsync({
    ...values,
    chargesAtArrest: charges,
  })
  // onSuccess handled by hook — toast + invalidation
  onClose()
  form.reset()
  setCharges([])
}
```

On mutation error (from hook `onError`): toast is shown by the hook; drawer stays open.

Dirty state guard: if `formState.isDirty || charges.length > 0` and the officer closes the drawer, show `ConfirmDialog`: "Discard arrest record? You have unsaved changes."

---

# 16. UI Implementation — Arrest Detail Drawer

## 16.1 `ArrestDetailDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

Uses `useArrest(selectedArrestId)`. Shows a `<Skeleton>` version while loading.

### 16.1.1 Layout

```
ArrestDetailDrawer (480px)
──────────────────────────────────────────────
  Arrest Details                  ARR-2026-00018
──────────────────────────────────────────────
 ┌── Arrest Metadata ──────────────────────────┐
 │  Arrested Person   John Bekele               │
 │  Arresting Officer Insp. Sara Haile (BD-082) │
 │  Date & Time       14 Jun 2026  09:23 UTC    │
 │  Location          Bole Road, near Edna Mall │
 │  Warrant No.       WRN-2026-00041            │
 └────────────────────────────────────────────┘

 ┌── Status ───────────────────────────────────┐
 │  Detention    [In Custody badge]             │
 │  Bail         [Not Set badge]                │
 └────────────────────────────────────────────┘

 ┌── Charges at Time of Arrest ───────────────┐
 │  [Chip] Robbery  [Chip] Assault             │
 └────────────────────────────────────────────┘

 ┌── Court Appearance ────────────────────────┐
 │  "Not yet scheduled."  (or date if set)    │
 └────────────────────────────────────────────┘

 ┌── Notes ────────────────────────────────────┐
 │  ...notes text...                          │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [🗑 Delete (destructive)]   [Update Status]
```

### 16.1.2 Action buttons

- **Update Status** button: `PermissionGuard` requiring `arrests:manage`. Closes this drawer and opens `UpdateArrestDrawer` for the same arrest ID.
- **Delete** button: `PermissionGuard` requiring `arrests:delete` (dept head+ only). Destructive styling. Opens `DestructiveConfirmDialog` with:
  - Title: `t('delete.confirmTitle')`
  - Description: `t('delete.confirmDescription', { arrestNumber })`
  - Confirm phrase: `t('delete.confirmPhrase', { arrestNumber })`
  - On confirm: calls `useDeleteArrest` mutation; on success, both the confirm dialog and the detail drawer close

### 16.1.3 Charges display

Render charges as chips using the same style defined in Section 15.1.3. These chips have no `×` button (read-only context). If `chargesAtArrest` is empty, render `t('detail.noCharges')` in muted text.

---

# 17. UI Implementation — Update Arrest Drawer

## 17.1 `UpdateArrestDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 17.1.1 Purpose and scope

This drawer's sole purpose is updating `detentionStatus`, `bailStatus`, and `bailAmount`. It does not expose other arrest fields. This mirrors the case status transition drawer pattern established in Phase 3.

### 17.1.2 Form fields and layout

```
UpdateArrestDrawer (480px)
──────────────────────────────────────────────
  Update Detention Status       ARR-2026-00018
  Update the detention and bail status.
──────────────────────────────────────────────
 ┌── Current Status (read-only display) ──────┐
 │  Detention:  [In Custody badge]            │
 │  Bail:       [Not Set badge]               │
 └────────────────────────────────────────────┘

 ┌── Update ───────────────────────────────────┐
 │  Detention Status *   [Select]              │
 │  Bail Status *        [Select]              │
 │  Bail Amount (ETB)    [Input, conditional]  │
 │  Notes                [Textarea, optional]  │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                      [Save Changes]
```

Uses `useUpdateArrest(arrestId, caseId)`. On success: drawer closes, arrest detail and list queries invalidated automatically by the hook, toast confirms the update.

The `useArrest(arrestId)` data is used to pre-populate the current status display section and as default values for the form fields.

---

# 18. UI Implementation — Interrogations Tab

## 18.1 Route: `src/app/(dashboard)/cases/[caseId]/interrogations/page.tsx`

Replace the Phase 3 skeleton. Server Component rendering `<InterrogationsTab caseId={params.caseId} />`.

```typescript
import { getTranslations } from 'next-intl/server'
import { InterrogationsTab } from '@features/interrogations/components/InterrogationsTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('interrogations')
  return { title: t('pageTitle') }
}

export default function CaseInterrogationsPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <InterrogationsTab caseId={params.caseId} />
}
```

## 18.2 `InterrogationsTab.tsx` — Component Architecture

Client Component. Manages filter state (URL-driven) and two drawer states: `createOpen` and `selectedInterrogationId`.

### 18.2.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('interrogationDate'),
  sortDirection: parseAsString.withDefault('desc'),
})
```

### 18.2.2 PageHeader

```tsx
<PageHeader
  title={t('tab.heading')}
  description={`${data?.total ?? 0} ${t('tab.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.INTERROGATIONS_MANAGE}>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('tab.addInterrogation')}
      </Button>
    </PermissionGuard>
  }
/>
```

### 18.2.3 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `interrogationNumber` | Monospace, `xs` | Yes | 100px |
| `subject` | `firstName lastName` + role badge | No | 160px |
| `conductingOfficer` | `firstName lastName (badgeNumber)` | No | 160px |
| `interrogationDate` | `dd MMM yyyy HH:mm` | Yes | 130px |
| `location` | Truncated to 40 chars | No | 150px |
| `durationMinutes` | `{n} min` or `—` if null | No | 80px |
| `legalRepresentativePresent` | Yes/No badge | No | 90px |
| `actions` | Kebab menu | No | 48px |

**Subject role badge:** Render a small badge next to the subject's name indicating their role on the case: `t('roleOnCase.SUSPECT')` / `t('roleOnCase.VICTIM')` / `t('roleOnCase.WITNESS')`. Use `accent` variant for SUSPECT, `muted` for VICTIM/WITNESS.

**Legal rep badge:**
- Present: `success` variant, label `t('tab.legalRepYes')`
- Absent: `muted` variant, label `t('tab.legalRepNo')`

**Row click behaviour:** Clicking any row opens `InterrogationDetailDrawer`. There is no destructive row action. The only kebab action is `t('tab.rowActions.view')`.

---

# 19. UI Implementation — Create Interrogation Drawer

## 19.1 `CreateInterrogationDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 19.1.1 Layout

```
CreateInterrogationDrawer (480px)
──────────────────────────────────────────────
  Add Interrogation Record
  Log a new interrogation session for this case.
──────────────────────────────────────────────
 ┌── Section 1: Session Details ──────────────┐
 │  Subject *             [SearchableSelect]   │
 │  Conducting Officer *  [SearchableSelect]   │
 │  Date & Time *         [DatePicker]         │
 │  Location *            [Input]              │
 │  Duration (minutes)    [Input, optional]    │
 └────────────────────────────────────────────┘

 ┌── Section 2: Legal Representation ─────────┐
 │  Legal Rep Present?    [Toggle switch]      │
 │  Legal Rep Name        [Input, conditional] │  ← Only shown when toggle is ON
 └────────────────────────────────────────────┘

 ┌── Section 3: Summary ──────────────────────┐
 │  Interrogation Summary * [Textarea, tall]   │
 │  (hint: permanent record / court use)       │
 │  Recording Reference     [Input, optional]  │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                       [Save Record]
```

### 19.1.2 Subject SearchableSelect (all persons on this case)

```typescript
const searchPersons = async (searchTerm: string): Promise<SelectOption[]> => {
  const persons = await getCasePersons(caseId, { search: searchTerm })
  // No role filter — all linked persons (suspects, victims, witnesses) are shown
  return persons.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
  }))
}
```

The dropdown option renders the person's name with their role (if known), e.g. "Alem Tadesse — Suspect". This requires the `getCasePersons` response to include a `roleOnCase` field. Adjust the type if the API provides it.

### 19.1.3 Legal representative conditional field

```typescript
const legalRepPresent = watch('legalRepresentativePresent')
```

When `legalRepPresent === true`: animate the `legalRepresentativeName` input into view (same `max-height` expand as bail amount). When toggled off: collapse and clear the name.

Use a `<Switch>` (Radix-based, from shadcn/ui) for the toggle. Its value is registered via `Controller` in React Hook Form.

### 19.1.4 Summary textarea

The summary `<Textarea>` should be taller than the standard field: `min-height: 160px` (approximately 6 rows). It has a character counter in the bottom-right corner (current / 5000). Render the counter in `xs` muted text.

Below the textarea, render the helper text `t('create.summaryHint')` in `xs` `var(--color-warning)` (amber) — this emphasises the permanence of the record. Use `AlertTriangle` icon (12px) before the text.

### 19.1.5 Submit logic

```typescript
const onSubmit = async (values: CreateInterrogationValues) => {
  await createInterrogationMutation.mutateAsync(values)
  onClose()
  form.reset()
}
```

No dirty state guard is needed for the decision to cancel — interrogation records are created in a single operation and there is no multi-step flow.

---

# 20. UI Implementation — Interrogation Detail Drawer

## 20.1 `InterrogationDetailDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). This is a **read-only** drawer. No edit or delete buttons.

### 20.1.1 Immutability indicator

Immediately below the drawer title/subtitle area, render a notice bar:

```
┌────────────────────────────────────────────────────────────┐
│  🔒  This record is permanent and cannot be edited.        │
└────────────────────────────────────────────────────────────┘
```

Style: `background: var(--color-card-hover)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-sm)`, `padding: 8px 12px`, `font-size: 12px`, `color: var(--color-foreground-muted)`. `Lock` icon (14px, muted).

In the drawer header, place a `Lock` icon tooltip next to the record number with text `t('detail.immutableTooltip')`.

### 20.1.2 Layout

```
InterrogationDetailDrawer (480px)
──────────────────────────────────────────────
  Interrogation Record     🔒  INT-2026-00007
  [Immutability notice bar]
──────────────────────────────────────────────
 ┌── Record Metadata ─────────────────────────┐
 │  Subject          Alem Tadesse [Suspect]    │
 │  Conducted By     Insp. Dawit (BD-00142)    │
 │  Date & Time      14 Jun 2026  14:30 UTC    │
 │  Location         Interview Room 3          │
 │  Duration         90 minutes                │
 └────────────────────────────────────────────┘

 ┌── Legal Representation ────────────────────┐
 │  Present?        [Present badge]           │
 │  Representative  Ato Haile Gebre (Lawyer)  │
 └────────────────────────────────────────────┘

 ┌── Summary ──────────────────────────────────┐
 │  [Full summary text, whitespace-preserved] │
 └────────────────────────────────────────────┘

 ┌── Recording ────────────────────────────────┐
 │  Reference:  VID-2026-INT-0042             │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Close]
```

The Summary section uses `whitespace-pre-wrap` to preserve line breaks entered by the investigator. The text is rendered as `plain text` — never as HTML. The `monospace` font is NOT used here (the summary is narrative text). Use `var(--font-sans)` at `base` size.

The data is fetched from `useInterrogationList` data already in the cache — for the detail drawer, find the matching item by ID from the list. If additional fields (summary, recordingReference) are not in the list response, add `useInterrogationDetail(interrogationId)` as a separate hook fetching from `GET /api/v1/cases/{caseId}/interrogations/{id}` — only if the backend supports it. If the backend does not provide a detail endpoint, all necessary fields must be included in the list response.

---

# 21. caseKeys Update

## 21.1 Verify and extend `caseKeys.ts`

Open `src/services/query/keys/caseKeys.ts`. Verify these sub-resource keys exist under the `caseKeys` factory. If any are missing, add them:

```typescript
// Sub-resource keys (add if missing)
arrests: (caseId: string) =>
  [...caseKeys.detail(caseId), 'arrests'] as const,
interrogations: (caseId: string) =>
  [...caseKeys.detail(caseId), 'interrogations'] as const,
```

These keys are used by the case overview tab count cards (established in Phase 3). After mutations in this phase, both `caseKeys.arrests(caseId)` and `caseKeys.interrogations(caseId)` are invalidated so the count numbers update without a page refresh.

---

# 22. Permission Guard Matrix

| Action | Required Permission / Role | Guard Type |
|---|---|---|
| View arrests tab | Any authenticated | Route access check (investigator+) |
| See "Record Arrest" button | `arrests:manage` | `PermissionGuard` |
| Open arrest detail drawer | Any authenticated (tab access) | No guard |
| Open "Update Status" button | `arrests:manage` | `PermissionGuard` |
| Delete arrest | `arrests:delete` (dept head+) | `PermissionGuard` |
| View interrogations tab | Any authenticated | Route access check (investigator+) |
| See "Add Interrogation" button | `interrogations:manage` | `PermissionGuard` |
| Open interrogation detail drawer | Any authenticated (tab access) | No guard |
| Delete interrogation | Not available — records are immutable | N/A |

**Tab disabled state:** The Arrests and Interrogations tabs are accessible to `investigator+`. For roles below investigator (e.g. `legal officer` without investigator rights), both tabs render as disabled (grey, lock icon) in the case tab navigation. They are not hidden. This matches the blueprint's disabled-vs-hidden policy.

---

# 23. Design Specifications

## 23.1 Arrest detail — bail amount display

When bail amount is set, render it with currency formatting:

```typescript
const formatBailAmount = (amount: number, locale: string): string =>
  new Intl.NumberFormat(locale === 'am' ? 'am-ET' : 'en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
```

Render as `t('detail.bailAmountValue', { amount: formattedAmount })`. Do not use the browser's Intl currency formatter with `style: 'currency'` — ETB support varies.

## 23.2 Duration display — interrogations

When `durationMinutes` is set, convert for display:

```typescript
function formatDuration(minutes: number, t: TranslateFunction): string {
  if (minutes < 60) return t('tab.durationValue', { minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
```

When `durationMinutes` is null, display `t('tab.durationUnknown')` (`—`).

## 23.3 Charges chips — consistent styling

Both the create form and the detail drawer must render charge chips identically:
- `background: var(--color-card-hover)`
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-sm)` (4px)
- `padding: 2px 8px`
- `font-size: 12px` (`sm` scale)
- `color: var(--color-foreground-muted)` in the detail view
- `color: var(--color-foreground)` in the create form (editable context)

## 23.4 Empty states

Both tabs must render meaningful empty states using `<EmptyState>`.

**Arrests empty state:**
- Icon: `UserX` from Lucide
- Title: `t('tab.empty')`
- Description: `t('tab.emptyDescription')` — shown only when `arrests:manage` permission exists
- CTA button: "Record Arrest" — `PermissionGuard` wrapping, same as the PageHeader button

**Interrogations empty state:**
- Icon: `MessageSquareOff` from Lucide
- Title: `t('tab.empty')`
- Description: `t('tab.emptyDescription')` — shown only when `interrogations:manage` permission exists
- CTA button: "Add Interrogation" — `PermissionGuard` wrapping

**Filtered empty state** (when filters are active and no results):
- Icon: `SearchX` from Lucide
- Title: `t('tab.emptyFiltered')`
- No CTA button — a "Clear filters" link instead

## 23.5 Loading skeletons

Both tabs render `<TableSkeleton>` on initial load matching the column count of their respective tables. Use `placeholderData: (prev) => prev` in React Query to keep existing rows visible during background refetches (no skeleton on refetch — only on initial load when `data === undefined`).

## 23.6 Information density

The arrests and interrogations tabs follow the same compact row density as the evidence table: `56px` standard row height (not compact mode). The `detentionStatus` and `bailStatus` badges must align vertically within cells. Both status badges render in a single `<td>` column each — they are not stacked.

---

# 24. Testing Requirements

## 24.1 Schema tests — `src/features/arrests/schemas/`

**`create-arrest.schema.test.ts`:**
- Valid payload passes
- Missing `arrestedPersonId` fails with required message
- Missing `arrestingOfficerId` fails
- `chargesAtArrest` empty array fails with "at least one charge"
- `bailStatus: GRANTED` with `bailAmount: null` fails the refinement
- `bailStatus: POSTED` with `bailAmount: undefined` fails the refinement
- `bailStatus: DENIED` with `bailAmount` undefined passes
- `bailStatus: NOT_SET` with `bailAmount` undefined passes

**`update-arrest.schema.test.ts`:**
- Valid update payload passes
- `bailStatus: GRANTED` without `bailAmount` fails
- Partial payload with only `detentionStatus` passes

## 24.2 Schema tests — `src/features/interrogations/schemas/`

**`create-interrogation.schema.test.ts`:**
- Valid payload passes
- `summary` shorter than 10 chars fails
- Missing `subjectId` fails
- Missing `conductingOfficerId` fails
- `durationMinutes: 0` fails (must be positive)
- `durationMinutes: null` passes (optional)

## 24.3 Hook tests — `src/features/arrests/hooks/`

**`useCreateArrest.test.ts`:**
- On success: `arrestKeys.caseArrests(caseId)`, `caseKeys.arrests(caseId)`, and `caseKeys.summary(caseId)` are all invalidated
- On success: `addToast` is called with `variant: 'success'`
- On API error: `addToast` is called with `variant: 'error'`

**`useDeleteArrest.test.ts`:**
- On success: arrest list and case summary are invalidated
- On success: success toast is shown

## 24.4 Hook tests — `src/features/interrogations/hooks/`

**`useCreateInterrogation.test.ts`:**
- On success: `interrogationKeys.caseInterrogations(caseId)`, `caseKeys.interrogations(caseId)`, and `caseKeys.summary(caseId)` are invalidated
- On success: success toast shown

## 24.5 Component tests — `src/features/arrests/components/`

**`ArrestsTab.test.tsx`:**
- "Record Arrest" button is visible for officers with `arrests:manage` permission
- "Record Arrest" button is absent for officers without `arrests:manage` permission
- Search filter updates the URL `search` param on debounce
- Detention status filter chips appear and can be dismissed
- Clicking a row opens `ArrestDetailDrawer`
- Loading skeleton renders on initial load
- Empty state renders when `data.total === 0` and no filters are active
- Filtered empty state renders when `data.total === 0` and a filter is active

**`CreateArrestDrawer.test.tsx`:**
- Renders without the bail amount field when `bailStatus === NOT_SET`
- Bail amount field appears when `bailStatus` changed to `GRANTED`
- Bail amount field disappears when `bailStatus` changed back to `NOT_SET`
- Adding a charge chip and pressing Enter updates the `chargesAtArrest` list
- Pressing `Backspace` on empty input removes the last charge chip
- Submitting without charges shows validation error

**`ArrestDetailDrawer.test.tsx`:**
- Charges are rendered as read-only chips (no `×` button)
- "Update Detention Status" button is visible for `arrests:manage` permission
- "Delete" button is visible for `arrests:delete` permission
- "Delete" button triggers `DestructiveConfirmDialog`

## 24.6 Component tests — `src/features/interrogations/components/`

**`InterrogationsTab.test.tsx`:**
- "Add Interrogation" button is visible with `interrogations:manage` permission
- "Add Interrogation" button is absent without that permission
- Legal rep badge "Present" renders green for `legalRepresentativePresent: true`
- Duration column shows "—" for `durationMinutes: null`
- Clicking a row opens `InterrogationDetailDrawer`

**`CreateInterrogationDrawer.test.tsx`:**
- Legal rep name input is hidden when toggle is off
- Legal rep name input appears when toggle is switched on
- Summary character counter shows correct count
- Submitting without summary shows validation error

**`InterrogationDetailDrawer.test.tsx`:**
- Immutability notice bar is visible
- No edit or delete buttons are rendered
- Summary is rendered with `whitespace-pre-wrap`

---

# 25. Anti-Patterns Specific to This Phase

**Form and mutation violations:**
- Storing the create/detail/update drawer open state in Zustand — use local `useState` in the tab component
- Storing arrest IDs or interrogation IDs in Zustand — same, local state only
- Storing `chargesAtArrest` only in React Hook Form without tracking it in separate `useState` — you need a parallel `charges: string[]` state because the tag input is not a standard HTML input element. Sync both on every change
- Starting the arrest create mutation before Zod schema validation — `handleSubmit` from React Hook Form validates first; never call `mutateAsync` directly outside of `handleSubmit`
- Closing the create drawer on mutation error — always keep it open so the officer's data is preserved

**Evidence-specific patterns incorrectly applied:**
- Using a `FileUploadZone` in the arrest or interrogation forms — these modules do not support file attachments
- Using `uploadState` phase tracking — there is no multi-step upload in this phase
- Optimistic updates on arrest status — the blueprint explicitly prohibits this for case status transitions and the same rule applies here. The `detentionStatus` and `bailStatus` are legal states that the server must validate

**Interrogation immutability violations:**
- Adding an edit button to `InterrogationDetailDrawer` — interrogation records are immutable once created
- Adding a delete action to interrogation rows — not permitted. There is no `useDeleteInterrogation` hook; do not create one
- Using `useUpdateInterrogation` — do not create this hook in this phase

**Query key violations:**
- Not invalidating `caseKeys.arrests(caseId)` after an arrest mutation — this is the key the case overview tab arrest count card uses
- Not invalidating `caseKeys.interrogations(caseId)` after creating an interrogation — same
- Not invalidating `caseKeys.summary(caseId)` after mutations — the overview tab's count cards depend on this

**DataTable violations:**
- Using client-side filtering on the arrests or interrogations tables — all filtering must translate to API query parameters, exactly as in Phase 4 (evidence)
- Not syncing filter params to URL — the `useQueryStates` (nuqs) pattern from Phase 4 must be applied identically here. All list filters must survive page refresh

**i18n violations:**
- Hardcoding detention status labels in components instead of using `t('detentionStatus.*')`
- Hardcoding role labels (SUSPECT/VICTIM/WITNESS) in the interrogations subject column instead of `t('roleOnCase.*')`

**Bail amount display:**
- Rendering raw numbers (`5000`) instead of formatted currency (`5,000.00 ETB`)
- Rendering bail amount when `bailAmount === null` — always check for null before displaying; render `t('detail.noBailAmount')` (`—`) otherwise

---

# 26. Final Verification Checklist

## 26.1 Arrests Tab

- [ ] `/cases/[caseId]/arrests` renders the full DataTable (not the Phase 3 skeleton)
- [ ] "Record Arrest" button is visible for `arrests:manage` permission
- [ ] "Record Arrest" button is absent for lower roles
- [ ] Search filter updates the URL `search` param and refetches
- [ ] Detention status filter chips appear and can be dismissed
- [ ] Filter state survives page refresh
- [ ] Clicking a row opens `ArrestDetailDrawer`
- [ ] Loading skeleton renders on first load
- [ ] Empty state with CTA renders when no arrests exist
- [ ] Filtered empty state (no CTA) renders when filters yield no results
- [ ] Detention status badge colours are correct per the variant mapping

## 26.2 Create Arrest

- [ ] Opening the create drawer shows a clean empty form
- [ ] Person search shows only suspects linked to this case
- [ ] Charges tag input: pressing Enter adds a chip
- [ ] Charges tag input: pressing Backspace on empty input removes last chip
- [ ] Charges validation: submitting with no charges shows inline error
- [ ] Bail amount field is hidden when `bailStatus` is `NOT_SET` or `DENIED`
- [ ] Bail amount field appears when `bailStatus` is `GRANTED` or `POSTED`
- [ ] Bail amount validation: submitting `GRANTED` with no amount shows error
- [ ] Closing a dirty form shows the unsaved-changes confirmation dialog
- [ ] On success: drawer closes, arrests list refreshes, case overview arrest count updates
- [ ] On mutation error: drawer stays open, error toast is shown

## 26.3 Arrest Detail Drawer

- [ ] Opens on row click showing all arrest fields
- [ ] Charges render as read-only chips (no remove button)
- [ ] Bail amount renders as formatted currency when set
- [ ] Bail amount renders as `—` when null
- [ ] "Update Detention Status" button is visible for `arrests:manage`
- [ ] "Update Detention Status" opens the `UpdateArrestDrawer`
- [ ] "Delete" button is visible for `arrests:delete`
- [ ] "Delete" opens `DestructiveConfirmDialog` with the correct confirm phrase
- [ ] Confirming delete removes the arrest, closes both dialogs, refreshes the list

## 26.4 Update Arrest Drawer

- [ ] Opens showing current detention and bail status
- [ ] Current status section reflects live data from the arrest record
- [ ] Bail amount field appears/disappears based on selected bail status
- [ ] On success: drawer closes, arrest detail and list queries refresh

## 26.5 Interrogations Tab

- [ ] `/cases/[caseId]/interrogations` renders the full DataTable (not the Phase 3 skeleton)
- [ ] "Add Interrogation" button is visible for `interrogations:manage`
- [ ] "Add Interrogation" button is absent for lower roles
- [ ] Subject column shows person name + role badge
- [ ] Duration column shows formatted time or `—` for null
- [ ] Legal rep column shows "Present" (green) or "Absent" (muted) badge
- [ ] Clicking a row opens `InterrogationDetailDrawer`
- [ ] Search filter updates URL and refetches
- [ ] Empty state renders correctly

## 26.6 Create Interrogation

- [ ] Subject search shows all persons linked to the case (suspects + victims + witnesses)
- [ ] Legal rep name input is hidden when toggle is OFF
- [ ] Legal rep name input appears when toggle is switched ON
- [ ] Summary character counter increments as user types
- [ ] Submitting with summary shorter than 10 chars shows validation error
- [ ] On success: drawer closes, interrogations list refreshes, case overview count updates
- [ ] On error: drawer stays open, error toast shown

## 26.7 Interrogation Detail Drawer

- [ ] Immutability notice bar is visible at the top of the drawer
- [ ] Lock icon with tooltip is visible in the drawer header
- [ ] No edit or delete buttons are rendered anywhere in this drawer
- [ ] Summary is rendered with whitespace-preserve (line breaks preserved)
- [ ] Legal rep section shows representative's name when present
- [ ] Legal rep section shows "Name not recorded" when absent

## 26.8 Case Overview Tab — Count Cards

- [ ] After creating an arrest: Arrests count card on the case overview tab increments
- [ ] After deleting an arrest: Arrests count card decrements
- [ ] After creating an interrogation: Interrogations count card increments

## 26.9 i18n

- [ ] All arrests UI text is retrieved from message files (no hardcoded English)
- [ ] Switching to Amharic updates all text in the arrests tab, create drawer, detail drawer, update drawer
- [ ] Switching to Amharic updates all text in the interrogations tab, create drawer, detail drawer
- [ ] i18n completeness test passes with zero missing keys in `arrests` namespace
- [ ] i18n completeness test passes with zero missing keys in `interrogations` namespace
- [ ] Detention status labels render in the selected locale
- [ ] Bail status labels render in the selected locale
- [ ] Role-on-case labels (SUSPECT/VICTIM/WITNESS) render in the selected locale

## 26.10 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` — all arrests and interrogations tests pass
- [ ] `pnpm build` — production build succeeds without errors

---

*End of CCMS Phase 5 Instruction — Arrests & Interrogations Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 6 will implement the Legal module (Legal tab, court case panel, charges table, charge filing drawer, sentencing)*