# CCMS Frontend — Phase 8: Departments & Admin Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 7 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab, status transition drawer
- **Evidence Module**: Evidence tab, upload drawer (Cloudinary three-step flow), chain of custody timeline, lightbox viewer
- **Arrests Module**: Arrests tab (DataTable + filter bar), create arrest drawer, arrest detail drawer, update detention/bail status drawer
- **Interrogations Module**: Interrogations tab (DataTable + filter bar), create interrogation drawer, read-only interrogation detail drawer
- **Legal Module**: Legal tab (court case panel + charges table), create/update court case drawers, add/update/drop charge drawers, record/view sentence drawers, court cases list page
- **Personnel Module**: Person list page (PII masking), person detail page (role cards, PII reveal), role promotion drawers (Suspect, Victim, Witness), officer list page, officer detail page, officer management dialogs (Deactivate, Activate, Reset Password), create person drawer, create officer drawer
- **Route coverage**: All nine case tab skeletons replaced with real content; `/personnel/persons`, `/personnel/persons/[personId]`, `/personnel/officers`, `/personnel/officers/[officerId]` are fully operational; `/departments`, `/departments/[departmentId]`, `/admin/locations`, `/admin/crime-types`, `/admin/health` skeleton routes are in place; settings skeletons render
- **i18n completeness**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases`, `evidence`, `arrests`, `interrogations`, `legal`, and `personnel` namespaces

## 1.2 Phase 8 Objective

Phase 8 delivers two modules:

1. **Departments Module** — The organisational backbone of the system. Departments group officers into units, scope investigations, and determine which officers see which data. Every officer belongs to exactly one department; every case is assigned to a department. The department module exposes this structure for management.

2. **Admin Module** — The system's reference data and health management layer. It provides admin-only management of locations (geographic reference data used in cases and departments), crime types (the taxonomy of offences used when creating cases and charges), and the live system health panel.

**Phase 8 delivers six sub-systems:**

1. **Department List Page** — Replaces the Phase 1 skeleton at `/departments`. Full DataTable with search, location filter, head-officer filter. Shows officer count, active case count, head officer badge.
2. **Department Detail Page** — Replaces the Phase 1 skeleton at `/departments/[departmentId]`. Single-column page (NOT tabbed) with metadata card, head officer card, compact officers table.
3. **Department Management Drawers/Dialogs** — `CreateDepartmentDrawer`, `UpdateDepartmentDrawer`, `DeleteDepartmentDialog`, `AssignHeadOfficerDrawer`, `RemoveHeadOfficerDialog`.
4. **Locations Admin Page** — Replaces the Phase 1 skeleton at `/admin/locations`. Simple DataTable of all geographic locations with create and delete actions.
5. **Crime Types Admin Page** — Replaces the Phase 1 skeleton at `/admin/crime-types`. Simple DataTable of all crime type definitions with create and delete actions.
6. **System Health Panel** — Replaces the Phase 1 skeleton at `/admin/health`. Live-polling panel showing database, Redis, and API service health plus system metrics.

**Also in scope:**

- `departments` feature module: full type definitions, Zod schemas, service implementation, React Query hooks
- `admin` feature module: full type definitions, Zod schemas, service implementation, React Query hooks
- `departmentKeys` query key factory at `src/services/query/keys/departmentKeys.ts`
- `adminKeys` query key factory at `src/services/query/keys/adminKeys.ts`
- `departments.service.ts` replacing all stubs with real Axios calls (all 8 endpoints)
- `admin.service.ts` replacing all stubs with real Axios calls (all 7 endpoints)
- Full population of `messages/en/departments.json`, `messages/am/departments.json`, `messages/en/admin.json`, `messages/am/admin.json`
- New shared component `DepartmentSelect` at `shared/components/forms/DepartmentSelect.tsx` — consumed by the officer creation drawer (already referenced in Phase 7) and by department filter bars

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Departments service (`src/services/domain/departments.service.ts`):**
- Replace all stubs with real Axios calls
- All 8 endpoints (see §11)
- Response validation via Zod `.parse()` on every response
- Typed return values throughout — no `any`

**Admin service (`src/services/domain/admin.service.ts`):**
- Replace all stubs with real Axios calls
- All 7 endpoints (see §12)
- Response validation via Zod `.parse()` on every response
- Typed return values throughout — no `any`

**Departments types and schemas:**
- `Department`, `DepartmentListItem`, `LocationRef`, `HeadOfficerRef`, `DepartmentOfficerSummary`, `DepartmentFilters`, `CreateDepartmentPayload`, `UpdateDepartmentPayload`, `AssignHeadOfficerPayload`
- Zod schemas: `createDepartmentSchema`, `updateDepartmentSchema`, `assignHeadOfficerSchema`, all API response schemas, filter schema

**Admin types and schemas:**
- `Location`, `CreateLocationPayload`, `CrimeType`, `CrimeSeverity`, `CreateCrimeTypePayload`, `HealthStatus`, `ServiceHealth`, `SystemHealth`, `SystemReadiness`
- Zod schemas: `createLocationSchema`, `createCrimeTypeSchema`, all API response schemas

**React Query hooks — Departments:**
- `useDepartmentList(filters)` — paginated list
- `useDepartmentDetail(departmentId)` — single department detail
- `useCreateDepartment()` — create mutation (admin+)
- `useUpdateDepartment(departmentId)` — update mutation (admin+)
- `useDeleteDepartment(departmentId)` — delete mutation (admin+)
- `useAssignHeadOfficer(departmentId)` — assign head mutation (admin+)
- `useRemoveHeadOfficer(departmentId)` — remove head mutation (admin+)
- `useDepartmentOfficers(departmentId)` — officers in this department (compact list)

**React Query hooks — Admin:**
- `useSystemHealth()` — polling query, 15-second interval
- `useSystemReadiness()` — polling query, 15-second interval
- `useLocationList(filters)` — paginated list
- `useCreateLocation()` — create mutation (admin+)
- `useDeleteLocation(locationId)` — delete mutation (admin+)
- `useCrimeTypeList(filters)` — paginated list
- `useCreateCrimeType()` — create mutation (admin+)
- `useDeleteCrimeType(crimeTypeId)` — delete mutation (admin+)

**Shared component:**
- `DepartmentSelect` at `src/shared/components/forms/DepartmentSelect.tsx`

**i18n messages:**
- Fully populate `messages/en/departments.json`
- Fully populate `messages/am/departments.json`
- Fully populate `messages/en/admin.json`
- Fully populate `messages/am/admin.json`

## 1.5 What Must NOT Be Implemented

- **Department head audit history** — the full `AuditTimeline` for department head changes is a Phase 11 deliverable. Do not implement.
- **Department CSV export** — deferred to Phase 11.
- **Bulk department operations** — deferred to Phase 11.
- **Location editing (PATCH)** — locations are append-only reference data in Phase 8. To correct a location, delete and recreate it. The backend enforces immutability for locations referenced by active cases.
- **Crime type editing (PATCH)** — same rule. Crime types are append-only in Phase 8.
- **Officer transfer between departments via the Departments UI** — officer department assignment is managed from the officer detail page (Phase 7). The department detail page shows officers but does not provide a transfer action.
- **Department head role promotion** — when an officer is assigned as department head, the backend may update their role to `DEPT_HEAD`. The frontend does not explicitly change the officer's role from this UI. It calls the assign-head endpoint and lets the backend handle role management.
- **Sub-department / department hierarchy** — CCMS departments are flat. No parent-child relationships.
- **Crime type category management** — categories are free-text strings on crime types. No separate category entity management in this phase.
- **Historical health metrics / graphs** — the health panel shows current status only. No trend charts, no historical data. Charts are a Phase 11 concern.
- **MSW mocking** — still deferred.

## 1.6 Handoff Standard

When Phase 8 finishes:
- Navigating to `/departments` shows the full departments DataTable (not the skeleton)
- Departments list shows officer count, active case count, head officer name, location name
- Departments with no head officer show a "No Head" muted badge in the head officer column
- Admin+ sees "New Department" button; lower roles see the list read-only
- Clicking a department row navigates to `/departments/[departmentId]`
- Department detail shows metadata card, head officer card (or "No head assigned" with Assign button for admin+), and compact officers table
- Admin+ "Edit" button opens `UpdateDepartmentDrawer`; saving refreshes the detail page
- Admin+ "Assign Head" button opens `AssignHeadOfficerDrawer` with officer search; confirming refreshes the head officer card
- Admin+ "Remove Head" button opens `RemoveHeadOfficerDialog`; confirming shows "No head assigned" state
- Admin+ "Delete" button opens `DeleteDepartmentDialog`; if `officerCount > 0` the dialog warns that deletion will be rejected by the backend
- Navigating to `/admin/locations` shows the locations DataTable
- Admin+ sees "New Location" button; clicking opens `CreateLocationDrawer`
- Admin+ delete action on a location opens `DeleteLocationDialog`; confirming removes the record (or shows API error if referenced)
- Navigating to `/admin/crime-types` shows the crime types DataTable
- Admin+ sees "New Crime Type" button; clicking opens `CreateCrimeTypeDrawer`
- Admin+ delete action on a crime type opens `DeleteCrimeTypeDialog`
- Navigating to `/admin/health` shows the live health panel; indicators update every 15 seconds without a page refresh
- Health status uses green/amber/red visual indicators per service
- `DepartmentSelect` shared component works correctly in the `CreateOfficerDrawer` (Phase 7 component) — it fetches real departments from the now-implemented service
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds
- i18n completeness test passes for `departments` and `admin` namespaces in both EN and AM

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
│   ├── departments/
│   │   ├── components/
│   │   │   ├── DepartmentsList.tsx              # List page component
│   │   │   ├── DepartmentDetail.tsx             # Detail page orchestration wrapper
│   │   │   ├── DepartmentMetadataCard.tsx       # Name, code, location, description, stats
│   │   │   ├── DepartmentHeadCard.tsx           # Head officer display + assign/remove actions
│   │   │   ├── DepartmentOfficersTable.tsx      # Compact officers DataTable
│   │   │   ├── CreateDepartmentDrawer.tsx       # SlideOverDrawer — create department
│   │   │   ├── UpdateDepartmentDrawer.tsx       # SlideOverDrawer — update department
│   │   │   ├── DeleteDepartmentDialog.tsx       # DestructiveConfirmDialog wrapper
│   │   │   ├── AssignHeadOfficerDrawer.tsx      # SlideOverDrawer — assign head officer
│   │   │   └── RemoveHeadOfficerDialog.tsx      # DestructiveConfirmDialog wrapper
│   │   ├── hooks/
│   │   │   ├── useDepartmentList.ts
│   │   │   ├── useDepartmentDetail.ts
│   │   │   ├── useCreateDepartment.ts
│   │   │   ├── useUpdateDepartment.ts
│   │   │   ├── useDeleteDepartment.ts
│   │   │   ├── useAssignHeadOfficer.ts
│   │   │   ├── useRemoveHeadOfficer.ts
│   │   │   ├── useDepartmentOfficers.ts
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── department.schema.ts
│   │   │   └── department-api.schema.ts
│   │   ├── types/
│   │   │   ├── department.types.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── departmentUtils.ts
│   │   └── index.ts
│   │
│   └── admin/
│       ├── components/
│       │   ├── health/
│       │   │   ├── SystemHealthPanel.tsx        # Orchestration wrapper
│       │   │   ├── HealthStatusCard.tsx         # Per-service status card
│       │   │   └── HealthMetricCard.tsx         # Metric display card (sessions, P95, backup)
│       │   ├── locations/
│       │   │   ├── LocationsList.tsx            # List + inline management
│       │   │   ├── CreateLocationDrawer.tsx     # SlideOverDrawer — create location
│       │   │   └── DeleteLocationDialog.tsx     # DestructiveConfirmDialog wrapper
│       │   └── crime-types/
│       │       ├── CrimeTypesList.tsx           # List + inline management
│       │       ├── CreateCrimeTypeDrawer.tsx    # SlideOverDrawer — create crime type
│       │       └── DeleteCrimeTypeDialog.tsx    # DestructiveConfirmDialog wrapper
│       ├── hooks/
│       │   ├── useSystemHealth.ts
│       │   ├── useSystemReadiness.ts
│       │   ├── useLocationList.ts
│       │   ├── useCreateLocation.ts
│       │   ├── useDeleteLocation.ts
│       │   ├── useCrimeTypeList.ts
│       │   ├── useCreateCrimeType.ts
│       │   ├── useDeleteCrimeType.ts
│       │   └── index.ts
│       ├── schemas/
│       │   ├── location.schema.ts
│       │   ├── crime-type.schema.ts
│       │   └── admin-api.schema.ts
│       ├── types/
│       │   ├── admin.types.ts
│       │   └── index.ts
│       ├── utils/
│       │   └── adminUtils.ts
│       └── index.ts

├── shared/
│   └── components/
│       └── forms/
│           └── DepartmentSelect.tsx             # New shared component

├── services/
│   └── query/
│       └── keys/
│           ├── departmentKeys.ts               # New — query key factory
│           └── adminKeys.ts                    # New — query key factory

└── app/
    └── (dashboard)/
        ├── departments/
        │   ├── page.tsx                        # Replaces Phase 1 skeleton
        │   └── [departmentId]/
        │       └── page.tsx                    # Replaces Phase 1 skeleton
        └── admin/
            ├── locations/
            │   └── page.tsx                    # Replaces Phase 1 skeleton
            ├── crime-types/
            │   └── page.tsx                    # Replaces Phase 1 skeleton
            └── health/
                └── page.tsx                    # Replaces Phase 1 skeleton

messages/
├── en/
│   ├── departments.json                        # Full EN population
│   └── admin.json                             # Full EN population
└── am/
    ├── departments.json                        # Full AM population
    └── admin.json                             # Full AM population
```

---

# 4. TypeScript Types — Departments

## 4.1 `src/features/departments/types/department.types.ts`

```typescript
// ─── Embedded Location reference ─────────────────────────────────────────────
// Returned inline on department responses — not the full Location entity
export interface LocationRef {
  id: string
  name: string
  region: string | null
}

// ─── Embedded Head Officer reference ─────────────────────────────────────────
// Returned inline on department responses — not the full Officer entity
export interface HeadOfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

// ─── Department List Item (for DataTable) ────────────────────────────────────
export interface DepartmentListItem {
  id: string
  name: string
  code: string | null              // Short code e.g. "CID", "HOM", "FORNS"
  location: LocationRef | null
  headOfficer: HeadOfficerRef | null
  officerCount: number             // Total officer accounts in this department
  activeCaseCount: number          // Cases with status Open or Under Investigation
  createdAt: string                // ISO 8601
}

// ─── Department Detail ────────────────────────────────────────────────────────
export interface Department extends DepartmentListItem {
  description: string | null
  updatedAt: string
}

// ─── Department Officer Summary (for compact officers table on detail page) ──
// Uses string for role/status to avoid importing from @features/personnel
// Values are identical to OfficerRole and OfficerStatus enums from personnel module
export interface DepartmentOfficerSummary {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  role: string                     // Matches OfficerRole enum values
  status: string                   // Matches OfficerStatus enum values
  joinedAt: string                 // When this officer's account was created in this department
}

// ─── Department Filters ───────────────────────────────────────────────────────
export interface DepartmentFilters {
  search?: string                  // Searches name and code
  locationId?: string
  hasHeadOfficer?: boolean
  page?: number
  pageSize?: number
  sortField?: 'name' | 'officerCount' | 'activeCaseCount' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

// ─── Department Payloads ──────────────────────────────────────────────────────
export interface CreateDepartmentPayload {
  name: string
  code?: string
  locationId?: string
  description?: string
}

export interface UpdateDepartmentPayload {
  name?: string
  code?: string | null
  locationId?: string | null
  description?: string | null
}

export interface AssignHeadOfficerPayload {
  officerId: string
}
```

## 4.2 `src/features/departments/types/index.ts`

```typescript
export * from './department.types'
```

---

# 5. TypeScript Types — Admin

## 5.1 `src/features/admin/types/admin.types.ts`

```typescript
// ─── Location ─────────────────────────────────────────────────────────────────
export interface Location {
  id: string
  name: string
  region: string | null
  country: string
  createdAt: string
}

export interface LocationFilters {
  search?: string
  page?: number
  pageSize?: number
  sortField?: 'name' | 'country' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

export interface CreateLocationPayload {
  name: string
  region?: string
  country: string
}

// ─── Crime Severity enum ──────────────────────────────────────────────────────
export const CrimeSeverity = {
  MISDEMEANOR: 'MISDEMEANOR',
  FELONY:      'FELONY',
  CAPITAL:     'CAPITAL',
} as const
export type CrimeSeverity = (typeof CrimeSeverity)[keyof typeof CrimeSeverity]

// ─── Crime Type ───────────────────────────────────────────────────────────────
export interface CrimeType {
  id: string
  name: string
  code: string                     // Short uppercase code e.g. "ROB", "ASSAULT", "HOMICIDE"
  category: string | null          // Free-text category grouping
  severity: CrimeSeverity | null
  createdAt: string
}

export interface CrimeTypeFilters {
  search?: string
  category?: string
  severity?: CrimeSeverity[]
  page?: number
  pageSize?: number
  sortField?: 'name' | 'code' | 'category' | 'severity' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

export interface CreateCrimeTypePayload {
  name: string
  code: string                     // Must be unique, uppercase alphanumeric, max 20 chars
  category?: string
  severity?: CrimeSeverity
}

// ─── Health Status enum ───────────────────────────────────────────────────────
export const HealthStatus = {
  HEALTHY:  'healthy',
  DEGRADED: 'degraded',
  DOWN:     'down',
} as const
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus]

// ─── Per-service health entry ─────────────────────────────────────────────────
export interface ServiceHealth {
  status: HealthStatus
  responseTimeMs: number | null
  message: string | null
  checkedAt: string                // ISO 8601
}

// ─── Full system health (from GET /api/v1/health) ────────────────────────────
export interface SystemHealth {
  overall: HealthStatus
  timestamp: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    api: ServiceHealth
  }
  metrics: {
    activeSessionCount: number
    apiResponseTimeP95Ms: number | null
    lastBackupAt: string | null    // ISO 8601; null if never backed up
  }
}

// ─── System readiness (from GET /api/v1/readiness) ───────────────────────────
export interface SystemReadiness {
  ready: boolean
  timestamp: string
}
```

## 5.2 `src/features/admin/types/index.ts`

```typescript
export * from './admin.types'
```

---

# 6. Zod Schemas — Departments

## 6.1 `src/features/departments/schemas/department.schema.ts`

```typescript
import { z } from 'zod'

// ─── Create Department ────────────────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Department name is required.' })
    .max(200),
  code: z
    .string()
    .max(10)
    .regex(/^[A-Z0-9]+$/, {
      message: 'Code must contain only uppercase letters and digits.',
    })
    .optional(),
  locationId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
})

export type CreateDepartmentValues = z.infer<typeof createDepartmentSchema>

// ─── Update Department ────────────────────────────────────────────────────────
export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z
    .string()
    .max(10)
    .regex(/^[A-Z0-9]+$/, {
      message: 'Code must contain only uppercase letters and digits.',
    })
    .nullable()
    .optional(),
  locationId: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
})

export type UpdateDepartmentValues = z.infer<typeof updateDepartmentSchema>

// ─── Assign Head Officer ──────────────────────────────────────────────────────
export const assignHeadOfficerSchema = z.object({
  officerId: z.string().uuid({ message: 'A valid officer must be selected.' }),
})

export type AssignHeadOfficerValues = z.infer<typeof assignHeadOfficerSchema>
```

## 6.2 `src/features/departments/schemas/department-api.schema.ts`

```typescript
import { z } from 'zod'

const locationRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  region: z.string().nullable(),
})

const headOfficerRefSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
})

// ─── Department List Item ─────────────────────────────────────────────────────
export const departmentListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  location: locationRefSchema.nullable(),
  headOfficer: headOfficerRefSchema.nullable(),
  officerCount: z.number(),
  activeCaseCount: z.number(),
  createdAt: z.string(),
})

// ─── Department Detail ────────────────────────────────────────────────────────
export const departmentDetailSchema = departmentListItemSchema.extend({
  description: z.string().nullable(),
  updatedAt: z.string(),
})

// ─── Paginated Departments ────────────────────────────────────────────────────
export const paginatedDepartmentsSchema = z.object({
  data: z.array(departmentListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Department Officer Summary ───────────────────────────────────────────────
export const departmentOfficerSummarySchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  status: z.string(),
  joinedAt: z.string(),
})

export const departmentOfficersResponseSchema = z.object({
  data: z.array(departmentOfficerSummarySchema),
  total: z.number(),
})
```

## 6.3 `src/features/departments/schemas/department-filters.schema.ts`

```typescript
import { z } from 'zod'

export const departmentFiltersSchema = z.object({
  search: z.string().optional(),
  locationId: z.string().optional(),
  hasHeadOfficer: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['name', 'officerCount', 'activeCaseCount', 'createdAt'])
    .optional()
    .default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
})
```

---

# 7. Zod Schemas — Admin

## 7.1 `src/features/admin/schemas/location.schema.ts`

```typescript
import { z } from 'zod'

export const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Location name is required.' })
    .max(200),
  region: z.string().max(100).optional(),
  country: z
    .string()
    .min(1, { message: 'Country is required.' })
    .max(100)
    .default('Ethiopia'),
})

export type CreateLocationValues = z.infer<typeof createLocationSchema>
```

## 7.2 `src/features/admin/schemas/crime-type.schema.ts`

```typescript
import { z } from 'zod'
import { CrimeSeverity } from '../types/admin.types'

export const createCrimeTypeSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Crime type name is required.' })
    .max(200),
  code: z
    .string()
    .min(1, { message: 'Code is required.' })
    .max(20)
    .regex(/^[A-Z0-9_]+$/, {
      message: 'Code must contain only uppercase letters, digits, and underscores.',
    }),
  category: z.string().max(100).optional(),
  severity: z.nativeEnum(CrimeSeverity).optional(),
})

export type CreateCrimeTypeValues = z.infer<typeof createCrimeTypeSchema>
```

## 7.3 `src/features/admin/schemas/admin-api.schema.ts`

```typescript
import { z } from 'zod'
import { CrimeSeverity } from '../types/admin.types'

// ─── Location schemas ─────────────────────────────────────────────────────────
export const locationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  region: z.string().nullable(),
  country: z.string(),
  createdAt: z.string(),
})

export const paginatedLocationsSchema = z.object({
  data: z.array(locationSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Crime Type schemas ───────────────────────────────────────────────────────
export const crimeTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  category: z.string().nullable(),
  severity: z.nativeEnum(CrimeSeverity).nullable(),
  createdAt: z.string(),
})

export const paginatedCrimeTypesSchema = z.object({
  data: z.array(crimeTypeSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── System Health schemas ────────────────────────────────────────────────────
const serviceHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  responseTimeMs: z.number().nullable(),
  message: z.string().nullable(),
  checkedAt: z.string(),
})

export const systemHealthSchema = z.object({
  overall: z.enum(['healthy', 'degraded', 'down']),
  timestamp: z.string(),
  services: z.object({
    database: serviceHealthSchema,
    redis: serviceHealthSchema,
    api: serviceHealthSchema,
  }),
  metrics: z.object({
    activeSessionCount: z.number(),
    apiResponseTimeP95Ms: z.number().nullable(),
    lastBackupAt: z.string().nullable(),
  }),
})

export const systemReadinessSchema = z.object({
  ready: z.boolean(),
  timestamp: z.string(),
})
```

---

# 8. `src/features/departments/utils/departmentUtils.ts`

```typescript
import type { BadgeVariant } from '@shared/types/ui.types'

// ─── Officer role badge variants (local to departments module) ─────────────────
// Identical values to OFFICER_ROLE_VARIANTS in personnel module.
// Defined locally to respect module boundary import rules.
export const DEPT_OFFICER_ROLE_VARIANTS: Record<string, BadgeVariant> = {
  INVESTIGATOR:  'primary',
  FORENSIC:      'accent',
  LEGAL_OFFICER: 'accent',
  DEPT_HEAD:     'warning',
  ADMIN:         'destructive',
  SUPERADMIN:    'destructive',
}

// ─── Officer status badge variants (local to departments module) ──────────────
export const DEPT_OFFICER_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE:   'success',
  INACTIVE: 'muted',
}

// ─── Department display name ──────────────────────────────────────────────────
// Returns: "Homicide Unit (HOM)" or "Homicide Unit" if no code
export function getDepartmentDisplayName(name: string, code: string | null): string {
  if (code) return `${name} (${code})`
  return name
}

// ─── Head officer full name ───────────────────────────────────────────────────
export function getHeadOfficerLabel(
  firstName: string,
  lastName: string,
  badgeNumber: string,
): string {
  return `${firstName} ${lastName} (${badgeNumber})`
}

// ─── Check if department has a head officer ───────────────────────────────────
export function hasHeadOfficer(dept: { headOfficer: unknown }): boolean {
  return dept.headOfficer !== null && dept.headOfficer !== undefined
}
```

## 8.1 `src/features/admin/utils/adminUtils.ts`

```typescript
import type { BadgeVariant } from '@shared/types/ui.types'
import { HealthStatus, CrimeSeverity } from '../types/admin.types'

// ─── Health status badge variants ─────────────────────────────────────────────
export const HEALTH_STATUS_VARIANTS: Record<HealthStatus, BadgeVariant> = {
  healthy:  'success',
  degraded: 'warning',
  down:     'destructive',
}

// ─── Crime severity badge variants ────────────────────────────────────────────
export const CRIME_SEVERITY_VARIANTS: Record<CrimeSeverity, BadgeVariant> = {
  MISDEMEANOR: 'muted',
  FELONY:      'warning',
  CAPITAL:     'destructive',
}

// ─── Health status icon name helper ──────────────────────────────────────────
// Returns the lucide icon name appropriate for a given health status.
export function getHealthStatusIcon(status: HealthStatus): 'check-circle' | 'alert-triangle' | 'x-circle' {
  if (status === 'healthy') return 'check-circle'
  if (status === 'degraded') return 'alert-triangle'
  return 'x-circle'
}

// ─── Format response time ─────────────────────────────────────────────────────
export function formatResponseTime(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
```

---

# 9. Query Key Factories

## 9.1 `src/services/query/keys/departmentKeys.ts`

```typescript
export const departmentKeys = {
  // ── Root ──────────────────────────────────────────────────────────────────────
  departments: () => ['departments'] as const,

  departmentList: () => [...departmentKeys.departments(), 'list'] as const,
  departmentListFiltered: (filters: Record<string, unknown>) =>
    [...departmentKeys.departmentList(), filters] as const,

  departmentDetail: () => [...departmentKeys.departments(), 'detail'] as const,
  department: (departmentId: string) =>
    [...departmentKeys.departmentDetail(), departmentId] as const,

  departmentOfficers: (departmentId: string) =>
    [...departmentKeys.department(departmentId), 'officers'] as const,
} as const
```

## 9.2 `src/services/query/keys/adminKeys.ts`

```typescript
export const adminKeys = {
  // ── Health ─────────────────────────────────────────────────────────────────
  health: () => ['admin', 'health'] as const,
  readiness: () => ['admin', 'readiness'] as const,

  // ── Locations ──────────────────────────────────────────────────────────────
  locations: () => ['admin', 'locations'] as const,
  locationList: () => [...adminKeys.locations(), 'list'] as const,
  locationListFiltered: (filters: Record<string, unknown>) =>
    [...adminKeys.locationList(), filters] as const,

  // ── Crime Types ────────────────────────────────────────────────────────────
  crimeTypes: () => ['admin', 'crime-types'] as const,
  crimeTypeList: () => [...adminKeys.crimeTypes(), 'list'] as const,
  crimeTypeListFiltered: (filters: Record<string, unknown>) =>
    [...adminKeys.crimeTypeList(), filters] as const,
} as const
```

---

# 10. Service Layer — Departments

## 10.1 `src/services/domain/departments.service.ts`

Replace all stubs. Every response validated with Zod. No `any` types.

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedDepartmentsSchema,
  departmentDetailSchema,
  departmentOfficersResponseSchema,
} from '@features/departments/schemas/department-api.schema'
import type {
  Department,
  DepartmentListItem,
  DepartmentFilters,
  DepartmentOfficerSummary,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  AssignHeadOfficerPayload,
} from '@features/departments/types/department.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /api/v1/departments — list with filters */
export async function getDepartments(
  filters: DepartmentFilters,
): Promise<PaginatedResponse<DepartmentListItem>> {
  const params = buildDepartmentParams(filters)
  const raw = await apiClient.get(`/api/v1/departments?${params}`)
  return paginatedDepartmentsSchema.parse(raw)
}

/** GET /api/v1/departments/:id — single department detail */
export async function getDepartment(departmentId: string): Promise<Department> {
  const raw = await apiClient.get(`/api/v1/departments/${departmentId}`)
  return departmentDetailSchema.parse(raw)
}

/** POST /api/v1/departments — create new department (admin+) */
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  const raw = await apiClient.post('/api/v1/departments', payload)
  return departmentDetailSchema.parse(raw)
}

/** PATCH /api/v1/departments/:id — update department metadata (admin+) */
export async function updateDepartment(
  departmentId: string,
  payload: UpdateDepartmentPayload,
): Promise<Department> {
  const raw = await apiClient.patch(`/api/v1/departments/${departmentId}`, payload)
  return departmentDetailSchema.parse(raw)
}

/** DELETE /api/v1/departments/:id — delete department (admin+) */
export async function deleteDepartment(departmentId: string): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${departmentId}`)
}

/**
 * POST /api/v1/departments/:id/head
 * Assigns an officer as the department head (admin+).
 * The backend may update the officer's role to DEPT_HEAD.
 */
export async function assignHeadOfficer(
  departmentId: string,
  payload: AssignHeadOfficerPayload,
): Promise<Department> {
  const raw = await apiClient.post(`/api/v1/departments/${departmentId}/head`, payload)
  return departmentDetailSchema.parse(raw)
}

/**
 * DELETE /api/v1/departments/:id/head
 * Removes the department head designation (admin+).
 */
export async function removeHeadOfficer(departmentId: string): Promise<Department> {
  const raw = await apiClient.delete(`/api/v1/departments/${departmentId}/head`)
  return departmentDetailSchema.parse(raw)
}

/**
 * GET /api/v1/departments/:id/officers
 * Compact officer list for the department detail page.
 * Returns up to 50 officers sorted by lastName asc.
 */
export async function getDepartmentOfficers(
  departmentId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: DepartmentOfficerSummary[]; total: number }> {
  const p = new URLSearchParams()
  p.set('page', String(params.page ?? 1))
  p.set('pageSize', String(params.pageSize ?? 50))
  p.set('sortField', 'lastName')
  p.set('sortDirection', 'asc')
  const raw = await apiClient.get(
    `/api/v1/departments/${departmentId}/officers?${p.toString()}`,
  )
  return departmentOfficersResponseSchema.parse(raw)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDepartmentParams(filters: DepartmentFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.locationId) p.set('locationId', filters.locationId)
  if (filters.hasHeadOfficer !== undefined)
    p.set('hasHeadOfficer', String(filters.hasHeadOfficer))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}
```

---

# 11. Service Layer — Admin

## 11.1 `src/services/domain/admin.service.ts`

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedLocationsSchema,
  locationSchema,
  paginatedCrimeTypesSchema,
  crimeTypeSchema,
  systemHealthSchema,
  systemReadinessSchema,
} from '@features/admin/schemas/admin-api.schema'
import type {
  Location,
  LocationFilters,
  CreateLocationPayload,
  CrimeType,
  CrimeTypeFilters,
  CreateCrimeTypePayload,
  SystemHealth,
  SystemReadiness,
} from '@features/admin/types/admin.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM HEALTH (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/health — overall system health with per-service status */
export async function getSystemHealth(): Promise<SystemHealth> {
  const raw = await apiClient.get('/api/v1/health')
  return systemHealthSchema.parse(raw)
}

/** GET /api/v1/readiness — simple readiness probe */
export async function getSystemReadiness(): Promise<SystemReadiness> {
  const raw = await apiClient.get('/api/v1/readiness')
  return systemReadinessSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATIONS (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/admin/locations — list with filters */
export async function getLocations(
  filters: LocationFilters,
): Promise<PaginatedResponse<Location>> {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  const raw = await apiClient.get(`/api/v1/admin/locations?${p.toString()}`)
  return paginatedLocationsSchema.parse(raw)
}

/** POST /api/v1/admin/locations — create new location (admin+) */
export async function createLocation(
  payload: CreateLocationPayload,
): Promise<Location> {
  const raw = await apiClient.post('/api/v1/admin/locations', payload)
  return locationSchema.parse(raw)
}

/** DELETE /api/v1/admin/locations/:id — delete location (admin+) */
export async function deleteLocation(locationId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/locations/${locationId}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRIME TYPES (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/admin/crime-types — list with filters */
export async function getCrimeTypes(
  filters: CrimeTypeFilters,
): Promise<PaginatedResponse<CrimeType>> {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.category) p.set('category', filters.category)
  if (filters.severity?.length) p.set('severity', filters.severity.join(','))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  const raw = await apiClient.get(`/api/v1/admin/crime-types?${p.toString()}`)
  return paginatedCrimeTypesSchema.parse(raw)
}

/** POST /api/v1/admin/crime-types — create new crime type (admin+) */
export async function createCrimeType(
  payload: CreateCrimeTypePayload,
): Promise<CrimeType> {
  const raw = await apiClient.post('/api/v1/admin/crime-types', payload)
  return crimeTypeSchema.parse(raw)
}
```

---

# 12. React Query Hooks — Departments

Create all hooks in `src/features/departments/hooks/`.

## 12.1 `useDepartmentList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import type { DepartmentFilters } from '../types/department.types'

export function useDepartmentList(filters: DepartmentFilters) {
  return useQuery({
    queryKey: departmentKeys.departmentListFiltered(filters as Record<string, unknown>),
    queryFn: () => getDepartments(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
```

## 12.2 `useDepartmentDetail.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartmentDetail(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.department(departmentId),
    queryFn: () => getDepartment(departmentId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(departmentId),
  })
}
```

## 12.3 `useCreateDepartment.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateDepartmentPayload } from '../types/department.types'

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
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

## 12.4 `useUpdateDepartment.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateDepartmentPayload } from '../types/department.types'

export function useUpdateDepartment(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) =>
      updateDepartment(departmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
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

## 12.5 `useDeleteDepartment.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteDepartment(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')
  const router = useRouter()

  return useMutation({
    // Never optimistic — deletion is irreversible
    mutationFn: () => deleteDepartment(departmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      // Remove the cached detail since the record no longer exists
      queryClient.removeQueries({ queryKey: departmentKeys.department(departmentId) })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
      router.push('/departments')
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 12.6 `useAssignHeadOfficer.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { assignHeadOfficer } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { AssignHeadOfficerPayload } from '../types/department.types'

export function useAssignHeadOfficer(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: (payload: AssignHeadOfficerPayload) =>
      assignHeadOfficer(departmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('assignHead.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('assignHead.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 12.7 `useRemoveHeadOfficer.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { removeHeadOfficer } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useRemoveHeadOfficer(departmentId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('departments')

  return useMutation({
    mutationFn: () => removeHeadOfficer(departmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.department(departmentId) })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.departmentList() })
      addToast({ message: t('removeHead.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('removeHead.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 12.8 `useDepartmentOfficers.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getDepartmentOfficers } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartmentOfficers(
  departmentId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: [...departmentKeys.departmentOfficers(departmentId), params],
    queryFn: () => getDepartmentOfficers(departmentId, params),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(departmentId),
  })
}
```

## 12.9 `src/features/departments/hooks/index.ts`

```typescript
export { useDepartmentList } from './useDepartmentList'
export { useDepartmentDetail } from './useDepartmentDetail'
export { useCreateDepartment } from './useCreateDepartment'
export { useUpdateDepartment } from './useUpdateDepartment'
export { useDeleteDepartment } from './useDeleteDepartment'
export { useAssignHeadOfficer } from './useAssignHeadOfficer'
export { useRemoveHeadOfficer } from './useRemoveHeadOfficer'
export { useDepartmentOfficers } from './useDepartmentOfficers'
```

---

# 13. React Query Hooks — Admin

Create all hooks in `src/features/admin/hooks/`.

## 13.1 `useSystemHealth.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSystemHealth } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: getSystemHealth,
    refetchInterval: 15_000,           // Poll every 15 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is inactive
    staleTime: 0,                       // Health data is always considered stale
    retry: 1,                          // Only one retry — avoid hammering a down system
  })
}
```

## 13.2 `useSystemReadiness.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSystemReadiness } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'

export function useSystemReadiness() {
  return useQuery({
    queryKey: adminKeys.readiness(),
    queryFn: getSystemReadiness,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  })
}
```

## 13.3 `useLocationList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import type { LocationFilters } from '../types/admin.types'

export function useLocationList(filters: LocationFilters) {
  return useQuery({
    queryKey: adminKeys.locationListFiltered(filters as Record<string, unknown>),
    queryFn: () => getLocations(filters),
    staleTime: 5 * 60 * 1000,     // Reference data changes infrequently
    placeholderData: (prev) => prev,
  })
}
```

## 13.4 `useCreateLocation.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createLocation } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateLocationPayload } from '../types/admin.types'

export function useCreateLocation() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.locationList() })
      addToast({ message: t('locations.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('locations.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 13.5 `useDeleteLocation.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteLocation } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

export function useDeleteLocation(locationId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: () => deleteLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.locationList() })
      addToast({ message: t('locations.delete.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('locations.delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 13.6 `useCrimeTypeList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCrimeTypes } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import type { CrimeTypeFilters } from '../types/admin.types'

export function useCrimeTypeList(filters: CrimeTypeFilters) {
  return useQuery({
    queryKey: adminKeys.crimeTypeListFiltered(filters as Record<string, unknown>),
    queryFn: () => getCrimeTypes(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
```

## 13.7 `useCreateCrimeType.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createCrimeType } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCrimeTypePayload } from '../types/admin.types'

export function useCreateCrimeType() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: (payload: CreateCrimeTypePayload) => createCrimeType(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.crimeTypeList() })
      addToast({ message: t('crimeTypes.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('crimeTypes.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 13.8 `useDeleteCrimeType.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { deleteCrimeType } from '@services/domain/admin.service'
import { adminKeys } from '@services/query/keys/adminKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'

// Note: deleteCrimeType endpoint is not in the Phase 8 admin service (7 endpoints total).
// If the backend exposes DELETE /api/v1/admin/crime-types/:id in a future update,
// add it to admin.service.ts. This hook is provided for structural completeness;
// activate it when the endpoint is confirmed.
export function useDeleteCrimeType(crimeTypeId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('admin')

  return useMutation({
    mutationFn: () => deleteCrimeType(crimeTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.crimeTypeList() })
      addToast({ message: t('crimeTypes.delete.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('crimeTypes.delete.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 13.9 `src/features/admin/hooks/index.ts`

```typescript
export { useSystemHealth } from './useSystemHealth'
export { useSystemReadiness } from './useSystemReadiness'
export { useLocationList } from './useLocationList'
export { useCreateLocation } from './useCreateLocation'
export { useDeleteLocation } from './useDeleteLocation'
export { useCrimeTypeList } from './useCrimeTypeList'
export { useCreateCrimeType } from './useCreateCrimeType'
export { useDeleteCrimeType } from './useDeleteCrimeType'
```

---

# 14. i18n Messages

## 14.1 `messages/en/departments.json` — Full Population

```json
{
  "pageTitle": "Departments",
  "list": {
    "heading": "Departments",
    "entityCount": "{count} department(s)",
    "addDepartmentButton": "New Department",
    "filters": {
      "search": "Search by name or code...",
      "location": "Location",
      "hasHead": "Has Head Officer",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading departments...",
    "empty": {
      "title": "No Departments Found",
      "description": "No department records exist yet.",
      "cta": "Create the first department using the button above."
    },
    "emptyFiltered": "No departments match your current filters.",
    "columns": {
      "name": "Department",
      "location": "Location",
      "headOfficer": "Head Officer",
      "officerCount": "Officers",
      "activeCases": "Active Cases",
      "createdAt": "Created",
      "actions": "Actions"
    },
    "noHead": "No Head",
    "noLocation": "No Location",
    "rowActions": {
      "view": "View Details",
      "edit": "Edit Department",
      "assignHead": "Assign Head Officer",
      "delete": "Delete Department"
    }
  },
  "detail": {
    "breadcrumb": "Departments",
    "metadataCard": {
      "title": "Department Info",
      "name": "Name",
      "code": "Code",
      "noCode": "Not assigned",
      "location": "Location",
      "noLocation": "No location assigned",
      "description": "Description",
      "noDescription": "No description.",
      "officerCount": "Total Officers",
      "activeCaseCount": "Active Cases",
      "activeCasesLink": "View all cases →",
      "createdAt": "Created",
      "updatedAt": "Last Updated"
    },
    "headCard": {
      "title": "Department Head",
      "badge": "Badge",
      "email": "Email",
      "phone": "Phone",
      "noPhone": "Not recorded",
      "noHead": "No Head Officer Assigned",
      "noHeadDescription": "This department does not currently have a designated head officer."
    },
    "officersSection": {
      "title": "Officers",
      "entityCount": "{count} officer(s)",
      "viewAll": "View all officers →",
      "loading": "Loading officers...",
      "empty": "No officers are assigned to this department.",
      "columns": {
        "badgeNumber": "Badge",
        "name": "Name",
        "role": "Role",
        "status": "Status",
        "joinedAt": "Joined"
      }
    },
    "actions": {
      "edit": "Edit Department",
      "assignHead": "Assign Head Officer",
      "changeHead": "Change Head Officer",
      "removeHead": "Remove Head Officer",
      "delete": "Delete Department"
    }
  },
  "create": {
    "drawerTitle": "New Department",
    "drawerDescription": "Create a new organisational department.",
    "section1Title": "Department Identity",
    "section2Title": "Optional Details",
    "nameLabel": "Department Name",
    "namePlaceholder": "e.g. Criminal Investigation Division",
    "codeLabel": "Short Code (optional)",
    "codePlaceholder": "e.g. CID",
    "codeHint": "Uppercase letters and digits only. Max 10 characters.",
    "locationLabel": "Location (optional)",
    "locationPlaceholder": "Select a location...",
    "descriptionLabel": "Description (optional)",
    "descriptionPlaceholder": "Brief description of this department's mandate...",
    "submitButton": "Create Department",
    "cancelButton": "Cancel",
    "successMessage": "Department created successfully.",
    "errorMessage": "Failed to create department. Please try again."
  },
  "update": {
    "drawerTitle": "Edit Department",
    "drawerDescription": "Update department information.",
    "section1Title": "Department Identity",
    "section2Title": "Optional Details",
    "nameLabel": "Department Name",
    "codeLabel": "Short Code",
    "codeHint": "Uppercase letters and digits only. Max 10 characters.",
    "locationLabel": "Location",
    "locationPlaceholder": "Select a location...",
    "descriptionLabel": "Description",
    "descriptionPlaceholder": "Brief description of this department's mandate...",
    "submitButton": "Save Changes",
    "cancelButton": "Cancel",
    "successMessage": "Department updated successfully.",
    "errorMessage": "Failed to update department. Please try again."
  },
  "delete": {
    "confirmTitle": "Delete this department?",
    "confirmDescription": "Department \"{departmentName}\" will be permanently deleted. This action cannot be undone.",
    "warningHasOfficers": "This department currently has {officerCount} officer(s). You must reassign or remove all officers before this department can be deleted.",
    "confirmButton": "Delete Department",
    "cancelButton": "Cancel",
    "successMessage": "Department deleted successfully.",
    "errorMessage": "Failed to delete department. The department may still have assigned officers or active cases."
  },
  "assignHead": {
    "drawerTitle": "Assign Head Officer",
    "drawerDescription": "Select an active officer to serve as the head of this department.",
    "officerLabel": "Head Officer",
    "officerPlaceholder": "Search by name or badge number...",
    "officerHint": "Only active officers are eligible to be department heads.",
    "currentHead": "Current Head",
    "replaceNotice": "Assigning a new head will replace the current head officer.",
    "submitButton": "Assign as Head",
    "cancelButton": "Cancel",
    "successMessage": "Head officer assigned successfully.",
    "errorMessage": "Failed to assign head officer. Please try again."
  },
  "removeHead": {
    "confirmTitle": "Remove head officer?",
    "confirmDescription": "Officer {officerName} ({badgeNumber}) will be removed as the head of {departmentName}. The department will have no designated head until a new one is assigned.",
    "confirmButton": "Remove Head Officer",
    "cancelButton": "Cancel",
    "successMessage": "Head officer removed successfully.",
    "errorMessage": "Failed to remove head officer. Please try again."
  }
}
```

## 14.2 `messages/am/departments.json` — Full Amharic Equivalent

```json
{
  "pageTitle": "ክፍሎች",
  "list": {
    "heading": "ክፍሎች",
    "entityCount": "{count} ክፍል(ዎች)",
    "addDepartmentButton": "አዲስ ክፍል",
    "filters": {
      "search": "በስም ወይም ኮድ ፈልግ...",
      "location": "ቦታ",
      "hasHead": "ኃላፊ ያለው",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "ክፍሎችን እየጫነ ነው...",
    "empty": {
      "title": "ምንም ክፍሎች አልተገኙም",
      "description": "ምንም የክፍል መዝገቦች ገና የሉም።",
      "cta": "ከላይ ያለውን አዝራር በመጠቀም የመጀመሪያ ክፍል ፍጠር።"
    },
    "emptyFiltered": "ምንም ክፍሎች ከማጣሪያዎ ጋር አይዛመዱም።",
    "columns": {
      "name": "ክፍል",
      "location": "ቦታ",
      "headOfficer": "ኃላፊ ፖሊስ",
      "officerCount": "ፖሊሶች",
      "activeCases": "ንቁ ጉዳዮች",
      "createdAt": "ተፈጥሯል",
      "actions": "ድርጊቶች"
    },
    "noHead": "ኃላፊ የለም",
    "noLocation": "ቦታ የለም",
    "rowActions": {
      "view": "ዝርዝሮች ተመልከት",
      "edit": "ክፍሉን ቀይር",
      "assignHead": "ኃላፊ ፖሊስ ሰጥ",
      "delete": "ክፍሉን ሰርዝ"
    }
  },
  "detail": {
    "breadcrumb": "ክፍሎች",
    "metadataCard": {
      "title": "የክፍል መረጃ",
      "name": "ስም",
      "code": "ኮድ",
      "noCode": "አልተሰጠም",
      "location": "ቦታ",
      "noLocation": "ቦታ አልተሰጠም",
      "description": "መግለጫ",
      "noDescription": "መግለጫ የለም።",
      "officerCount": "ጠቅላላ ፖሊሶች",
      "activeCaseCount": "ንቁ ጉዳዮች",
      "activeCasesLink": "ሁሉም ጉዳዮች ተመልከት →",
      "createdAt": "ተፈጥሯል",
      "updatedAt": "መጨረሻ ዝማኔ"
    },
    "headCard": {
      "title": "የክፍል ኃላፊ",
      "badge": "ባጅ",
      "email": "ኢሜይል",
      "phone": "ስልክ",
      "noPhone": "አልተመዘገበም",
      "noHead": "ምንም ኃላፊ ፖሊስ አልተሰጠም",
      "noHeadDescription": "ይህ ክፍል አሁን ያለው ኃላፊ ፖሊስ የለውም።"
    },
    "officersSection": {
      "title": "ፖሊሶች",
      "entityCount": "{count} ፖሊስ(ዎች)",
      "viewAll": "ሁሉም ፖሊሶች ተመልከት →",
      "loading": "ፖሊሶችን እየጫነ ነው...",
      "empty": "ለዚህ ክፍል ምንም ፖሊሶች አልተሰጡም።",
      "columns": {
        "badgeNumber": "ባጅ",
        "name": "ስም",
        "role": "ሚና",
        "status": "ሁኔታ",
        "joinedAt": "ቀን"
      }
    },
    "actions": {
      "edit": "ክፍሉን ቀይር",
      "assignHead": "ኃላፊ ፖሊስ ሰጥ",
      "changeHead": "ኃላፊ ፖሊስ ቀይር",
      "removeHead": "ኃላፊ ፖሊስ አስወግድ",
      "delete": "ክፍሉን ሰርዝ"
    }
  },
  "create": {
    "drawerTitle": "አዲስ ክፍል",
    "drawerDescription": "አዲስ የድርጅት ክፍል ፍጠር።",
    "section1Title": "የክፍል ማንነት",
    "section2Title": "አማራጭ ዝርዝሮች",
    "nameLabel": "የክፍሉ ስም",
    "namePlaceholder": "ለምሳሌ የወንጀል ምርመራ ዋና ክፍል",
    "codeLabel": "አጭር ኮድ (አማራጭ)",
    "codePlaceholder": "ለምሳሌ CID",
    "codeHint": "ትልቅ ፊደሎች እና ቁጥሮች ብቻ። ከፍተኛ 10 ፊደሎች።",
    "locationLabel": "ቦታ (አማራጭ)",
    "locationPlaceholder": "ቦታ ምረጥ...",
    "descriptionLabel": "መግለጫ (አማራጭ)",
    "descriptionPlaceholder": "የዚህ ክፍል ዓላማ አጭር መግለጫ...",
    "submitButton": "ክፍሉን ፍጠር",
    "cancelButton": "ሰርዝ",
    "successMessage": "ክፍሉ በተሳካ ሁኔታ ተፈጥሯል።",
    "errorMessage": "ክፍሉን ለመፍጠር አልተሳካም። እንደገና ይሞክሩ።"
  },
  "update": {
    "drawerTitle": "ክፍሉን ቀይር",
    "drawerDescription": "የክፍሉን መረጃ ዝማኔ አድርግ።",
    "section1Title": "የክፍል ማንነት",
    "section2Title": "አማራጭ ዝርዝሮች",
    "nameLabel": "የክፍሉ ስም",
    "codeLabel": "አጭር ኮድ",
    "codeHint": "ትልቅ ፊደሎች እና ቁጥሮች ብቻ። ከፍተኛ 10 ፊደሎች።",
    "locationLabel": "ቦታ",
    "locationPlaceholder": "ቦታ ምረጥ...",
    "descriptionLabel": "መግለጫ",
    "descriptionPlaceholder": "የዚህ ክፍል ዓላማ አጭር መግለጫ...",
    "submitButton": "ለውጦችን አስቀምጥ",
    "cancelButton": "ሰርዝ",
    "successMessage": "ክፍሉ በተሳካ ሁኔታ ተዘምኗል።",
    "errorMessage": "ክፍሉን ለማዘምን አልተሳካም። እንደገና ይሞክሩ።"
  },
  "delete": {
    "confirmTitle": "ይህን ክፍል ሰርዝ?",
    "confirmDescription": "ክፍሉ \"{departmentName}\" ቋሚ ሆኖ ይሰረዛል። ይህ ድርጊት ሊቀለበስ አይችልም።",
    "warningHasOfficers": "ይህ ክፍል {officerCount} ፖሊስ(ዎች) አሉት። ሁሉም ፖሊሶች ከተወሰዱ ወይም ካልተሰረዙ ይህ ክፍል ሊሰረዝ አይችልም።",
    "confirmButton": "ክፍሉን ሰርዝ",
    "cancelButton": "ሰርዝ",
    "successMessage": "ክፍሉ በተሳካ ሁኔታ ተሰርዟል።",
    "errorMessage": "ክፍሉን ለመሰረዝ አልተሳካም።"
  },
  "assignHead": {
    "drawerTitle": "ኃላፊ ፖሊስ ሰጥ",
    "drawerDescription": "ለዚህ ክፍል ኃላፊ ሆኖ የሚያገለግል ንቁ ፖሊስ ምረጥ።",
    "officerLabel": "ኃላፊ ፖሊስ",
    "officerPlaceholder": "በስም ወይም ባጅ ቁጥር ፈልግ...",
    "officerHint": "ንቁ ፖሊሶች ብቻ ለክፍል ኃላፊ ሊሰጡ ይችላሉ።",
    "currentHead": "አሁናዊ ኃላፊ",
    "replaceNotice": "አዲስ ኃላፊ ሲሰጥ የአሁኑ ኃላፊ ፖሊስ ይተካል።",
    "submitButton": "ኃላፊ አድርግ",
    "cancelButton": "ሰርዝ",
    "successMessage": "ኃላፊ ፖሊስ በተሳካ ሁኔታ ተሰጥቷል።",
    "errorMessage": "ኃላፊ ፖሊስ ለመሰጠት አልተሳካም። እንደገና ይሞክሩ።"
  },
  "removeHead": {
    "confirmTitle": "ኃላፊ ፖሊስ ያስወግዱ?",
    "confirmDescription": "ፖሊስ {officerName} ({badgeNumber}) ከ{departmentName} ኃላፊነት ይወሰዳል። አዲስ ኃላፊ እስኪሰጥ ክፍሉ ያለ ኃላፊ ይሆናል።",
    "confirmButton": "ኃላፊ ፖሊስ አስወግድ",
    "cancelButton": "ሰርዝ",
    "successMessage": "ኃላፊ ፖሊስ በተሳካ ሁኔታ ተወስዷል።",
    "errorMessage": "ኃላፊ ፖሊስ ለማስወገድ አልተሳካም። እንደገና ይሞክሩ።"
  }
}
```

## 14.3 `messages/en/admin.json` — Full Population

```json
{
  "locations": {
    "pageTitle": "Locations",
    "list": {
      "heading": "Locations",
      "entityCount": "{count} location(s)",
      "addLocationButton": "New Location",
      "filters": {
        "search": "Search by name or region...",
        "clearAll": "Clear all filters"
      },
      "loading": "Loading locations...",
      "empty": {
        "title": "No Locations Found",
        "description": "No geographic location records exist yet.",
        "cta": "Add the first location using the button above."
      },
      "emptyFiltered": "No locations match your current filters.",
      "columns": {
        "name": "Location Name",
        "region": "Region",
        "country": "Country",
        "createdAt": "Added",
        "actions": "Actions"
      },
      "noRegion": "—",
      "rowActions": {
        "delete": "Delete Location"
      }
    },
    "create": {
      "drawerTitle": "New Location",
      "drawerDescription": "Add a geographic location to the reference data library.",
      "nameLabel": "Location Name",
      "namePlaceholder": "e.g. Bole Sub-City",
      "regionLabel": "Region (optional)",
      "regionPlaceholder": "e.g. Addis Ababa",
      "countryLabel": "Country",
      "countryPlaceholder": "e.g. Ethiopia",
      "submitButton": "Add Location",
      "cancelButton": "Cancel",
      "successMessage": "Location added successfully.",
      "errorMessage": "Failed to add location. Please try again."
    },
    "delete": {
      "confirmTitle": "Delete this location?",
      "confirmDescription": "\"{locationName}\" will be permanently removed from the reference library. Cases and departments that reference this location will retain their association, but the location will no longer be selectable.",
      "confirmButton": "Delete Location",
      "cancelButton": "Cancel",
      "successMessage": "Location deleted successfully.",
      "errorMessage": "Failed to delete location. It may be referenced by active records."
    }
  },
  "crimeTypes": {
    "pageTitle": "Crime Types",
    "list": {
      "heading": "Crime Types",
      "entityCount": "{count} crime type(s)",
      "addCrimeTypeButton": "New Crime Type",
      "filters": {
        "search": "Search by name or code...",
        "severity": "Severity",
        "category": "Category",
        "clearAll": "Clear all filters"
      },
      "loading": "Loading crime types...",
      "empty": {
        "title": "No Crime Types Found",
        "description": "No crime type definitions exist yet.",
        "cta": "Add the first crime type using the button above."
      },
      "emptyFiltered": "No crime types match your current filters.",
      "columns": {
        "name": "Crime Type",
        "code": "Code",
        "category": "Category",
        "severity": "Severity",
        "createdAt": "Added",
        "actions": "Actions"
      },
      "noCategory": "—",
      "noSeverity": "—",
      "rowActions": {
        "delete": "Delete Crime Type"
      }
    },
    "severity": {
      "MISDEMEANOR": "Misdemeanor",
      "FELONY": "Felony",
      "CAPITAL": "Capital"
    },
    "create": {
      "drawerTitle": "New Crime Type",
      "drawerDescription": "Add a crime type definition to the reference data library.",
      "nameLabel": "Crime Type Name",
      "namePlaceholder": "e.g. Armed Robbery",
      "codeLabel": "Code",
      "codePlaceholder": "e.g. ROB_ARMED",
      "codeHint": "Unique code. Uppercase letters, digits, and underscores only. Max 20 characters.",
      "categoryLabel": "Category (optional)",
      "categoryPlaceholder": "e.g. Property Crime",
      "severityLabel": "Severity (optional)",
      "submitButton": "Add Crime Type",
      "cancelButton": "Cancel",
      "successMessage": "Crime type added successfully.",
      "errorMessage": "Failed to add crime type. The code may already be in use."
    },
    "delete": {
      "confirmTitle": "Delete this crime type?",
      "confirmDescription": "Crime type \"{crimeTypeName}\" ({code}) will be permanently removed from the reference library. Existing cases and charges that reference this type will retain their data.",
      "confirmButton": "Delete Crime Type",
      "cancelButton": "Cancel",
      "successMessage": "Crime type deleted successfully.",
      "errorMessage": "Failed to delete crime type. It may be referenced by active cases or charges."
    }
  },
  "health": {
    "pageTitle": "System Health",
    "overallStatus": "System Status",
    "lastChecked": "Last checked",
    "pollingNotice": "Refreshes automatically every 15 seconds.",
    "status": {
      "healthy": "Healthy",
      "degraded": "Degraded",
      "down": "Down"
    },
    "services": {
      "title": "Service Status",
      "database": "Database",
      "redis": "Redis Cache",
      "api": "API Server",
      "responseTime": "Response Time",
      "noResponseTime": "—",
      "message": "Details",
      "noMessage": "No issues detected."
    },
    "metrics": {
      "title": "System Metrics",
      "activeSessions": "Active Sessions",
      "apiResponseTimeP95": "API P95 Response Time",
      "lastBackup": "Last Backup",
      "lastBackupNever": "Never",
      "noMetric": "—"
    },
    "readiness": {
      "title": "System Readiness",
      "ready": "Ready",
      "notReady": "Not Ready"
    },
    "loading": "Checking system health...",
    "error": "Unable to reach the health endpoint. The API may be down.",
    "retryButton": "Retry"
  }
}
```

## 14.4 `messages/am/admin.json` — Full Amharic Equivalent

Every key in `en/admin.json` must appear with the identical key path.

```json
{
  "locations": {
    "pageTitle": "ቦታዎች",
    "list": {
      "heading": "ቦታዎች",
      "entityCount": "{count} ቦታ(ዎች)",
      "addLocationButton": "አዲስ ቦታ",
      "filters": {
        "search": "በስም ወይም ክልል ፈልግ...",
        "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
      },
      "loading": "ቦታዎችን እየጫነ ነው...",
      "empty": {
        "title": "ምንም ቦታዎች አልተገኙም",
        "description": "ምንም የቦታ መዝገቦች ገና የሉም።",
        "cta": "ከላይ ያለውን አዝራር ተጠቀሞ የመጀመሪያ ቦታ ጨምር።"
      },
      "emptyFiltered": "ምንም ቦታዎች ከማጣሪያዎ ጋር አይዛመዱም።",
      "columns": {
        "name": "የቦታ ስም",
        "region": "ክልል",
        "country": "አገር",
        "createdAt": "ቀን",
        "actions": "ድርጊቶች"
      },
      "noRegion": "—",
      "rowActions": {
        "delete": "ቦታ ሰርዝ"
      }
    },
    "create": {
      "drawerTitle": "አዲስ ቦታ",
      "drawerDescription": "ለማጣቀሻ ቤተ-ፋይሉ የጂኦግራፊ ቦታ ጨምር።",
      "nameLabel": "የቦታ ስም",
      "namePlaceholder": "ለምሳሌ ቦሌ ክፍለ ከተማ",
      "regionLabel": "ክልል (አማራጭ)",
      "regionPlaceholder": "ለምሳሌ አዲስ አበባ",
      "countryLabel": "አገር",
      "countryPlaceholder": "ለምሳሌ ኢትዮጵያ",
      "submitButton": "ቦታ ጨምር",
      "cancelButton": "ሰርዝ",
      "successMessage": "ቦታ በተሳካ ሁኔታ ተጨምሯል።",
      "errorMessage": "ቦታ ለመጨምር አልተሳካም። እንደገና ይሞክሩ።"
    },
    "delete": {
      "confirmTitle": "ይህን ቦታ ሰርዝ?",
      "confirmDescription": "\"{locationName}\" ከማጣቀሻ ቤተ-ፋይሉ ቋሚ ሆኖ ይወሰዳል።",
      "confirmButton": "ቦታ ሰርዝ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ቦታ በተሳካ ሁኔታ ተሰርዟል።",
      "errorMessage": "ቦታ ለመሰረዝ አልተሳካም።"
    }
  },
  "crimeTypes": {
    "pageTitle": "የወንጀል ዓይነቶች",
    "list": {
      "heading": "የወንጀል ዓይነቶች",
      "entityCount": "{count} ዓይነት(ዎች)",
      "addCrimeTypeButton": "አዲስ የወንጀል ዓይነት",
      "filters": {
        "search": "በስም ወይም ኮድ ፈልግ...",
        "severity": "ክብደት",
        "category": "ምድብ",
        "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
      },
      "loading": "የወንጀል ዓይነቶችን እየጫነ ነው...",
      "empty": {
        "title": "ምንም የወንጀል ዓይነቶች አልተገኙም",
        "description": "ምንም የወንጀል ዓይነት ትርጓሜዎች ገና የሉም።",
        "cta": "ከላይ ያለውን አዝራር ተጠቅሞ የመጀመሪያ ዓይነት ጨምር።"
      },
      "emptyFiltered": "ምንም ዓይነቶች ከማጣሪያዎ ጋር አይዛመዱም።",
      "columns": {
        "name": "የወንጀል ዓይነት",
        "code": "ኮድ",
        "category": "ምድብ",
        "severity": "ክብደት",
        "createdAt": "ቀን",
        "actions": "ድርጊቶች"
      },
      "noCategory": "—",
      "noSeverity": "—",
      "rowActions": {
        "delete": "ዓይነት ሰርዝ"
      }
    },
    "severity": {
      "MISDEMEANOR": "ቀላል ወንጀል",
      "FELONY": "ከባድ ወንጀል",
      "CAPITAL": "የሞት ቅጣት ወንጀል"
    },
    "create": {
      "drawerTitle": "አዲስ የወንጀል ዓይነት",
      "drawerDescription": "ለማጣቀሻ ቤተ-ፋይሉ የወንጀል ዓይነት ትርጓሜ ጨምር።",
      "nameLabel": "የወንጀል ዓይነት ስም",
      "namePlaceholder": "ለምሳሌ ትጥቅ ዘረፋ",
      "codeLabel": "ኮድ",
      "codePlaceholder": "ለምሳሌ ROB_ARMED",
      "codeHint": "ልዩ ኮድ። ትልቅ ፊደሎች፣ ቁጥሮች፣ ሰረዞች ብቻ። ከፍተኛ 20 ፊደሎች።",
      "categoryLabel": "ምድብ (አማራጭ)",
      "categoryPlaceholder": "ለምሳሌ የንብረት ወንጀል",
      "severityLabel": "ክብደት (አማራጭ)",
      "submitButton": "ዓይነት ጨምር",
      "cancelButton": "ሰርዝ",
      "successMessage": "የወንጀል ዓይነት በተሳካ ሁኔታ ተጨምሯል።",
      "errorMessage": "ዓይነት ለመጨምር አልተሳካም። ኮዱ ቀድሞ ሊሆን ይችላል።"
    },
    "delete": {
      "confirmTitle": "ይህን ዓይነት ሰርዝ?",
      "confirmDescription": "ዓይነት \"{crimeTypeName}\" ({code}) ቋሚ ሆኖ ይወሰዳል።",
      "confirmButton": "ዓይነት ሰርዝ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ዓይነት በተሳካ ሁኔታ ተሰርዟል።",
      "errorMessage": "ዓይነት ለመሰረዝ አልተሳካም።"
    }
  },
  "health": {
    "pageTitle": "የስርዓት ጤና",
    "overallStatus": "የስርዓት ሁኔታ",
    "lastChecked": "መጨረሻ ምርመራ",
    "pollingNotice": "በ15 ሰከንድ ልዩ ራሱ ያዘምናል።",
    "status": {
      "healthy": "ጤናማ",
      "degraded": "ደካማ",
      "down": "ወድቋል"
    },
    "services": {
      "title": "የአገልግሎት ሁኔታ",
      "database": "ዳታቤዝ",
      "redis": "ሬዲስ ካሽ",
      "api": "API ሰርቨር",
      "responseTime": "የምላሽ ጊዜ",
      "noResponseTime": "—",
      "message": "ዝርዝሮች",
      "noMessage": "ምንም ችግር አልተገኘም።"
    },
    "metrics": {
      "title": "የስርዓት መለኪያዎች",
      "activeSessions": "ንቁ ክፍለ ጊዜዎች",
      "apiResponseTimeP95": "API P95 የምላሽ ጊዜ",
      "lastBackup": "መጨረሻ ምትኬ",
      "lastBackupNever": "ፈጽሞ አይደለም",
      "noMetric": "—"
    },
    "readiness": {
      "title": "የስርዓት ዝግጁነት",
      "ready": "ዝግጁ",
      "notReady": "ዝግጁ አይደለም"
    },
    "loading": "የስርዓት ጤናን እየፈተሸ ነው...",
    "error": "የጤና ሁኔታ ኢንድ ፖይንቱ ሊደረስ አልቻለም። API ወድቆ ሊሆን ይችላል።",
    "retryButton": "እንደገና ሞክር"
  }
}
```

---

# 15. Route Pages

## 15.1 `src/app/(dashboard)/departments/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { DepartmentsList } from '@features/departments/components/DepartmentsList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('departments')
  return { title: t('pageTitle') }
}

export default function DepartmentsPage() {
  return <DepartmentsList />
}
```

## 15.2 `src/app/(dashboard)/departments/[departmentId]/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { DepartmentDetail } from '@features/departments/components/DepartmentDetail'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('departments')
  return { title: t('pageTitle') }
}

export default function DepartmentDetailPage({
  params,
}: {
  params: { departmentId: string }
}) {
  return <DepartmentDetail departmentId={params.departmentId} />
}
```

## 15.3 `src/app/(dashboard)/admin/locations/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { LocationsList } from '@features/admin/components/locations/LocationsList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('locations.pageTitle') }
}

export default function LocationsPage() {
  return <LocationsList />
}
```

## 15.4 `src/app/(dashboard)/admin/crime-types/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { CrimeTypesList } from '@features/admin/components/crime-types/CrimeTypesList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('crimeTypes.pageTitle') }
}

export default function CrimeTypesPage() {
  return <CrimeTypesList />
}
```

## 15.5 `src/app/(dashboard)/admin/health/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { SystemHealthPanel } from '@features/admin/components/health/SystemHealthPanel'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('health.pageTitle') }
}

export default function HealthPage() {
  return <SystemHealthPanel />
}
```

---

# 16. UI Implementation — DepartmentsList

## 16.1 `DepartmentsList.tsx`

Client Component. URL-driven filter state.

### 16.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  locationId: parseAsString.withDefault(''),
  hasHeadOfficer: parseAsString.withDefault(''),  // '' | 'true' | 'false'
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('name'),
  sortDirection: parseAsString.withDefault('asc'),
})
```

### 16.1.2 PageHeader

```tsx
<PageHeader
  title={t('list.heading')}
  description={`${data?.total ?? 0} ${t('list.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.DEPARTMENTS_MANAGE}>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('list.addDepartmentButton')}
      </Button>
    </PermissionGuard>
  }
/>
```

### 16.1.3 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `name` | `getDepartmentDisplayName(name, code)` as a link to detail page | Yes | 200px |
| `location` | `location.name` or `t('list.noLocation')` in muted | No | 140px |
| `headOfficer` | `getHeadOfficerLabel(...)` or `muted` badge `t('list.noHead')` | No | 180px |
| `officerCount` | Plain number | Yes | 80px |
| `activeCaseCount` | Plain number | Yes | 100px |
| `createdAt` | `dd MMM yyyy` | Yes | 100px |
| `actions` | Kebab menu | No | 48px |

**Row click:** Navigates to `/departments/[departmentId]`.

**Kebab actions** (all `PermissionGuard: DEPARTMENTS_MANAGE` except "view"):
- `t('list.rowActions.view')` → navigate to detail (all roles)
- Separator (admin+ only below this line)
- `t('list.rowActions.edit')` → opens `UpdateDepartmentDrawer`
- `t('list.rowActions.assignHead')` → opens `AssignHeadOfficerDrawer`
- Separator (destructive zone)
- `t('list.rowActions.delete')` → opens `DeleteDepartmentDialog` (destructive label, red)

**Head officer display:** When `headOfficer` is null, render a muted badge with text `t('list.noHead')`. When populated, render the full name and badge number as plain text (not a link — navigating to the officer from here would add confusion).

---

# 17. UI Implementation — DepartmentDetail

## 17.1 `DepartmentDetail.tsx`

Client Component. Orchestration wrapper. **Single-column full page — not tabbed.**

### 17.1.1 Drawer/dialog state

```typescript
const [updateOpen, setUpdateOpen] = useState(false)
const [assignHeadOpen, setAssignHeadOpen] = useState(false)
const [removeHeadOpen, setRemoveHeadOpen] = useState(false)
const [deleteOpen, setDeleteOpen] = useState(false)
```

### 17.1.2 Page layout

```
DepartmentDetail (single column)
──────────────────────────────────────────────────────────────────────
PageHeader
  Breadcrumb: Departments > [Department Name]
  Title: [getDepartmentDisplayName(name, code)]
  Actions (PermissionGuard: DEPARTMENTS_MANAGE):
    [Edit] → opens UpdateDepartmentDrawer
    [Assign Head] → shown when headOfficer is null; opens AssignHeadOfficerDrawer
    [Change Head] → shown when headOfficer is non-null; opens AssignHeadOfficerDrawer
    [Remove Head] → shown when headOfficer is non-null; opens RemoveHeadOfficerDialog
    Separator
    [Delete] (destructive) → opens DeleteDepartmentDialog
──────────────────────────────────────────────────────────────────────

[isLoading] → Full-page skeleton

<DepartmentMetadataCard department={department} />

<DepartmentHeadCard
  department={department}
  onAssignHead={() => setAssignHeadOpen(true)}
  canManage={hasPermission(Permission.DEPARTMENTS_MANAGE)}
/>

<DepartmentOfficersTable departmentId={department.id} />

<!-- Drawers / Dialogs (always mounted) -->
<UpdateDepartmentDrawer open={updateOpen} department={department} onClose={...} />
<AssignHeadOfficerDrawer open={assignHeadOpen} departmentId={department.id} currentHead={department.headOfficer} onClose={...} />
<RemoveHeadOfficerDialog open={removeHeadOpen} department={department} onClose={...} />
<DeleteDepartmentDialog open={deleteOpen} department={department} onClose={...} />
```

---

# 18. UI Implementation — DepartmentMetadataCard

## 18.1 `DepartmentMetadataCard.tsx`

Client Component. Receives the full `Department` object.

### 18.1.1 Layout

```
DepartmentMetadataCard
──────────────────────────────────────────────────────────────
  Department Info
──────────────────────────────────────────────────────────────
 ┌── Two-column grid ────────────────────────────────────────┐
 │  Name      Criminal Investigation Division               │
 │  Code      CID              │  Location  Bole Sub-City   │
 │                                                           │
 │  Total Officers  12         │  Active Cases  4            │
 │  (plain number)             │  [View all cases →]        │
 │                                                           │
 │  Description                                              │
 │  Handles all major criminal investigations in Bole...    │
 │  (or "No description." in muted)                         │
 │                                                           │
 │  Created  14 Jan 2026       │  Updated  20 Jun 2026      │
 └───────────────────────────────────────────────────────────┘
```

**Active Cases link:** `t('detail.metadataCard.activeCasesLink')` renders as a link navigating to `/cases?departmentId={department.id}`. Use `Link` from `next/link`.

---

# 19. UI Implementation — DepartmentHeadCard

## 19.1 `DepartmentHeadCard.tsx`

Client Component. Receives `department` and `onAssignHead` callback.

### 19.1.1 When `department.headOfficer` is non-null

```
DepartmentHeadCard
──────────────────────────────────────────────────────────────
  Department Head
──────────────────────────────────────────────────────────────
 ┌── Single-column officer info ──────────────────────────────┐
 │  [Officer Avatar placeholder — initials, large]           │
 │  Sara Haile                                               │
 │  Badge: BD-00142                                          │
 │  Email: sara.haile@police.gov.et                          │
 │  Phone: +251 91 234 5678  (or "Not recorded")             │
 └───────────────────────────────────────────────────────────┘
```

The officer name links to `/personnel/officers/{headOfficer.id}`.

### 19.1.2 When `department.headOfficer` is null

```
DepartmentHeadCard (empty state)
──────────────────────────────────────────────────────────────
  Department Head
──────────────────────────────────────────────────────────────
 ┌── Empty state ──────────────────────────────────────────────┐
 │  [UserX icon, muted]                                       │
 │  No Head Officer Assigned                                  │
 │  This department does not currently have a designated      │
 │  head officer.                                             │
 │                                                            │
 │  [Assign Head Officer] button (PermissionGuard only)       │
 └────────────────────────────────────────────────────────────┘
```

The "Assign Head Officer" button inside the empty state calls `onAssignHead`. It is only visible when `canManage === true`. This button is a secondary CTA — use `variant="outline"`.

---

# 20. UI Implementation — DepartmentOfficersTable

## 20.1 `DepartmentOfficersTable.tsx`

Client Component. Shows officers assigned to this department.

### 20.1.1 Data

```typescript
const { data, isLoading } = useDepartmentOfficers(departmentId, { pageSize: 50 })
```

### 20.1.2 Layout

```
DepartmentOfficersTable
──────────────────────────────────────────────────────────────
  Officers                   12 officers    [View all →]
──────────────────────────────────────────────────────────────
 DataTable (compact mode, 40px rows):
   Badge  | Name          | Role          | Status | Joined
   BD-082 | Sara Haile    | Investigator  | Active | Jan 2026
   BD-091 | Dawit Bekele  | Forensic      | Active | Mar 2025
──────────────────────────────────────────────────────────────
```

**Column definitions:**

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `badgeNumber` | Monospace `xs` | No | 90px |
| `name` | `firstName lastName` as a link to `/personnel/officers/[id]` | No | 160px |
| `role` | `StatusBadge` using `DEPT_OFFICER_ROLE_VARIANTS` | No | 140px |
| `status` | `StatusBadge` using `DEPT_OFFICER_STATUS_VARIANTS` | No | 100px |
| `joinedAt` | `dd MMM yyyy` | No | 90px |

**"View all" link:** navigates to `/personnel/officers?departmentId={departmentId}`.

**Inactive officer rows:** render with `opacity-60`.

**Empty state:** muted text `t('detail.officersSection.empty')`. No CTA.

---

# 21. UI Implementation — Department Drawers and Dialogs

## 21.1 `CreateDepartmentDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Admin+ only.

```
CreateDepartmentDrawer (480px)
──────────────────────────────────────────────
  New Department
  Create a new organisational department.
──────────────────────────────────────────────
 ┌── Section 1: Department Identity ────────────┐
 │  Department Name *    [Input]               │
 │  Short Code           [Input, optional]     │
 │  (format hint below field)                  │
 └──────────────────────────────────────────────┘

 ┌── Section 2: Optional Details ───────────────┐
 │  Location             [LocationSelect]      │
 │  Description          [Textarea, optional]  │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                   [Create Department]
```

**LocationSelect:** uses a `SearchableSelect` populated with all locations from `useLocationList({ pageSize: 100, sortField: 'name', sortDirection: 'asc' })`. Map locations to `{ value: loc.id, label: `${loc.name}${loc.region ? ', ' + loc.region : ''}` }`.

On success: drawer closes, departments list refreshes, toast confirms. Dirty state guard on close.

## 21.2 `UpdateDepartmentDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Pre-populates all fields from the current `Department` object received as a prop.

Same layout as `CreateDepartmentDrawer` but with pre-filled values. Uses `useUpdateDepartment(departmentId)`. The code field shows the current value; admin can set it to empty string (sends `null` to the backend).

On success: drawer closes, department detail refreshes, list refreshes. Dirty state guard on close.

## 21.3 `DeleteDepartmentDialog.tsx`

Wrapper around `DestructiveConfirmDialog`:

```tsx
<DestructiveConfirmDialog
  open={open}
  onClose={onClose}
  title={t('delete.confirmTitle')}
  description={t('delete.confirmDescription', {
    departmentName: department.name,
  })}
  // If department has officers, render an additional warning bar
  warning={
    department.officerCount > 0
      ? t('delete.warningHasOfficers', { officerCount: department.officerCount })
      : undefined
  }
  confirmLabel={t('delete.confirmButton')}
  cancelLabel={t('delete.cancelButton')}
  onConfirm={async () => {
    await deleteDepartmentMutation.mutateAsync()
    onClose()
  }}
  isLoading={deleteDepartmentMutation.isPending}
/>
```

The warning bar (amber, same style as promotion permanence notice) renders when `department.officerCount > 0`. It signals that the deletion will be rejected by the backend, but the UI does NOT block the submission — the API error surface the reason. This mirrors real-world behaviour where officers may have been reassigned between the user opening the dialog and confirming.

Uses `useDeleteDepartment(departmentId)`. On success: navigates to `/departments`, removes cached detail, list refreshes.

## 21.4 `AssignHeadOfficerDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Admin+ only.

```
AssignHeadOfficerDrawer (480px)
──────────────────────────────────────────────
  Assign Head Officer
  Select an active officer to serve as the head of this department.
──────────────────────────────────────────────

 [If department already has a head officer:]
 ┌── Replace Notice Bar ────────────────────────┐
 │  ℹ  Current head: Sara Haile (BD-082)        │
 │     Assigning a new head will replace them.  │
 └──────────────────────────────────────────────┘

 ┌── Officer Selection ─────────────────────────┐
 │  Head Officer *       [OfficerSearchSelect]  │
 │  (hint: active officers only)               │
 └──────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                     [Assign as Head]
```

**OfficerSearchSelect:** Uses the existing `SearchableSelect` shared component with a custom async fetch. The drawer calls `getOfficers({ search: query, status: ['ACTIVE'], pageSize: 20 })` from `@services/domain/personnel.service` directly (module boundary allows feature→service imports). Maps results to `{ value: officer.id, label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})` }`.

The current head officer (if any) is shown in the replace notice bar using `t('assignHead.currentHead')`. The replace notice bar uses the primary/info style (blue outline).

Uses `useAssignHeadOfficer(departmentId)`. On success: drawer closes, department detail refreshes (head officer card updates).

## 21.5 `RemoveHeadOfficerDialog.tsx`

Wrapper around `DestructiveConfirmDialog` (non-permanently destructive but consequential):

```tsx
<DestructiveConfirmDialog
  open={open}
  onClose={onClose}
  title={t('removeHead.confirmTitle')}
  description={t('removeHead.confirmDescription', {
    officerName: `${department.headOfficer?.firstName} ${department.headOfficer?.lastName}`,
    badgeNumber: department.headOfficer?.badgeNumber ?? '',
    departmentName: department.name,
  })}
  confirmLabel={t('removeHead.confirmButton')}
  cancelLabel={t('removeHead.cancelButton')}
  onConfirm={async () => {
    await removeHeadMutation.mutateAsync()
    onClose()
  }}
  isLoading={removeHeadMutation.isPending}
/>
```

Uses `useRemoveHeadOfficer(departmentId)`. On success: dialog closes, department detail refreshes (head officer card shows empty state).

---

# 22. UI Implementation — LocationsList

## 22.1 `LocationsList.tsx`

Client Component. Admin+ only (page-level `PermissionGuard`).

### 22.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('name'),
  sortDirection: parseAsString.withDefault('asc'),
})
```

### 22.1.2 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `name` | Plain text | Yes | 200px |
| `region` | Plain text or `—` | No | 140px |
| `country` | Plain text | No | 120px |
| `createdAt` | `dd MMM yyyy` | Yes | 100px |
| `actions` | Kebab menu | No | 48px |

**Kebab actions** (`PermissionGuard: ADMIN_MANAGE`):
- `t('locations.list.rowActions.delete')` → opens `DeleteLocationDialog` for this row (destructive label, red)

**"New Location" button** in PageHeader: `PermissionGuard: ADMIN_MANAGE`.

### 22.1.3 Drawer/dialog state

`createOpen` (boolean), `deleteTarget` (`Location | null` — holds the row being deleted).

The `DeleteLocationDialog` receives the target location and calls `useDeleteLocation(locationId)`. On success: list refreshes, toast confirms.

---

# 23. UI Implementation — CrimeTypesList

## 23.1 `CrimeTypesList.tsx`

Client Component. Admin+ only (page-level `PermissionGuard`).

### 23.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  severity: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('name'),
  sortDirection: parseAsString.withDefault('asc'),
})
```

### 23.1.2 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `name` | Plain text | Yes | 200px |
| `code` | Monospace `xs` | Yes | 130px |
| `category` | Plain text or `—` | No | 140px |
| `severity` | `StatusBadge` using `CRIME_SEVERITY_VARIANTS`; `—` if null | Yes | 110px |
| `createdAt` | `dd MMM yyyy` | Yes | 100px |
| `actions` | Kebab menu | No | 48px |

**Severity filter chips** appear below the filter bar for each active severity value.

**Kebab actions:** `t('crimeTypes.list.rowActions.delete')` → opens `DeleteCrimeTypeDialog` (destructive).

---

# 24. UI Implementation — System Health Panel

## 24.1 `SystemHealthPanel.tsx`

Client Component. Admin+ only (page-level `PermissionGuard`). **This is a polling component — no mutations.**

### 24.1.1 Data

```typescript
const { data: health, isLoading, isError, refetch } = useSystemHealth()
const { data: readiness } = useSystemReadiness()
```

### 24.1.2 Page layout

```
SystemHealthPanel
──────────────────────────────────────────────────────────────────────
PageHeader
  Title: System Health
  Subtitle: Refreshes automatically every 15 seconds.
  Actions: [Retry] (only shown when isError)
──────────────────────────────────────────────────────────────────────

[isLoading initial load] → Full-page skeleton (4 cards)
[isError and no data] → ErrorState with Retry button

┌── Overall Status Bar ───────────────────────────────────────────────┐
│  [Status icon]  System: HEALTHY / DEGRADED / DOWN                  │
│  Readiness: Ready / Not Ready         Last checked: 2 min ago       │
└─────────────────────────────────────────────────────────────────────┘

┌── Service Status (3-column grid on desktop, 1-column mobile) ───────┐
│  ┌── Database ──────────┐  ┌── Redis Cache ──────┐  ┌── API ──────┐│
│  │ [●] HEALTHY          │  │ [●] HEALTHY          │  │ [●] HEALTHY ││
│  │ 24ms                 │  │ 8ms                  │  │ 142ms       ││
│  │ "No issues detected" │  │ "No issues detected" │  │ "..."       ││
│  └──────────────────────┘  └──────────────────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌── System Metrics (3-column grid) ───────────────────────────────────┐
│  ┌── Active Sessions ───┐  ┌── API P95 ───────────┐  ┌── Backup ──┐│
│  │  43                  │  │  187ms               │  │  2 hr ago  ││
│  └──────────────────────┘  └──────────────────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 24.1.3 Overall Status Bar

The status bar uses a coloured left border (or background strip) matching the overall health status colour:
- `healthy` → `var(--color-success)` left border
- `degraded` → `var(--color-warning)` left border
- `down` → `var(--color-destructive)` left border

The status text uses `t('health.status.{status}')`. The status icon uses `getHealthStatusIcon(health.overall)` from `adminUtils.ts`.

**On background refetches (not initial load):** existing data stays visible. A subtle "last checked X seconds ago" timestamp updates without re-rendering the skeleton. Use `formatDistanceToNow(new Date(health.timestamp), { addSuffix: true })`.

### 24.1.4 `HealthStatusCard.tsx`

Per-service card component. Receives `label: string`, `health: ServiceHealth`.

```
HealthStatusCard
──────────────────────────────────────────
  [●] Database
──────────────────────────────────────────
  Response Time  24ms
  Details        No issues detected.
```

The `●` dot icon colour:
- `healthy` → `text-success`
- `degraded` → `text-warning`
- `down` → `text-destructive`

Use `CheckCircle`, `AlertTriangle`, `XCircle` icons from lucide-react respectively.

### 24.1.5 `HealthMetricCard.tsx`

Compact metric card. Receives `label: string`, `value: string | number | null`, `fallback: string`.

Renders the value large (text-3xl, semibold) if non-null, or the fallback string in muted.

Used for: Active Sessions, API P95 Response Time, Last Backup.

Last Backup: if `lastBackupAt` is non-null, show `formatDistanceToNow(new Date(lastBackupAt), { addSuffix: true })`. If null, show `t('health.metrics.lastBackupNever')`.

### 24.1.6 Error state behaviour

When `isError` is true on initial load and no cached data exists, render the `ErrorState` component with:
- message: `t('health.error')`
- action: `t('health.retryButton')` button calling `void refetch()`

When `isError` is true but cached data exists (background refetch failure), keep showing the last good data with a subtle amber banner: "Unable to refresh health data. Showing last known state."

---

# 25. Shared Component — `DepartmentSelect`

## 25.1 `src/shared/components/forms/DepartmentSelect.tsx`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { SearchableSelect } from '@shared/components/forms/SearchableSelect'
import { getDepartmentDisplayName } from '@features/departments/utils/departmentUtils'

interface DepartmentSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DepartmentSelect({
  value,
  onChange,
  placeholder,
  disabled,
}: DepartmentSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: departmentKeys.departmentListFiltered({ pageSize: 100, sortField: 'name', sortDirection: 'asc' }),
    queryFn: () => getDepartments({ pageSize: 100, sortField: 'name', sortDirection: 'asc' }),
    staleTime: 5 * 60 * 1000,
  })

  const options = (data?.data ?? []).map((dept) => ({
    value: dept.id,
    label: getDepartmentDisplayName(dept.name, dept.code),
  }))

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder ?? 'Select department...'}
      isLoading={isLoading}
      disabled={disabled}
    />
  )
}
```

**Note on module boundary:** `DepartmentSelect` is a shared component. Shared components may import from services (cross-cutting layer) and from feature utilities. The import of `getDepartmentDisplayName` from `@features/departments/utils/departmentUtils` is a violation of the strict shared→feature boundary. To resolve this cleanly, inline the display name logic directly inside `DepartmentSelect` rather than importing from the feature:

```typescript
// Inline the display name logic — do not import from @features/departments
const label = dept.code ? `${dept.name} (${dept.code})` : dept.name
```

This avoids the boundary violation while keeping the shared component self-contained.

---

# 26. Barrel Exports

## 26.1 `src/features/departments/index.ts`

```typescript
// Types
export * from './types/department.types'

// Hooks
export {
  useDepartmentList,
  useDepartmentDetail,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useAssignHeadOfficer,
  useRemoveHeadOfficer,
  useDepartmentOfficers,
} from './hooks'

// Components (only those consumed outside the module)
export { DepartmentsList } from './components/DepartmentsList'
export { DepartmentDetail } from './components/DepartmentDetail'

// Utils
export {
  getDepartmentDisplayName,
  getHeadOfficerLabel,
  hasHeadOfficer,
  DEPT_OFFICER_ROLE_VARIANTS,
  DEPT_OFFICER_STATUS_VARIANTS,
} from './utils/departmentUtils'
```

## 26.2 `src/features/admin/index.ts`

```typescript
// Types
export * from './types/admin.types'

// Hooks
export {
  useSystemHealth,
  useSystemReadiness,
  useLocationList,
  useCreateLocation,
  useDeleteLocation,
  useCrimeTypeList,
  useCreateCrimeType,
  useDeleteCrimeType,
} from './hooks'

// Components (only those consumed outside the module)
export { SystemHealthPanel } from './components/health/SystemHealthPanel'
export { LocationsList } from './components/locations/LocationsList'
export { CrimeTypesList } from './components/crime-types/CrimeTypesList'

// Utils
export {
  HEALTH_STATUS_VARIANTS,
  CRIME_SEVERITY_VARIANTS,
  getHealthStatusIcon,
  formatResponseTime,
} from './utils/adminUtils'
```

---

# 27. Role-Based Access

## 27.1 Department list and detail access

The department list (`/departments`) is readable by all authenticated roles. Department detail is also readable by all authenticated roles. Management actions (create, update, delete, assign/remove head) are `DEPARTMENTS_MANAGE` (admin+) only.

Wrap the management action buttons:
```tsx
<PermissionGuard permission={Permission.DEPARTMENTS_MANAGE}>
  {/* Action buttons */}
</PermissionGuard>
```

The department list itself does not require a special permission beyond authentication — all officers can see the organisational structure.

## 27.2 Admin module access

The `/admin` routes (locations, crime types, health) are `ADMIN_MANAGE` (admin+) only. The middleware-level route guard already blocks lower roles. At the page level, additionally wrap with:

```tsx
<PermissionGuard
  permission={Permission.ADMIN_MANAGE}
  fallback={<ForbiddenState />}
>
  {/* page content */}
</PermissionGuard>
```

## 27.3 Department officer table — row officer links

The officer name link in `DepartmentOfficersTable` navigates to `/personnel/officers/[id]`. Officers below `dept_head` can see the officer list (per Phase 7 access rules) so this link is safe for all roles.

## 27.4 Health polling — no role escalation

The health panel calls `GET /api/v1/health` and `GET /api/v1/readiness`. These endpoints are admin+ only at the backend level. The frontend page is already guarded. No additional data masking is required on health data.

---

# 29. Anti-Pattern Reference

The following patterns are strictly forbidden.

**Department head violations:**
- Showing both "Assign Head" and "Change Head" at the same time in the PageHeader — these are mutually exclusive states based on whether `headOfficer` is null
- Not invalidating `departmentKeys.department(departmentId)` after head assignment or removal — the head officer card will show stale data
- Not invalidating `departmentKeys.departmentList()` after head changes — the list column will show the old head
- Allowing any role below `DEPARTMENTS_MANAGE` to see the Assign Head, Change Head, or Remove Head action buttons

**Department deletion violations:**
- Using optimistic updates for department deletion — it is irreversible; server must confirm
- Not navigating back to `/departments` after successful deletion — the detail page URL for the deleted record must not remain active
- Omitting the `officerCount > 0` warning from `DeleteDepartmentDialog` — admins must be informed before attempting a deletion the API will reject
- Blocking the delete confirmation button when `officerCount > 0` — the API returns the rejection error; the UI shows the warning but still allows the attempt (officers may have been reassigned between dialog open and confirm)

**Reference data violations:**
- Providing an edit/update action for locations or crime types — Phase 8 reference data is append-only. Only create and delete are permitted.
- Calling `queryClient.setQueryData` to optimistically remove a location or crime type on delete — the API may reject a delete if the record is in use. Always wait for server confirmation.
- Client-side filtering of locations or crime types — all search parameters must be sent to the API
- Not warning the user in `DeleteLocationDialog` or `DeleteCrimeTypeDialog` that the API may reject the deletion if the record is referenced by active data

**Health panel violations:**
- Using a manual `setInterval` instead of React Query's `refetchInterval` — React Query's built-in polling correctly handles component unmount cleanup, background tab pausing, and error retry logic
- Showing the skeleton loading state on every 15-second refetch — the skeleton is for initial load only. Background refetches show existing data
- Storing health poll data in Zustand — health data is server state; it belongs in React Query cache exclusively
- Not setting `refetchIntervalInBackground: false` — without this, the health endpoint will be called every 15 seconds even when the browser tab is in the background, generating unnecessary load

**Module boundary violations:**
- Importing `OfficerRole` or `OfficerStatus` from `@features/personnel` inside the departments feature — use string types for `DepartmentOfficerSummary.role` and `.status`, and define `DEPT_OFFICER_ROLE_VARIANTS` locally in `departmentUtils.ts`
- Importing `getDepartmentDisplayName` from `@features/departments` inside `DepartmentSelect` (a shared component) — inline the display logic directly in the shared component to avoid the shared→feature import violation
- Any `@features/departments` import inside `@features/admin` or vice versa

**Query invalidation violations:**
- Not invalidating `departmentKeys.departmentList()` after creating, updating, or deleting a department — the list will show stale counts and data
- Not removing the cached detail (`queryClient.removeQueries`) after successful department deletion — stale detail data for a deleted record must not persist in cache
- Not invalidating `adminKeys.locationList()` after creating or deleting a location — the list will not reflect the change
- Not invalidating `adminKeys.crimeTypeList()` after creating a crime type — same rule

**Layout violations:**
- Using a tabbed layout for `DepartmentDetail` — the blueprint explicitly specifies single-column full pages for department detail (same pattern as person and officer detail from Phase 7)
- Placing the "New Department" button inside the department list filter bar — it belongs in the `PageHeader` right zone as the primary action
- Placing the Delete, Assign Head, and Remove Head actions in the kebab menu on the department detail page — these are primary actions in the `PageHeader` right zone for the detail page; use the kebab only on the list page rows

**i18n violations:**
- Hardcoding severity labels (`"Felony"`) instead of `t('crimeTypes.severity.FELONY')`
- Hardcoding health status labels (`"Healthy"`) instead of `t('health.status.healthy')`
- Hardcoding "No Head" text instead of `t('list.noHead')`
- Using health status values directly as display strings — always route through the i18n key

---

# 30. Final Verification Checklist

## 30.1 Department List Page

- [ ] `/departments` renders the full DataTable (not the skeleton)
- [ ] Search filter updates `search` URL param and refetches
- [ ] Departments with `headOfficer: null` show muted "No Head" badge in the head officer column
- [ ] Departments with `headOfficer` show `"FirstName LastName (BadgeNumber)"` in the head officer column
- [ ] `officerCount` and `activeCaseCount` columns show correct numbers
- [ ] Location column shows location name or muted `t('list.noLocation')`
- [ ] "New Department" button is visible for `DEPARTMENTS_MANAGE`
- [ ] "New Department" button is absent for roles without `DEPARTMENTS_MANAGE`
- [ ] Kebab edit/delete actions are absent for roles without `DEPARTMENTS_MANAGE`
- [ ] Row click navigates to `/departments/[departmentId]`
- [ ] Filter state survives page refresh
- [ ] Loading skeleton renders on initial load

## 30.2 Department Detail Page

- [ ] `/departments/[departmentId]` renders the single-column detail page (NOT tabbed)
- [ ] Breadcrumb shows: Departments > [Department Name (Code)]
- [ ] `DepartmentMetadataCard` shows name, code (or "Not assigned"), location (or "No location assigned"), description, officer count, active case count
- [ ] Active cases count is a link navigating to `/cases?departmentId={id}`
- [ ] `DepartmentHeadCard` shows officer name, badge, email, phone when head is assigned
- [ ] Officer name in `DepartmentHeadCard` links to `/personnel/officers/{headOfficerId}`
- [ ] `DepartmentHeadCard` shows "No Head Officer Assigned" empty state when head is null
- [ ] Empty state "Assign Head Officer" button is visible for `DEPARTMENTS_MANAGE`
- [ ] Empty state "Assign Head Officer" button is absent for lower roles
- [ ] PageHeader shows "Assign Head" when `headOfficer` is null; shows "Change Head" + "Remove Head" when head exists
- [ ] All three head management buttons require `DEPARTMENTS_MANAGE`; absent for lower roles
- [ ] "Edit" button in PageHeader requires `DEPARTMENTS_MANAGE`
- [ ] "Delete" button in PageHeader requires `DEPARTMENTS_MANAGE`
- [ ] `DepartmentOfficersTable` shows officer badge, name (linked to officer detail), role badge, status badge, joined date
- [ ] "View all officers" link navigates to `/personnel/officers?departmentId={id}`
- [ ] Inactive officers render with `opacity-60` in the table

## 30.3 Create Department Drawer

- [ ] Opens from "New Department" button on the list page
- [ ] Department name is required; validation error fires on submit
- [ ] Code validation fires: lowercase letters trigger error; hyphens trigger error
- [ ] Location `SearchableSelect` populates from the locations endpoint
- [ ] Dirty state guard triggers on close when form is dirty
- [ ] On success: drawer closes, list refreshes, toast confirms

## 30.4 Update Department Drawer

- [ ] Opens from "Edit" button on the detail page and "Edit Department" in the list kebab
- [ ] All fields pre-populated from the current department data
- [ ] Code field can be cleared (sends `null` to backend)
- [ ] Dirty state guard triggers on close when form is dirty
- [ ] On success: drawer closes, detail page refreshes, list refreshes, toast confirms

## 30.5 Delete Department Dialog

- [ ] Opens from "Delete" button on the detail page
- [ ] Dialog body shows department name in the description
- [ ] Warning bar renders when `officerCount > 0` — notifies admin that deletion will be rejected
- [ ] Warning bar is absent when `officerCount === 0`
- [ ] Confirm button is always enabled (even with officers present)
- [ ] On success: navigates to `/departments`, toast confirms
- [ ] On API error: dialog stays open, error toast shows

## 30.6 Assign Head Officer Drawer

- [ ] Opens from "Assign Head" (when no current head) and "Change Head" (when head exists)
- [ ] Officer search shows only active officers
- [ ] Replace notice bar renders when department already has a head (shows current head's name)
- [ ] Replace notice bar is absent when department has no current head
- [ ] On success: drawer closes, head officer card on detail page updates to new officer, toast confirms

## 30.7 Remove Head Officer Dialog

- [ ] Opens from "Remove Head" button on detail page
- [ ] Dialog description shows current head's name, badge, and department name
- [ ] On success: dialog closes, head officer card shows empty state, toast confirms

## 30.8 Locations Admin Page

- [ ] `/admin/locations` renders the full DataTable (not the skeleton)
- [ ] ForbiddenState renders for roles below `ADMIN_MANAGE`
- [ ] "New Location" button visible for `ADMIN_MANAGE`; absent for lower roles
- [ ] Search filter updates URL and refetches
- [ ] Region column shows `—` when `region` is null
- [ ] Delete kebab action is visible for `ADMIN_MANAGE`
- [ ] `DeleteLocationDialog` opens; description includes location name
- [ ] On successful delete: dialog closes, list refreshes, toast confirms
- [ ] On API rejection (record in use): dialog stays open, error toast shows

## 30.9 Crime Types Admin Page

- [ ] `/admin/crime-types` renders the full DataTable (not the skeleton)
- [ ] ForbiddenState renders for roles below `ADMIN_MANAGE`
- [ ] "New Crime Type" button visible for `ADMIN_MANAGE`
- [ ] Search filter updates URL and refetches
- [ ] Severity filter chips appear when severity filter is active
- [ ] Severity badge uses `CRIME_SEVERITY_VARIANTS` colour mapping
- [ ] `code` column renders in monospace font
- [ ] `CreateCrimeTypeDrawer`: code validation fires for lowercase or space in code
- [ ] `CreateCrimeTypeDrawer`: duplicate code → API 422 error surfaced in form
- [ ] On successful create: drawer closes, list refreshes, toast confirms

## 30.10 System Health Panel

- [ ] `/admin/health` renders the health panel (not the skeleton)
- [ ] ForbiddenState renders for roles below `ADMIN_MANAGE`
- [ ] Initial load shows 4 skeleton cards
- [ ] After data loads: overall status bar, 3 service cards, metrics row all render
- [ ] `healthy` status → green indicator, "Healthy" text
- [ ] `degraded` status → amber indicator, "Degraded" text
- [ ] `down` status → red indicator, "Down" text
- [ ] Service card response time shows formatted value or `—`
- [ ] Metrics card: active session count shows number
- [ ] Metrics card: last backup shows relative time or "Never"
- [ ] Panel auto-refreshes every 15 seconds (verify network requests in dev tools)
- [ ] Panel does NOT show loading skeleton on background refetches — existing data stays visible
- [ ] On `isError` with no cached data: `ErrorState` with "Retry" button renders
- [ ] On "Retry" click: `refetch()` is called
- [ ] On `isError` with cached data: amber "Unable to refresh" notice appears above existing data

## 30.11 DepartmentSelect shared component

- [ ] `CreateOfficerDrawer` (Phase 7) `DepartmentSelect` now populates with real departments from the implemented service
- [ ] Officer list page department filter dropdown (`DepartmentSelect`) populates correctly
- [ ] Options are sorted alphabetically by `getDepartmentDisplayName`
- [ ] Loading state renders while departments are fetching
- [ ] Empty options handled gracefully

## 30.12 i18n

- [ ] All departments UI text is retrieved from message files (no hardcoded English)
- [ ] All admin UI text is retrieved from message files (no hardcoded English)
- [ ] Switching to Amharic updates all text in departments list, detail, all drawers and dialogs
- [ ] Switching to Amharic updates all text in admin pages and health panel
- [ ] i18n completeness test passes with zero missing keys in `departments` namespace (EN + AM)
- [ ] i18n completeness test passes with zero missing keys in `admin` namespace (EN + AM)
- [ ] Crime severity labels render in selected locale
- [ ] Health status labels render in selected locale

## 30.13 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm build` — production build succeeds without errors

---

*End of CCMS Phase 8 Instruction — Departments & Admin Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 9 will implement the Dashboards & Reports module (role-specific dashboards with KPI widgets, chart components using Recharts, and the full reports module with 15 reporting endpoints, date-range filters, CSV export, and department-scoped views)*