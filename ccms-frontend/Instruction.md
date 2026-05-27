# CCMS Frontend — Phase 3: Cases Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 and 2 are complete. The following infrastructure is fully operational:

- **Foundation**: Next.js 16 App Router, TypeScript strict, all config files, design token system, TailwindCSS v4
- **Auth**: Login, logout, forgot-password, reset-password — fully wired to backend
- **Session**: Idle timeout (15 min) with warning modal at 13 min, silent token refresh
- **i18n**: English + Amharic via next-intl, LocaleToggle in AuthShell and TopBar
- **App Shell**: AppShell, Sidebar (collapsible, role-filtered, Sheet on mobile), TopBar (breadcrumbs, Cmd+K, notifications, avatar menu), Breadcrumb
- **Shared components**: All 34 components implemented — DataTable, FormField system, ConfirmDialog, SlideOverDrawer, StatusBadge, PermissionGuard suite, Timeline, etc.
- **Stores**: authStore, uiStore (persisted), notificationStore — all implemented
- **API Client**: Axios with 401 refresh queue, error classification, ApiError class
- **Query infrastructure**: queryClient, all 12 key factories, all 12 domain service stubs
- **RBAC**: RoleGuard, PermissionGuard, CaseAccessGuard + permission/role helpers
- **Routes**: All route skeletons render; middleware protects all dashboard routes

## 1.2 Phase 3 Objective

Phase 3 delivers the **Cases module** — the operational heart of CCMS. This is the most complex and most used feature in the system. The case list, case creation workflow, and case detail workspace are where investigators spend the majority of their time. The UI must match that weight: dense with information, fast to navigate, visually authoritative.

**Phase 3 has one primary deliverable: the complete Cases module**, comprising:

1. **Cases list page** — full DataTable with server-side pagination, sorting, and filtering
2. **Case creation flow** — multi-step guided form producing a new case record
3. **Case detail layout** — header card with interactive status badge, persistent across all tabs
4. **Case overview tab** — the landing tab for any case; assembles metadata, summary panels, officers, and recent activity
5. **Case timeline tab** — real-time audit stream with polling, inline note creation, and print view
6. **Case status transition workflow** — role-aware state machine drawer
7. **Remaining skeleton routes** — three admin pages, two settings pages, and the /403 page that were not created in Phase 1

**The other case sub-tabs** (evidence, arrests, interrogations, legal, officers, reports, permissions) **remain as skeleton pages** with correct tab chrome. They will be fully implemented in Phases 5–7.

## 1.3 Package Manager

All commands use **pnpm**. Do not use npm or yarn.

## 1.4 What Must Be Completed

**Cases service:**
- Replace `throw new Error('Not yet implemented')` stubs in `cases.service.ts` with real Axios calls for all case CRUD and case sub-resource endpoints
- Implement typed response validation via Zod schemas

**Cases types and schemas:**
- Define all TypeScript types for cases, case status, case filters, case timeline events, and case members
- Define all Zod schemas for create-case form, case search filters, and add-case-note form

**Cases query hooks:**
- `useCases(filters)` — list query with filter params
- `useCase(caseId)` — single case detail
- `useCaseTimeline(caseId)` — timeline with 30s polling when tab is active
- `useCaseOfficers(caseId)` — assigned officers list
- `useCaseSummary(caseId)` — aggregated counts for overview panels
- `useCreateCase()` — creation mutation
- `useUpdateCase(caseId)` — update mutation
- `useTransitionCaseStatus(caseId)` — status transition mutation
- `useAddCaseNote(caseId)` — add timeline note mutation
- `useDeleteCase(caseId)` — deletion mutation (superadmin only)

**Cases i18n messages:**
- Fully populate `messages/en/cases.json` and `messages/am/cases.json` (replacing Phase 2 skeletons with all real strings for every piece of UI in this phase)

**Cases list page (`/cases`):**
- `PageHeader` with "Cases" title + entity count + "New Case" action button (permission guarded)
- `TableFilterBar` with search input, status multi-select filter, crime-type filter, department filter (role-scoped), date-range picker
- Active filter chips below filter bar; clearing a chip removes that filter from URL
- Full `DataTable` integration: all columns defined, sortable columns, row click navigates to case detail, kebab action menu per row
- Loading skeleton: TableSkeleton on first load; existing rows stay visible on background refetch
- Empty state: context-appropriate message with "Create First Case" CTA
- URL-driven state: all filters, page, pageSize, sort field, sort direction serialised to URL via `nuqs`
- Pagination strip: prev/next, page number display, page-size selector (10/25/50/100), total count

**Case creation flow (`/cases/new`):**
- Multi-step wizard: Step 1 (Basic Info), Step 2 (Crime Details), Step 3 (Initial Assignment)
- Step indicator bar showing current step, completed steps (check), and upcoming steps
- Navigation: "Back" and "Next/Submit" buttons; "Back" does not lose form data
- Dirty-state guard: navigating away from a partially filled form triggers a confirmation dialog
- Zod schema validation per step; errors shown on attempted Next click
- On successful creation: navigate to the new case detail page (`/cases/[caseId]`)
- Accessible: each step rendered as a `<fieldset>` with a `<legend>` matching the step name

**Case detail layout (`/cases/[caseId]/layout.tsx`):**
- Full case header card: case number (monospace), title, status badge (interactive for authorised roles), department badge, crime type label, date reported, lead officer link, action buttons
- Tab navigation bar: all nine tabs rendered as route links; inaccessible tabs are disabled (not hidden) with a `Lock` icon tooltip explaining the minimum required role
- `CaseAccessGuard` wrapping the entire layout — renders `ForbiddenState` if read access is denied
- Error boundary scoped to the case detail layout

**Case overview tab (`/cases/[caseId]/page.tsx`):**
- Metadata card: two-column grid of all case fields
- Description block: full case description, whitespace-preserved, plain text
- Summary panels row: three compact cards — Evidence count, Arrests count, Charges count — each linking to the respective tab
- Assigned officers section: compact officer list with role, assignment date, linked to officer detail
- Recent activity strip: last five audit entries from the case timeline; links to the Timeline tab
- All sections have correct loading skeletons and empty states

**Case timeline tab (`/cases/[caseId]/timeline/page.tsx`):**
- 30-second polling interval while the tab is active; no polling on other tabs
- `TableFilterBar` variant: actor search, event-type multi-select, date range
- Timeline rendered with `Timeline`, `TimelineEntry`, and `TimelineConnector` shared components
- Each entry: event-type icon, event label, actor (linked for admin+), ISO 8601 timestamp (relative on hover tooltip), optional diff viewer panel (before/after), security badge for security events, immutability padlock indicator
- Add case note: inline form at the top of the timeline (a single-line text input + submit button). On success, immediately invalidates `caseKeys.timeline(caseId)`.
- Print timeline: button in the PageHeader actions slot; triggers `window.print()` with a CSS print stylesheet that strips all nav chrome and renders the timeline with CCMS letterhead

**Case status transition workflow:**
- Clicking the interactive status badge in the case header opens a `SlideOverDrawer`
- Drawer content: current status (highlighted), available next statuses (per state machine + role), reason/notes `Textarea` (optional for most, required for archival), confirm button
- Unavailable transitions shown as disabled items with a tooltip naming the required role
- On success: updates the status badge, closes the drawer, adds a toast, invalidates `caseKeys.detail(caseId)` and `caseKeys.lists()`

**Missing routes from Phase 1:**
- `src/app/(errors)/403/page.tsx` — full ForbiddenState page with link to dashboard
- `src/app/(dashboard)/admin/locations/page.tsx` — skeleton with PageHeader
- `src/app/(dashboard)/admin/crime-types/page.tsx` — skeleton with PageHeader
- `src/app/(dashboard)/admin/health/page.tsx` — skeleton with PageHeader
- `src/app/(dashboard)/settings/profile/page.tsx` — skeleton with PageHeader
- `src/app/(dashboard)/settings/password/page.tsx` — skeleton with PageHeader

## 1.5 What Must NOT Be Implemented

- Evidence tab functionality (Phase 5)
- Arrests tab functionality (Phase 6)
- Interrogations tab functionality (Phase 6)
- Legal tab functionality (Phase 7)
- Officers tab (case member management) functionality — skeleton only
- Reports tab within a case — skeleton only
- Permissions tab (case ACL management) — skeleton only
- Dashboard widgets and charts (Phase 10)
- Personnel module screens (Phase 8)
- Departments module screens (Phase 9)
- Admin module business logic (Phase 9)
- Reports module (Phase 10)
- Settings module forms (Phase 8)

## 1.6 Handoff Standard

When Phase 3 finishes, a developer must be able to:
- Navigate to `/cases` and see a fully functional case list with working filters, sorting, and pagination wired to the backend
- Click "New Case" and complete the multi-step creation form
- Click any case row and see the case detail workspace with header, tabs, overview content, and timeline
- Click the status badge and execute a status transition
- Add a note to the timeline and see it appear immediately
- `pnpm type-check` exits with zero errors
- `pnpm lint` exits with zero warnings
- `pnpm test` passes all cases-module tests

---

# 2. Dependencies to Install

The following package is required and not yet installed:

```bash
pnpm add nuqs
```

`nuqs` is already in `package.json` as a dependency (it was listed in Phase 1 spec) but verify it is installed. It provides type-safe URL search parameter management and is the backbone of all filter state management.

No other new packages are required. All other dependencies (Axios, React Query, TanStack Table, Zod, react-hook-form, Lucide) are already installed.

Verify the `date-fns` package is installed (it should be from Phase 1/2):
```bash
pnpm why date-fns
```

If not present: `pnpm add date-fns`

---

# 3. Type Definitions

## 3.1 Case Types (`src/features/cases/types/case.types.ts`)

```typescript
import type { OfficerRole } from '@shared/constants/roles'

// ─── Status ────────────────────────────────────────────────────────────────
export const CaseStatus = {
  OPEN: 'OPEN',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  REFERRED_TO_COURT: 'REFERRED_TO_COURT',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus]

// ─── State machine: which statuses can follow which ───────────────────────
export const CASE_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['UNDER_INVESTIGATION', 'CLOSED'],
  UNDER_INVESTIGATION: ['REFERRED_TO_COURT', 'CLOSED'],
  REFERRED_TO_COURT: ['CLOSED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
}

// Roles that can execute each type of transition
export const STATUS_TRANSITION_MIN_ROLE: Partial<Record<CaseStatus, OfficerRole>> = {
  ARCHIVED: 'DEPT_HEAD',
}

// ─── Core entities ─────────────────────────────────────────────────────────
export interface CaseOfficer {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  role: OfficerRole
  departmentId: string
  departmentName: string
}

export interface CaseMember {
  officer: CaseOfficer
  accessLevel: 'READ' | 'WRITE' | 'ADMIN'
  assignedAt: string
  assignedBy: string
}

export interface CrimeType {
  id: string
  name: string
  code: string
}

export interface Location {
  id: string
  name: string
  address?: string
}

export interface Department {
  id: string
  name: string
}

// ─── Case ─────────────────────────────────────────────────────────────────
export interface Case {
  id: string
  caseNumber: string // e.g. "CASE-2026-00142"
  title: string
  description: string
  status: CaseStatus
  crimeType: CrimeType
  location: Location | null
  department: Department
  leadOfficer: CaseOfficer
  incidentDate: string         // ISO 8601 date string
  reportedDate: string         // ISO 8601 date string
  closedDate: string | null
  lastActivityAt: string
  evidenceCount: number
  arrestCount: number
  chargeCount: number
  memberCount: number
  createdAt: string
  updatedAt: string
}

// A lighter shape returned in list responses
export interface CaseListItem {
  id: string
  caseNumber: string
  title: string
  status: CaseStatus
  crimeType: CrimeType
  department: Department
  leadOfficer: Pick<CaseOfficer, 'id' | 'badgeNumber' | 'firstName' | 'lastName'>
  incidentDate: string
  reportedDate: string
  evidenceCount: number
  arrestCount: number
  lastActivityAt: string
}

// ─── Case summary (for overview panels) ───────────────────────────────────
export interface CaseSummary {
  evidenceCount: number
  arrestCount: number
  interrogationCount: number
  chargeCount: number
  officerCount: number
  openTaskCount: number
}

// ─── Case filters ──────────────────────────────────────────────────────────
export interface CaseFilters {
  search?: string
  status?: CaseStatus[]
  crimeTypeId?: string
  departmentId?: string
  leadOfficerId?: string
  dateFrom?: string   // ISO 8601 date
  dateTo?: string
  page?: number
  pageSize?: number
  sortField?: 'caseNumber' | 'title' | 'status' | 'reportedDate' | 'lastActivityAt'
  sortDirection?: 'asc' | 'desc'
}

// ─── Timeline ──────────────────────────────────────────────────────────────
export const TimelineEventType = {
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  EVIDENCE_ADDED: 'EVIDENCE_ADDED',
  EVIDENCE_UPDATED: 'EVIDENCE_UPDATED',
  OFFICER_ASSIGNED: 'OFFICER_ASSIGNED',
  OFFICER_REMOVED: 'OFFICER_REMOVED',
  ARREST_RECORDED: 'ARREST_RECORDED',
  INTERROGATION_RECORDED: 'INTERROGATION_RECORDED',
  LEGAL_ACTION: 'LEGAL_ACTION',
  NOTE_ADDED: 'NOTE_ADDED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
} as const
export type TimelineEventType = (typeof TimelineEventType)[keyof typeof TimelineEventType]

export interface TimelineDiff {
  fieldName: string
  before: unknown
  after: unknown
}

export interface TimelineEntry {
  id: string
  eventType: TimelineEventType
  eventLabel: string          // Human-readable string from backend
  actor: CaseOfficer
  description: string
  diff: TimelineDiff[] | null
  securitySeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  createdAt: string           // ISO 8601, immutable
}

export interface TimelineFilters {
  actorSearch?: string
  eventTypes?: TimelineEventType[]
  dateFrom?: string
  dateTo?: string
}

// ─── Status transition ─────────────────────────────────────────────────────
export interface StatusTransitionPayload {
  toStatus: CaseStatus
  reason?: string
}

// ─── Create case ──────────────────────────────────────────────────────────
export interface CreateCaseStep1 {
  title: string
  description: string
  incidentDate: string
  locationId?: string
}

export interface CreateCaseStep2 {
  crimeTypeId: string
  departmentId: string
}

export interface CreateCaseStep3 {
  leadOfficerId: string
  additionalOfficerIds?: string[]
}

export type CreateCasePayload = CreateCaseStep1 & CreateCaseStep2 & CreateCaseStep3
```

## 3.2 Barrel Export (`src/features/cases/types/index.ts`)

Re-export all types from `case.types.ts`.

---

# 4. Zod Schemas

## 4.1 `src/features/cases/schemas/create-case.schema.ts`

```typescript
import { z } from 'zod'

export const createCaseStep1Schema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters.' })
    .max(200, { message: 'Title must be no more than 200 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(5000),
  incidentDate: z.string().min(1, { message: 'Incident date is required.' }),
  locationId: z.string().optional(),
})

export const createCaseStep2Schema = z.object({
  crimeTypeId: z.string().min(1, { message: 'Crime type is required.' }),
  departmentId: z.string().min(1, { message: 'Department is required.' }),
})

export const createCaseStep3Schema = z.object({
  leadOfficerId: z.string().min(1, { message: 'Lead officer is required.' }),
  additionalOfficerIds: z.array(z.string()).optional().default([]),
})

export const createCaseSchema = createCaseStep1Schema
  .merge(createCaseStep2Schema)
  .merge(createCaseStep3Schema)

export type CreateCaseStep1Values = z.infer<typeof createCaseStep1Schema>
export type CreateCaseStep2Values = z.infer<typeof createCaseStep2Schema>
export type CreateCaseStep3Values = z.infer<typeof createCaseStep3Schema>
export type CreateCaseValues = z.infer<typeof createCaseSchema>
```

## 4.2 `src/features/cases/schemas/case-filters.schema.ts`

```typescript
import { z } from 'zod'
import { CaseStatus } from '../types/case.types'

export const caseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(CaseStatus)).optional(),
  crimeTypeId: z.string().optional(),
  departmentId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['caseNumber', 'title', 'status', 'reportedDate', 'lastActivityAt'])
    .optional()
    .default('reportedDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type CaseFiltersValues = z.infer<typeof caseFiltersSchema>
```

## 4.3 `src/features/cases/schemas/add-note.schema.ts`

```typescript
import { z } from 'zod'

export const addCaseNoteSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Note cannot be empty.' })
    .max(1000, { message: 'Note must be no more than 1000 characters.' }),
})

export type AddCaseNoteValues = z.infer<typeof addCaseNoteSchema>
```

## 4.4 `src/features/cases/schemas/status-transition.schema.ts`

```typescript
import { z } from 'zod'
import { CaseStatus } from '../types/case.types'

export const statusTransitionSchema = z
  .object({
    toStatus: z.nativeEnum(CaseStatus),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Archival requires a reason
      if (data.toStatus === CaseStatus.ARCHIVED) {
        return (data.reason?.trim().length ?? 0) > 0
      }
      return true
    },
    {
      message: 'A reason is required when archiving a case.',
      path: ['reason'],
    },
  )

export type StatusTransitionValues = z.infer<typeof statusTransitionSchema>
```

## 4.5 API Response Schemas (`src/features/cases/schemas/case-api.schema.ts`)

Define Zod schemas for validating API responses. These ensure the frontend breaks loudly if the backend contract drifts.

```typescript
import { z } from 'zod'
import { CaseStatus, TimelineEventType } from '../types/case.types'

export const caseOfficerSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  departmentId: z.string().uuid(),
  departmentName: z.string(),
})

export const caseListItemSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string(),
  title: z.string(),
  status: z.nativeEnum(CaseStatus),
  crimeType: z.object({ id: z.string(), name: z.string(), code: z.string() }),
  department: z.object({ id: z.string(), name: z.string() }),
  leadOfficer: caseOfficerSchema.pick({
    id: true,
    badgeNumber: true,
    firstName: true,
    lastName: true,
  }),
  incidentDate: z.string(),
  reportedDate: z.string(),
  evidenceCount: z.number(),
  arrestCount: z.number(),
  lastActivityAt: z.string(),
})

export const caseDetailSchema = caseListItemSchema.extend({
  description: z.string(),
  location: z
    .object({ id: z.string(), name: z.string(), address: z.string().optional() })
    .nullable(),
  chargeCount: z.number(),
  memberCount: z.number(),
  closedDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const timelineEntrySchema = z.object({
  id: z.string().uuid(),
  eventType: z.nativeEnum(TimelineEventType),
  eventLabel: z.string(),
  actor: caseOfficerSchema,
  description: z.string(),
  diff: z
    .array(z.object({ fieldName: z.string(), before: z.unknown(), after: z.unknown() }))
    .nullable(),
  securitySeverity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable(),
  createdAt: z.string(),
})

export const paginatedCasesSchema = z.object({
  data: z.array(caseListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

export const paginatedTimelineSchema = z.object({
  data: z.array(timelineEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
```

---

# 5. Cases Service Implementation

## 5.1 `src/services/domain/cases.service.ts`

Replace all stubs with real Axios calls. All responses are validated against Zod schemas before being returned. The `apiClient` automatically unwraps `response.data` via the response interceptor, so functions receive the data object directly.

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedCasesSchema,
  caseDetailSchema,
  paginatedTimelineSchema,
} from '@features/cases/schemas/case-api.schema'
import type {
  Case,
  CaseListItem,
  CaseFilters,
  TimelineEntry,
  TimelineFilters,
  CaseMember,
  CaseSummary,
  CreateCasePayload,
  StatusTransitionPayload,
} from '@features/cases/types/case.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── List ──────────────────────────────────────────────────────────────────
export async function getCases(
  filters: CaseFilters,
): Promise<PaginatedResponse<CaseListItem>> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status?.length) params.set('status', filters.status.join(','))
  if (filters.crimeTypeId) params.set('crimeTypeId', filters.crimeTypeId)
  if (filters.departmentId) params.set('departmentId', filters.departmentId)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) params.set('sortField', filters.sortField)
  if (filters.sortDirection) params.set('sortDirection', filters.sortDirection)

  const raw = await apiClient.get(`/api/v1/cases?${params.toString()}`)
  return paginatedCasesSchema.parse(raw)
}

// ─── Detail ────────────────────────────────────────────────────────────────
export async function getCase(caseId: string): Promise<Case> {
  const raw = await apiClient.get(`/api/v1/cases/${caseId}`)
  return caseDetailSchema.parse(raw)
}

// ─── Create ────────────────────────────────────────────────────────────────
export async function createCase(payload: CreateCasePayload): Promise<Case> {
  const raw = await apiClient.post('/api/v1/cases', payload)
  return caseDetailSchema.parse(raw)
}

// ─── Update ────────────────────────────────────────────────────────────────
export async function updateCase(
  caseId: string,
  payload: Partial<CreateCasePayload>,
): Promise<Case> {
  const raw = await apiClient.patch(`/api/v1/cases/${caseId}`, payload)
  return caseDetailSchema.parse(raw)
}

// ─── Delete ────────────────────────────────────────────────────────────────
export async function deleteCase(caseId: string): Promise<void> {
  await apiClient.delete(`/api/v1/cases/${caseId}`)
}

// ─── Status transition ─────────────────────────────────────────────────────
export async function transitionCaseStatus(
  caseId: string,
  payload: StatusTransitionPayload,
): Promise<Case> {
  const raw = await apiClient.patch(`/api/v1/cases/${caseId}/status`, payload)
  return caseDetailSchema.parse(raw)
}

// ─── Timeline ──────────────────────────────────────────────────────────────
export async function getCaseTimeline(
  caseId: string,
  filters: TimelineFilters & { page?: number; pageSize?: number },
): Promise<PaginatedResponse<TimelineEntry>> {
  const params = new URLSearchParams()
  if (filters.actorSearch) params.set('actorSearch', filters.actorSearch)
  if (filters.eventTypes?.length) params.set('eventTypes', filters.eventTypes.join(','))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))

  const raw = await apiClient.get(
    `/api/v1/cases/${caseId}/timeline?${params.toString()}`,
  )
  return paginatedTimelineSchema.parse(raw)
}

export async function addCaseNote(
  caseId: string,
  content: string,
): Promise<TimelineEntry> {
  const raw = await apiClient.post(`/api/v1/cases/${caseId}/timeline/notes`, { content })
  return raw as TimelineEntry
}

// ─── Members / Officers ────────────────────────────────────────────────────
export async function getCaseMembers(caseId: string): Promise<CaseMember[]> {
  return apiClient.get(`/api/v1/cases/${caseId}/officers`)
}

// ─── Summary ──────────────────────────────────────────────────────────────
export async function getCaseSummary(caseId: string): Promise<CaseSummary> {
  return apiClient.get(`/api/v1/cases/${caseId}/summary`)
}

// ─── Reference data needed for create-case form ───────────────────────────
export async function getCrimeTypes(): Promise<Array<{ id: string; name: string; code: string }>> {
  return apiClient.get('/api/v1/admin/crime-types')
}

export async function getLocations(): Promise<Array<{ id: string; name: string; address?: string }>> {
  return apiClient.get('/api/v1/admin/locations')
}
```

---

# 6. Query Key Factory Update

## 6.1 `src/services/query/keys/caseKeys.ts`

Confirm (or create if missing) the full hierarchical key factory:

```typescript
export const caseKeys = {
  all: ['cases'] as const,

  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...caseKeys.lists(), filters] as const,

  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,

  // Sub-resources keyed under detail(id) for precise invalidation
  summary: (id: string) => [...caseKeys.detail(id), 'summary'] as const,
  timeline: (id: string) => [...caseKeys.detail(id), 'timeline'] as const,
  timelineFiltered: (id: string, filters: Record<string, unknown>) =>
    [...caseKeys.timeline(id), filters] as const,
  officers: (id: string) => [...caseKeys.detail(id), 'officers'] as const,
  evidence: (id: string) => [...caseKeys.detail(id), 'evidence'] as const,
  arrests: (id: string) => [...caseKeys.detail(id), 'arrests'] as const,
  interrogations: (id: string) => [...caseKeys.detail(id), 'interrogations'] as const,
  permissions: (id: string) => [...caseKeys.detail(id), 'permissions'] as const,

  // Reference data
  crimeTypes: () => [...caseKeys.all, 'crimeTypes'] as const,
  locations: () => [...caseKeys.all, 'locations'] as const,
}
```

---

# 7. React Query Hooks

Create all hooks in `src/features/cases/hooks/`.

## 7.1 `useCases.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCases } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import type { CaseFilters } from '../types/case.types'

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: caseKeys.list(filters as Record<string, unknown>),
    queryFn: () => getCases(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev, // Keep previous page data visible during refetch
  })
}
```

## 7.2 `useCase.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCase(caseId: string) {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => getCase(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
```

## 7.3 `useCaseTimeline.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseTimeline } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import type { TimelineFilters } from '../types/case.types'

interface UseCaseTimelineOptions {
  caseId: string
  filters?: TimelineFilters & { page?: number; pageSize?: number }
  enabled?: boolean
}

export function useCaseTimeline({ caseId, filters = {}, enabled = true }: UseCaseTimelineOptions) {
  return useQuery({
    queryKey: caseKeys.timelineFiltered(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseTimeline(caseId, filters),
    staleTime: 0,                        // Always considered stale — timeline is real-time
    refetchInterval: enabled ? 30_000 : false,  // Poll every 30s only when tab is active
    enabled: Boolean(caseId) && enabled,
  })
}
```

## 7.4 `useCaseSummary.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseSummary } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCaseSummary(caseId: string) {
  return useQuery({
    queryKey: caseKeys.summary(caseId),
    queryFn: () => getCaseSummary(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
```

## 7.5 `useCaseOfficers.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseMembers } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCaseOfficers(caseId: string) {
  return useQuery({
    queryKey: caseKeys.officers(caseId),
    queryFn: () => getCaseMembers(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
  })
}
```

## 7.6 `useCreateCase.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCasePayload } from '../types/case.types'

export function useCreateCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: CreateCasePayload) => createCase(payload),
    onSuccess: (newCase) => {
      // Invalidate the cases list so it refreshes on next visit
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      // Pre-populate the detail cache so the detail page loads instantly
      queryClient.setQueryData(caseKeys.detail(newCase.id), newCase)
      addToast({ message: t('create.successMessage', { caseNumber: newCase.caseNumber }), variant: 'success' })
      router.push(`/cases/${newCase.id}`)
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.isValidationError()) {
        // Field errors handled by the form via setError — no toast needed
        return
      }
      addToast({ message: t('create.errorMessage'), variant: 'error' })
    },
  })
}
```

## 7.7 `useUpdateCase.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { Case, CreateCasePayload } from '../types/case.types'

export function useUpdateCase(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: Partial<CreateCasePayload>) => updateCase(caseId, payload),
    onSuccess: (updatedCase: Case) => {
      queryClient.setQueryData(caseKeys.detail(caseId), updatedCase)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      addToast({ message: t('update.successMessage'), variant: 'success' })
    },
  })
}
```

## 7.8 `useTransitionCaseStatus.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { transitionCaseStatus } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { useUIStore } from '@shared/stores/ui.store'
import type { StatusTransitionPayload } from '../types/case.types'

export function useTransitionCaseStatus(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const { closeModal } = useUIStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: StatusTransitionPayload) => transitionCaseStatus(caseId, payload),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseKeys.detail(caseId), updatedCase)
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) })
      closeModal()
      addToast({ message: t('status.transitionSuccess'), variant: 'success' })
    },
  })
}
```

## 7.9 `useAddCaseNote.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { addCaseNote } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useAddCaseNote(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (content: string) => addCaseNote(caseId, content),
    onSuccess: () => {
      // Immediately invalidate timeline — the new note must appear at once
      void queryClient.invalidateQueries({ queryKey: caseKeys.timeline(caseId) })
    },
    onError: () => {
      addToast({ message: t('timeline.noteError'), variant: 'error' })
    },
  })
}
```

## 7.10 `useDeleteCase.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { deleteCase } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useDeleteCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (caseId: string) => deleteCase(caseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      addToast({ message: t('delete.successMessage'), variant: 'success' })
      router.push('/cases')
    },
  })
}
```

## 7.11 Reference data hooks

Create `useCrimeTypes.ts` and `useLocations.ts` using `getCrimeTypes()` and `getLocations()` with `staleTime: 30 * 60 * 1000` (30 minutes — reference data changes rarely).

## 7.12 Hook barrel (`src/features/cases/hooks/index.ts`)

Export all hooks from a single barrel.

---

# 8. Internationalisation — Cases Messages

## 8.1 `messages/en/cases.json` — Full population (replace Phase 2 skeleton)

```json
{
  "pageTitle": "Cases",
  "list": {
    "heading": "All Cases",
    "entityCount": "{count} case(s)",
    "newCase": "New Case",
    "searchPlaceholder": "Search by case number, title...",
    "filterStatus": "Status",
    "filterCrimeType": "Crime Type",
    "filterDepartment": "Department",
    "filterDateRange": "Date Range",
    "noResults": "No cases found.",
    "noResultsDescription": "Try adjusting your search or filter criteria.",
    "loading": "Loading cases...",
    "columns": {
      "caseNumber": "Case No.",
      "title": "Title",
      "status": "Status",
      "crimeType": "Crime Type",
      "department": "Department",
      "leadOfficer": "Lead Officer",
      "reportedDate": "Reported",
      "lastActivity": "Last Activity",
      "actions": "Actions"
    },
    "rowActions": {
      "view": "View Case",
      "edit": "Edit Case",
      "transition": "Change Status",
      "delete": "Delete Case"
    }
  },
  "create": {
    "pageTitle": "New Case",
    "heading": "Create New Case",
    "successMessage": "Case {caseNumber} created successfully.",
    "errorMessage": "Failed to create the case. Please check the form and try again.",
    "steps": {
      "basicInfo": "Basic Information",
      "crimeDetails": "Crime Details",
      "assignment": "Assignment"
    },
    "step1": {
      "heading": "Basic Information",
      "titleLabel": "Case Title",
      "titlePlaceholder": "e.g. Robbery at Bole Road Market — 12 June 2026",
      "descriptionLabel": "Case Description",
      "descriptionPlaceholder": "Describe the incident in detail...",
      "incidentDateLabel": "Incident Date",
      "locationLabel": "Location (optional)",
      "locationPlaceholder": "Search locations..."
    },
    "step2": {
      "heading": "Crime Details",
      "crimeTypeLabel": "Crime Type",
      "crimeTypePlaceholder": "Select a crime type...",
      "departmentLabel": "Responsible Department",
      "departmentPlaceholder": "Select a department..."
    },
    "step3": {
      "heading": "Assignment",
      "leadOfficerLabel": "Lead Investigator",
      "leadOfficerPlaceholder": "Search officers...",
      "additionalOfficersLabel": "Additional Officers (optional)",
      "additionalOfficersPlaceholder": "Search officers..."
    }
  },
  "detail": {
    "loading": "Loading case...",
    "notFound": "Case not found.",
    "headerCard": {
      "caseNumberLabel": "Case Number",
      "departmentLabel": "Department",
      "crimeTypeLabel": "Crime Type",
      "leadOfficerLabel": "Lead Officer",
      "incidentDateLabel": "Incident Date",
      "reportedDateLabel": "Date Reported",
      "closedDateLabel": "Date Closed"
    },
    "actions": {
      "edit": "Edit Case",
      "managePermissions": "Manage Permissions",
      "delete": "Delete Case",
      "deleteConfirmTitle": "Delete this case?",
      "deleteConfirmDescription": "This will permanently delete case {caseNumber} and all associated data. This action cannot be undone.",
      "deleteConfirmPhrase": "delete {caseNumber}"
    },
    "tabs": {
      "overview": "Overview",
      "evidence": "Evidence",
      "arrests": "Arrests",
      "interrogations": "Interrogations",
      "legal": "Legal",
      "officers": "Officers",
      "timeline": "Timeline",
      "reports": "Reports",
      "permissions": "Permissions",
      "lockedTooltip": "Requires {minRole} role or higher"
    }
  },
  "overview": {
    "metadataCard": "Case Details",
    "descriptionCard": "Description",
    "summaryPanels": {
      "evidence": "Evidence Items",
      "arrests": "Arrests",
      "charges": "Charges",
      "officers": "Assigned Officers",
      "viewAll": "View all"
    },
    "officersSection": "Assigned Officers",
    "officersSectionEmpty": "No officers assigned to this case.",
    "recentActivity": "Recent Activity",
    "recentActivityEmpty": "No activity recorded yet.",
    "viewAllActivity": "View full timeline"
  },
  "timeline": {
    "pageTitle": "Case Timeline",
    "loading": "Loading timeline...",
    "empty": "No events recorded yet.",
    "filterActor": "Search by officer...",
    "filterEventType": "Event Type",
    "filterDateRange": "Date Range",
    "addNote": "Add Note",
    "notePlaceholder": "Add a note to this case...",
    "noteSubmit": "Add Note",
    "noteError": "Failed to add note. Please try again.",
    "printButton": "Print Timeline",
    "immutableTooltip": "This audit record cannot be modified or deleted.",
    "securityBadge": {
      "LOW": "Low Severity",
      "MEDIUM": "Medium Severity",
      "HIGH": "High Severity",
      "CRITICAL": "Critical Severity"
    },
    "eventTypes": {
      "CASE_CREATED": "Case Created",
      "CASE_UPDATED": "Case Updated",
      "STATUS_CHANGED": "Status Changed",
      "EVIDENCE_ADDED": "Evidence Added",
      "EVIDENCE_UPDATED": "Evidence Updated",
      "OFFICER_ASSIGNED": "Officer Assigned",
      "OFFICER_REMOVED": "Officer Removed",
      "ARREST_RECORDED": "Arrest Recorded",
      "INTERROGATION_RECORDED": "Interrogation Recorded",
      "LEGAL_ACTION": "Legal Action",
      "NOTE_ADDED": "Note Added",
      "PERMISSION_CHANGED": "Permission Changed",
      "LOGIN_FAILURE": "Login Failure"
    }
  },
  "status": {
    "OPEN": "Open",
    "UNDER_INVESTIGATION": "Under Investigation",
    "REFERRED_TO_COURT": "Referred to Court",
    "CLOSED": "Closed",
    "ARCHIVED": "Archived",
    "transitionDrawerTitle": "Change Case Status",
    "transitionDrawerDescription": "Select the new status for this case. Some transitions may require a reason.",
    "currentStatus": "Current status",
    "availableTransitions": "Available transitions",
    "noTransitionsAvailable": "No status transitions available for your role.",
    "reasonLabel": "Reason for change",
    "reasonPlaceholder": "Describe why the status is changing...",
    "reasonRequired": "A reason is required for this transition.",
    "transitionButton": "Confirm Transition",
    "transitionSuccess": "Case status updated successfully.",
    "lockedTransitionTooltip": "Requires {minRole} role",
    "confirmButton": "Change Status",
    "cancelButton": "Cancel"
  },
  "update": {
    "successMessage": "Case updated successfully.",
    "errorMessage": "Failed to update the case."
  },
  "delete": {
    "successMessage": "Case deleted successfully."
  },
  "skeletonTabs": {
    "evidence": "Evidence — Coming in Phase 5",
    "arrests": "Arrests — Coming in Phase 6",
    "interrogations": "Interrogations — Coming in Phase 6",
    "legal": "Legal — Coming in Phase 7",
    "officers": "Officers — Coming in Phase 8",
    "reports": "Reports — Coming in Phase 10",
    "permissions": "Permissions — Coming in Phase 8"
  }
}
```

## 8.2 `messages/am/cases.json`

Create the complete Amharic equivalent with identical key structure. Every key from `en/cases.json` must appear in `am/cases.json`. Key translations:

```json
{
  "pageTitle": "ጉዳዮች",
  "list": {
    "heading": "ሁሉም ጉዳዮች",
    "entityCount": "{count} ጉዳይ",
    "newCase": "አዲስ ጉዳይ",
    "searchPlaceholder": "በጉዳይ ቁጥር ወይም ርዕስ ፈልግ...",
    "filterStatus": "ሁኔታ",
    "filterCrimeType": "የወንጀል ዓይነት",
    "filterDepartment": "ክፍል",
    "filterDateRange": "የቀን ክልል",
    "noResults": "ምንም ጉዳይ አልተገኘም።",
    "noResultsDescription": "ፍለጋ ወይም ማጣሪያ ሁኔታዎን ያስተካክሉ።",
    "loading": "ጉዳዮችን እየጫነ ነው...",
    "columns": {
      "caseNumber": "ጉዳይ ቁ.",
      "title": "ርዕስ",
      "status": "ሁኔታ",
      "crimeType": "የወንጀል ዓይነት",
      "department": "ክፍል",
      "leadOfficer": "ዋና መኮንን",
      "reportedDate": "ዘግቧል",
      "lastActivity": "የኋለኛ እንቅስቃሴ",
      "actions": "ድርጊቶች"
    },
    "rowActions": {
      "view": "ጉዳይ ተመልከት",
      "edit": "ጉዳይ አርትዕ",
      "transition": "ሁኔታ ቀይር",
      "delete": "ጉዳይ ሰርዝ"
    }
  },
  "create": {
    "pageTitle": "አዲስ ጉዳይ",
    "heading": "አዲስ ጉዳይ ፍጠር",
    "successMessage": "ጉዳይ {caseNumber} በተሳካ ሁኔታ ተፈጥሯል።",
    "errorMessage": "ጉዳዩን ለመፍጠር አልተሳካም። ቅጹን ያረጋግጡ።",
    "steps": {
      "basicInfo": "መሠረታዊ መረጃ",
      "crimeDetails": "የወንጀል ዝርዝሮች",
      "assignment": "ምደባ"
    },
    "step1": {
      "heading": "መሠረታዊ መረጃ",
      "titleLabel": "የጉዳይ ርዕስ",
      "titlePlaceholder": "ለምሳሌ ዝርፊያ በቦሌ መንገድ ገበያ — ሰኔ 12 ቀን 2026",
      "descriptionLabel": "የጉዳዩ መግለጫ",
      "descriptionPlaceholder": "ክስተቱን በዝርዝር ያብራሩ...",
      "incidentDateLabel": "የወንጀሉ ቀን",
      "locationLabel": "ቦታ (አማራጭ)",
      "locationPlaceholder": "ቦታ ፈልግ..."
    },
    "step2": {
      "heading": "የወንጀል ዝርዝሮች",
      "crimeTypeLabel": "የወንጀል ዓይነት",
      "crimeTypePlaceholder": "የወንጀል ዓይነት ምረጥ...",
      "departmentLabel": "ኃላፊ ክፍል",
      "departmentPlaceholder": "ክፍል ምረጥ..."
    },
    "step3": {
      "heading": "ምደባ",
      "leadOfficerLabel": "ዋና መርማሪ",
      "leadOfficerPlaceholder": "መኮንን ፈልግ...",
      "additionalOfficersLabel": "ተጨማሪ መኮንኖች (አማራጭ)",
      "additionalOfficersPlaceholder": "መኮንን ፈልግ..."
    }
  },
  "detail": {
    "loading": "ጉዳይ እየጫነ ነው...",
    "notFound": "ጉዳይ አልተገኘም።",
    "headerCard": {
      "caseNumberLabel": "የጉዳይ ቁጥር",
      "departmentLabel": "ክፍል",
      "crimeTypeLabel": "የወንጀል ዓይነት",
      "leadOfficerLabel": "ዋና መኮንን",
      "incidentDateLabel": "የወንጀሉ ቀን",
      "reportedDateLabel": "ዘግቦ የቀረበ ቀን",
      "closedDateLabel": "የተዘጋ ቀን"
    },
    "actions": {
      "edit": "ጉዳይ አርትዕ",
      "managePermissions": "ፈቃዶች አስተዳድር",
      "delete": "ጉዳይ ሰርዝ",
      "deleteConfirmTitle": "ይህን ጉዳይ ሰርዝ?",
      "deleteConfirmDescription": "ጉዳይ {caseNumber} እና ሁሉም ተዛማጅ ውሂብ ይሰርዘዋል። ይህ ድርጊት ሊቀለበስ አይችልም።",
      "deleteConfirmPhrase": "{caseNumber} ሰርዝ"
    },
    "tabs": {
      "overview": "አጠቃላይ እይታ",
      "evidence": "ማስረጃ",
      "arrests": "እስሮች",
      "interrogations": "ምርመራዎች",
      "legal": "ህጋዊ",
      "officers": "መኮንኖች",
      "timeline": "ጊዜ ሰሌዳ",
      "reports": "ሪፖርቶች",
      "permissions": "ፈቃዶች",
      "lockedTooltip": "{minRole} ሚና ወይም ከዛ በላይ ያስፈልጋል"
    }
  },
  "overview": {
    "metadataCard": "የጉዳይ ዝርዝሮች",
    "descriptionCard": "መግለጫ",
    "summaryPanels": {
      "evidence": "የማስረጃ ንጥሎች",
      "arrests": "እስሮች",
      "charges": "ክሶች",
      "officers": "የተመደቡ መኮንኖች",
      "viewAll": "ሁሉ ተመልከት"
    },
    "officersSection": "የተመደቡ መኮንኖች",
    "officersSectionEmpty": "ለዚህ ጉዳይ ምንም መኮንን አልተመደበም።",
    "recentActivity": "የቅርብ ጊዜ እንቅስቃሴ",
    "recentActivityEmpty": "እስካሁን ምንም እንቅስቃሴ አልተመዘገበም።",
    "viewAllActivity": "ሙሉ ጊዜ ሰሌዳ ተመልከት"
  },
  "timeline": {
    "pageTitle": "የጉዳይ ጊዜ ሰሌዳ",
    "loading": "ጊዜ ሰሌዳ እየጫነ ነው...",
    "empty": "እስካሁን ምንም ክስተት አልተመዘገበም።",
    "filterActor": "በመኮንን ፈልግ...",
    "filterEventType": "የክስተት ዓይነት",
    "filterDateRange": "የቀን ክልል",
    "addNote": "ማስታወሻ ጨምር",
    "notePlaceholder": "ለዚህ ጉዳይ ማስታወሻ ጨምር...",
    "noteSubmit": "ማስታወሻ ጨምር",
    "noteError": "ማስታወሻ ለመጨመር አልተሳካም። እንደገና ይሞክሩ።",
    "printButton": "ጊዜ ሰሌዳ አትም",
    "immutableTooltip": "ይህ የኦዲት መዝገብ ሊቀየር ወይም ሊሰረዝ አይችልም።",
    "securityBadge": {
      "LOW": "ዝቅተኛ ክብደት",
      "MEDIUM": "መካከለኛ ክብደት",
      "HIGH": "ከፍተኛ ክብደት",
      "CRITICAL": "ወሳኝ ክብደት"
    },
    "eventTypes": {
      "CASE_CREATED": "ጉዳይ ተፈጥሯል",
      "CASE_UPDATED": "ጉዳይ ተዘምኗል",
      "STATUS_CHANGED": "ሁኔታ ተቀይሯል",
      "EVIDENCE_ADDED": "ማስረጃ ተጨምሯል",
      "EVIDENCE_UPDATED": "ማስረጃ ተዘምኗል",
      "OFFICER_ASSIGNED": "መኮንን ተመድቧል",
      "OFFICER_REMOVED": "መኮንን ተወግዷል",
      "ARREST_RECORDED": "እስር ተመዝግቧል",
      "INTERROGATION_RECORDED": "ምርመራ ተመዝግቧል",
      "LEGAL_ACTION": "ህጋዊ ድርጊት",
      "NOTE_ADDED": "ማስታወሻ ተጨምሯል",
      "PERMISSION_CHANGED": "ፈቃድ ተቀይሯል",
      "LOGIN_FAILURE": "ግባ ስህተት"
    }
  },
  "status": {
    "OPEN": "ክፍት",
    "UNDER_INVESTIGATION": "በምርመራ ላይ",
    "REFERRED_TO_COURT": "ለፍርድ ቤት ቀርቧል",
    "CLOSED": "ዝግ",
    "ARCHIVED": "ማህደር",
    "transitionDrawerTitle": "የጉዳይ ሁኔታ ቀይር",
    "transitionDrawerDescription": "ለዚህ ጉዳይ አዲስ ሁኔታ ምረጥ።",
    "currentStatus": "አሁን ያለ ሁኔታ",
    "availableTransitions": "የሚቻሉ ሽግግሮች",
    "noTransitionsAvailable": "ለሚናዎ ምንም ሁኔታ ሽግግር አይቻልም።",
    "reasonLabel": "የለውጥ ምክንያት",
    "reasonPlaceholder": "ሁኔታው ለምን እንደሚቀየር ያብራሩ...",
    "reasonRequired": "ለዚህ ሽግግር ምክንያት ያስፈልጋል።",
    "transitionButton": "ሽግግር አረጋግጥ",
    "transitionSuccess": "የጉዳይ ሁኔታ በተሳካ ሁኔታ ተዘምኗል።",
    "lockedTransitionTooltip": "{minRole} ሚና ያስፈልጋል",
    "confirmButton": "ሁኔታ ቀይር",
    "cancelButton": "ሰርዝ"
  },
  "update": {
    "successMessage": "ጉዳይ በተሳካ ሁኔታ ተዘምኗል።",
    "errorMessage": "ጉዳዩን ለማዘመን አልተሳካም።"
  },
  "delete": {
    "successMessage": "ጉዳይ በተሳካ ሁኔታ ተሰርዟል።"
  },
  "skeletonTabs": {
    "evidence": "ማስረጃ — በ Phase 5 ይቀርባል",
    "arrests": "እስሮች — በ Phase 6 ይቀርባል",
    "interrogations": "ምርመራዎች — በ Phase 6 ይቀርባል",
    "legal": "ህጋዊ — በ Phase 7 ይቀርባል",
    "officers": "መኮንኖች — በ Phase 8 ይቀርባል",
    "reports": "ሪፖርቶች — በ Phase 10 ይቀርባል",
    "permissions": "ፈቃዶች — በ Phase 8 ይቀርባል"
  }
}
```

---

# 9. UI Implementation — Cases List Page

## 9.1 Route: `src/app/(dashboard)/cases/page.tsx`

This is a Server Component. It calls `getTranslations('cases')` and renders the `<CasesListView>` Client Component inside a `Suspense` boundary.

```typescript
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { CasesListView } from '@features/cases/components/CasesListView'
import { TableSkeleton } from '@shared/components/table/TableSkeleton'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}

export default async function CasesListPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={8} rows={10} />}>
      <CasesListView />
    </Suspense>
  )
}
```

## 9.2 Column Definitions (`src/features/cases/components/case-columns.tsx`)

```typescript
'use client'
import type { ColumnDef } from '@tanstack/react-table'
import type { CaseListItem } from '../types/case.types'
import { StatusBadge } from '@shared/components/display/StatusBadge'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
// ... column definitions
```

Define these columns:

| Column | Cell Content | Sortable | Min Width |
|--------|-------------|----------|-----------|
| `caseNumber` | Monospace text, coloured link to `/cases/[id]` | Yes | 120px |
| `title` | Plain text, truncated at 60 chars with tooltip | Yes | 220px |
| `status` | `<StatusBadge>` with correct variant mapping | Yes | 140px |
| `crimeType` | `crimeType.name` text | No | 140px |
| `department` | `department.name` text | No | 140px |
| `leadOfficer` | `firstName lastName` with avatar initials | No | 160px |
| `reportedDate` | Formatted date (dd MMM yyyy) | Yes | 110px |
| `lastActivity` | Relative time ("2 hours ago") with tooltip of absolute | Yes | 130px |
| `actions` | Kebab `DropdownMenu` with row actions | No | 48px |

**Status → variant mapping for `StatusBadge`:**
```typescript
const STATUS_VARIANT_MAP: Record<CaseStatus, string> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}
```

## 9.3 CasesListView Component (`src/features/cases/components/CasesListView.tsx`)

This Client Component owns the full list page interaction:

```typescript
'use client'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { useCases } from '../hooks/useCases'
import { DataTable } from '@shared/components/table/DataTable'
import { PageHeader } from '@shared/components/display/PageHeader'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useCaseColumns } from './case-columns'
```

**URL state via nuqs:**

```typescript
const [filterState, setFilterState] = useQueryStates({
  search: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  crimeTypeId: parseAsString.withDefault(''),
  departmentId: parseAsString.withDefault(''),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('reportedDate'),
  sortDirection: parseAsString.withDefault('desc'),
})
```

**Filter bar layout:**

```
[ 🔍 Search ───────────────────── ] [Status ▾] [Crime Type ▾] [Department ▾] [Date ▾]
Active chips: ✕ Under Investigation  ✕ Homicide  ✕ 2026-01-01 → 2026-06-30
```

Each active filter renders as a dismissible chip. Clicking the chip calls `setFilterState` to remove that filter and resets `page` to 1.

**DataTable integration:**

Pass the `data`, `columns`, `isLoading`, sorting state (controlled), pagination state (controlled), and `onRowClick` (navigate to `/cases/[id]`). Virtual scrolling activates automatically at 200+ rows via the shared `DataTable` component.

**Page header actions slot:**

```tsx
<PermissionGuard permission={Permission.CASES_WRITE}>
  <Button asChild>
    <Link href="/cases/new">
      <Plus className="mr-2 h-4 w-4" />
      {t('list.newCase')}
    </Link>
  </Button>
</PermissionGuard>
```

---

# 10. UI Implementation — Case Creation

## 10.1 Route: `src/app/(dashboard)/cases/new/page.tsx`

Server Component that renders `<CreateCaseWizard>`.

## 10.2 CreateCaseWizard (`src/features/cases/components/CreateCaseWizard.tsx`)

Client Component implementing a multi-step form. Internal state manages which step is active and accumulates values across steps.

### 10.2.1 Step indicator design

```
Step indicator bar (horizontal, full-width):

  ●───────────●───────────●
  1           2           3
Basic Info  Crime Details  Assignment

● = complete (check icon, success colour)
● = current (filled primary blue)
○ = upcoming (muted)
── = connector line (muted; primary when left side is complete)
```

Render the step indicator as an `<ol>` with `aria-current="step"` on the active item.

### 10.2.2 Step management

```typescript
const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
const [step1Data, setStep1Data] = useState<Partial<CreateCaseStep1Values>>({})
const [step2Data, setStep2Data] = useState<Partial<CreateCaseStep2Values>>({})
// step3 is the final submit

const handleStep1Next = (values: CreateCaseStep1Values) => {
  setStep1Data(values)
  setCurrentStep(2)
}
const handleStep2Next = (values: CreateCaseStep2Values) => {
  setStep2Data(values)
  setCurrentStep(3)
}
const handleStep3Submit = async (values: CreateCaseStep3Values) => {
  await createCase({ ...step1Data, ...step2Data, ...values } as CreateCasePayload)
}
```

Each step renders its own `useForm` instance with the step-specific Zod schema. This avoids polluting a single large form object. The accumulated data is combined only on final submission.

### 10.2.3 Step 1 — Basic Information

Fields: Title (text input), Description (textarea, 6 rows), Incident Date (DatePicker, must not be a future date), Location (SearchableSelect, server search of `/api/v1/admin/locations`).

### 10.2.4 Step 2 — Crime Details

Fields: Crime Type (SearchableSelect, loaded from `useCrimeTypes()`), Department (Select dropdown, loaded from departments list — scoped to officer's department for non-admins).

### 10.2.5 Step 3 — Assignment

Fields: Lead Officer (SearchableSelect, officer name search against `/api/v1/personnel/officers`), Additional Officers (multi-select, same search).

On submit: calls `useCreateCase().mutate(combinedPayload)`.

### 10.2.6 Dirty state guard

```typescript
const isDirty =
  Object.keys(step1Data).length > 0 ||
  Object.keys(step2Data).length > 0

// Attach beforeunload listener if isDirty
useEffect(() => {
  if (!isDirty) return
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [isDirty])
```

Also render a `ConfirmDialog` triggered by the Cancel link click when `isDirty` is true.

---

# 11. UI Implementation — Case Detail Layout

## 11.1 `src/app/(dashboard)/cases/[caseId]/layout.tsx`

This layout is a **Server Component**. It receives `params: { caseId: string }` and `children: React.ReactNode`.

Structure:
```tsx
import { CaseDetailLayout } from '@features/cases/components/CaseDetailLayout'
import { CaseAccessGuard } from '@shared/components/permission/CaseAccessGuard'

export default function Layout({ children, params }) {
  return (
    <CaseAccessGuard caseId={params.caseId} requiredLevel="read">
      <CaseDetailLayout caseId={params.caseId}>
        {children}
      </CaseDetailLayout>
    </CaseAccessGuard>
  )
}
```

## 11.2 CaseDetailLayout (`src/features/cases/components/CaseDetailLayout.tsx`)

Client Component that renders the header card and tab navigation, then `{children}`.

### 11.2.1 Case header card — full visual specification

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  CASE-2026-00142                                    [🔵 Under Investigation] │  ← Monospace caseNumber + interactive StatusBadge
│  Robbery at Bole Road Market — 12 June 2026                                  │  ← h1, 20px semibold
│                                                                              │
│  🏛 Homicide Unit      🏷 Armed Robbery      👤 Insp. Dawit Bekele           │  ← Icon + label chips
│  📅 Incident: 12 Jun 2026    📋 Reported: 14 Jun 2026                        │
│                                                               [Edit] [⋯]    │  ← Permission-guarded actions (right)
└──────────────────────────────────────────────────────────────────────────────┘
```

**Status badge interaction:** When the authenticated officer has `cases:write` permission OR is a case admin, the status badge renders as a `<button>`. Clicking it calls `uiStore.openModal('case-status-transition', { caseId })`. For lower-access officers, it renders as a non-interactive `<span>`.

**Action buttons (right side of header):**
- `Edit Case` — `PermissionGuard` requiring `cases:write`; navigates to `/cases/[caseId]/edit` (Phase 4 will implement this; for now renders a disabled-state placeholder)
- Kebab `DropdownMenu`:
  - `Manage Permissions` — `RoleGuard` requiring ADMIN+
  - Separator
  - `Delete Case` (destructive, red) — `RoleGuard` requiring SUPERADMIN; opens `DestructiveConfirmDialog` with `confirmPhrase`

**Loading state:** Render a skeleton card matching the header dimensions while `useCase(caseId).isLoading` is true.

### 11.2.2 Tab navigation bar — full specification

Nine tabs rendered as `<Link>` components. The active tab is determined by `usePathname()`.

```tsx
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@shared/stores/auth.store'
import { Tooltip } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'

const tabs = [
  { label: t('detail.tabs.overview'), href: `/cases/${caseId}`, minRole: null },
  { label: t('detail.tabs.evidence'), href: `/cases/${caseId}/evidence`, minRole: null },
  { label: t('detail.tabs.arrests'), href: `/cases/${caseId}/arrests`, minRole: 'INVESTIGATOR' },
  { label: t('detail.tabs.interrogations'), href: `/cases/${caseId}/interrogations`, minRole: 'INVESTIGATOR' },
  { label: t('detail.tabs.legal'), href: `/cases/${caseId}/legal`, minRole: 'LEGAL_OFFICER' },
  { label: t('detail.tabs.officers'), href: `/cases/${caseId}/officers`, minRole: null },
  { label: t('detail.tabs.timeline'), href: `/cases/${caseId}/timeline`, minRole: null },
  { label: t('detail.tabs.reports'), href: `/cases/${caseId}/reports`, minRole: 'DEPT_HEAD' },
  { label: t('detail.tabs.permissions'), href: `/cases/${caseId}/permissions`, minRole: 'ADMIN' },
]
```

For tabs where the officer lacks the `minRole`:
- Render as a `<span>` not a `<Link>`
- Apply `cursor-not-allowed` and `opacity-50`
- Wrap in a `<Tooltip>` showing `t('detail.tabs.lockedTooltip', { minRole })`
- Render a `<Lock className="h-3 w-3 ml-1 inline" />` icon after the label

Active tab styling: bottom-border `2px solid var(--color-primary)`, foreground text colour. Inactive: `foreground-muted`. Hover: foreground.

The tab bar is `overflow-x: auto` with `scrollbar-none` on mobile for horizontal scroll.

---

# 12. UI Implementation — Case Overview Tab

## 12.1 Route: `src/app/(dashboard)/cases/[caseId]/page.tsx`

Server Component that renders `<CaseOverviewTab caseId={params.caseId} />`.

## 12.2 CaseOverviewTab (`src/features/cases/components/CaseOverviewTab.tsx`)

Client Component. Fetches case detail, summary, officers, and recent timeline in parallel:

```typescript
const { data: caseDetail, isLoading: caseLoading } = useCase(caseId)
const { data: summary, isLoading: summaryLoading } = useCaseSummary(caseId)
const { data: officersResult } = useCaseOfficers(caseId)
const { data: recentActivity } = useCaseTimeline({
  caseId,
  filters: { pageSize: 5 },
  enabled: true,
})
```

### 12.2.1 Section: Case Metadata Card

Renders `<MetadataCard>` with these items:
- Case Number (monospace)
- Status (StatusBadge)
- Crime Type
- Department
- Lead Officer (linked)
- Location (or "—" if null)
- Incident Date (formatted)
- Reported Date (formatted)
- Closed Date (formatted, or "—" if open)
- Last Activity (relative time)

Loading: render `<MetadataCard>` skeleton (six rows of skeleton text).

### 12.2.2 Section: Description

```
┌─────────────────────────────────────────────────────────────┐
│ Description                                                  │  ← SectionHeader
│─────────────────────────────────────────────────────────────│
│ [whitespace-preserved plain text, max 6 lines with          │
│  "Show more" toggle if longer]                              │
└─────────────────────────────────────────────────────────────┘
```

If description is longer than 300 characters, truncate and render a "Show more" toggle. **Never use `dangerouslySetInnerHTML`**. Render as `<pre>` with `white-space: pre-wrap` or a `<p>` with `whitespace-pre-wrap` className.

### 12.2.3 Section: Summary Panels Row

Three cards in a 3-column responsive grid (single column on mobile):

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🗂  14           │  │ 👤  3            │  │ ⚖️  2            │
│ Evidence Items   │  │ Arrests          │  │ Charges          │
│ View all →       │  │ View all →       │  │ View all →       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Each card's number is the large `3xl` font size. "View all →" is a link to the respective tab. Loading: number renders as a skeleton pulse.

### 12.2.4 Section: Assigned Officers

Compact list using `CaseMember[]` data from `useCaseOfficers`. Each row:
```
[Avatar initials]  Insp. Dawit Bekele (BD-00142)    WRITE access    Assigned 12 Jun 2026
```

Avatar is a small circle with initials (first + last name initial). Role badge uses the role constant. `accessLevel` shown as a small chip (`READ`/`WRITE`/`ADMIN`).

Empty state: `<EmptyState>` with "No officers assigned."

### 12.2.5 Section: Recent Activity

Renders the last 5 timeline entries using `<Timeline>` + `<TimelineEntry>` + `<TimelineConnector>` shared components. Show only: event icon, event label, actor name, relative timestamp.

Footer: `<Link>` to the timeline tab: "View full timeline →"

Empty state: muted text "No activity recorded yet."

---

# 13. UI Implementation — Case Timeline Tab

## 13.1 Route: `src/app/(dashboard)/cases/[caseId]/timeline/page.tsx`

Server Component rendering `<CaseTimelineTab caseId={params.caseId} />`.

## 13.2 CaseTimelineTab (`src/features/cases/components/CaseTimelineTab.tsx`)

Client Component. Manages filter state and the add-note form.

### 13.2.1 Polling behaviour

```typescript
const [isVisible, setIsVisible] = useState(true)

// Pause polling when the tab is not the active browser tab
useEffect(() => {
  const handler = () => setIsVisible(!document.hidden)
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}, [])

const { data, isLoading, isFetching } = useCaseTimeline({
  caseId,
  filters: timelineFilters,
  enabled: isVisible,
})
```

A subtle "live" indicator — a pulsing green dot — appears in the PageHeader when `isVisible && !isFetching`. When `isFetching` (background refresh), it spins. This communicates to investigators that the feed is live.

### 13.2.2 Filter bar

```
[🔍 Officer search ──────] [Event Type ▾] [📅 Date from] → [📅 Date to]  [Clear All]
```

Filter state is local `useState` (NOT URL) for the timeline — timeline is a real-time view and filter state does not need to be preserved in the URL.

### 13.2.3 Add case note — inline form

Positioned at the very TOP of the timeline (newest-first), above the first entry:

```
┌──────────────────────────────────────────────────────────────┐
│ [📝 Add a note to this case...                          ] [+] │
└──────────────────────────────────────────────────────────────┘
```

The textarea auto-expands as the user types (1–4 lines). On submit:
- Calls `useAddCaseNote(caseId).mutate(content)`
- Clears the textarea on success
- Shows a spinner in the submit button while `isPending`
- Never shows a toast on success — the new note appears in the timeline immediately after invalidation

Field validation: minimum 1 character, maximum 1000 characters. Character count displayed below the textarea when it has content (`{count}/1000`).

### 13.2.4 Timeline entries — full visual specification

```
  ● ─────────────────────────────────────────────────────────── 🔒
  │
  │ [🔑] Status Changed                          [MEDIUM SEVERITY 🔴]
  │      Insp. Dawit Bekele (BD-00142)  ·  Bole Division
  │      2026-06-14 09:23:11 UTC  ·  7 minutes ago
  │
  │      Case status changed from OPEN to UNDER_INVESTIGATION
  │
  │      ┌── Before ──────────────────┐  ┌── After ───────────────────┐
  │      │  status: "OPEN"            │  │  status: "UNDER_INVESTIGA- │
  │      │                            │  │  TION"                     │
  │      └────────────────────────────┘  └────────────────────────────┘
  │
  ● ─────────────────────────────────────────────────────────── 🔒
  │
  │ [📋] Note Added
  │      ...
```

**Connector line:** The vertical line between entries uses `TimelineConnector`. When a gap > 24 hours exists between consecutive entries: amber dashed line + `"Custody Gap Detected"` amber badge.

**Diff viewer:** Only renders for entries where `diff !== null`. Side-by-side panels. Monospace font. If a field value is long, it truncates with a "Show full" toggle. The before panel has a very subtle `rgba(239, 68, 68, 0.08)` background; the after panel has `rgba(34, 197, 94, 0.08)`.

**Security badge:** Renders for entries where `securitySeverity !== null`. Badge variant:
- `LOW` → muted
- `MEDIUM` → warning
- `HIGH` / `CRITICAL` → destructive, slightly larger badge

**Immutability indicator:** Padlock `<Lock>` icon at the far right of each entry. Always rendered. Tooltip: `t('timeline.immutableTooltip')`.

**Actor linking:** For ADMIN+ role officers, actor name is a `<Link>` to `/personnel/officers/[officer.id]`. For lower roles: plain text.

### 13.2.5 Print timeline

```typescript
function handlePrint() {
  window.print()
}
```

The CSS print stylesheet (injected via a `<style>` tag or a dedicated `print.css` imported only in this component) hides all navigation chrome, the filter bar, and the add-note form. Renders the timeline in black-and-white with the CCMS letterhead at the top:

```
CCMS — Criminal Case Management System
Case Timeline: CASE-2026-00142
Generated: 14 June 2026 09:30 UTC
[Officer name who generated the report]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[entries...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authorised personnel only. All access is logged.
```

---

# 14. UI Implementation — Status Transition

## 14.1 StatusTransitionModal (`src/features/cases/components/StatusTransitionModal.tsx`)

Register in `ModalRenderer` registry under key `'case-status-transition'`. Receives `caseId` from `uiStore.activeModal.props`.

This component renders as a `<SlideOverDrawer>` (width 480px).

### 14.1.1 Drawer content structure

```
Status Transition Drawer
────────────────────────────────────────────────────────────
Current status:   [🔵 Under Investigation]

Available transitions:
  ○  Referred to Court      → Select
  ○  Closed                 → Select   [requires Investigator+]

  Reason for change (required for archival):
  [                                                          ]

────────────────────────────────────────────────────────────
                                    [Cancel] [Change Status]
```

**Available transitions:** Computed from `CASE_STATUS_TRANSITIONS[currentStatus]`. For each candidate status, check if the current officer has the `STATUS_TRANSITION_MIN_ROLE`. Inaccessible transitions render as grey, non-clickable rows with a `<Tooltip>` naming the required role.

**Radio-style selection:** The user clicks a transition row to select it. The selected row highlights with `var(--color-primary)` left border and a subtle background fill.

**Reason field:** Conditionally required. Renders when archival is selected. A `<Textarea>` of 3 rows. Zod validation fires on "Change Status" click.

**Loading:** The "Change Status" button shows a spinner while `useTransitionCaseStatus.isPending`. Both buttons disabled during loading.

---

# 15. Skeleton Pages for Remaining Case Tabs

Each of these pages must render inside the case detail layout with the correct chrome. They are Server Components.

## 15.1 Pattern for skeleton tab pages

```typescript
// src/app/(dashboard)/cases/[caseId]/evidence/page.tsx
import { getTranslations } from 'next-intl/server'

export default async function CaseEvidencePage() {
  const t = await getTranslations('cases')
  return (
    <div className="flex items-center justify-center h-64 text-[var(--color-foreground-muted)]">
      <p>{t('skeletonTabs.evidence')}</p>
    </div>
  )
}
```

Apply this pattern to: `evidence/page.tsx`, `arrests/page.tsx`, `interrogations/page.tsx`, `legal/page.tsx`, `officers/page.tsx`, `reports/page.tsx`, `permissions/page.tsx`.

Also update the main route `new/page.tsx` — this was already scaffolded in Phase 1 but must now render the `<CreateCaseWizard>`.

---

# 16. Missing Routes from Phase 1

Create these pages now. They were defined in `routes.ts` but not created.

## 16.1 `src/app/(errors)/403/page.tsx`

Full `ForbiddenState` page (not a skeleton):

```typescript
import { getTranslations } from 'next-intl/server'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Access Denied' }

export default async function ForbiddenPage() {
  const t = await getTranslations('errors')
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <ForbiddenState
        title={t('pages.403.title')}
        description={t('pages.403.description')}
        action={
          <Button asChild>
            <Link href="/dashboard">{t('pages.403.action')}</Link>
          </Button>
        }
      />
    </div>
  )
}
```

## 16.2 Admin skeleton pages

**`src/app/(dashboard)/admin/locations/page.tsx`:**
```typescript
// PageHeader with title from navigation.json, empty DataTable skeleton
// Role guard: RoleGuard requiring ADMIN+
```

**`src/app/(dashboard)/admin/crime-types/page.tsx`:** Same pattern.

**`src/app/(dashboard)/admin/health/page.tsx`:** Same pattern. Title: "System Health".

## 16.3 Settings skeleton pages

**`src/app/(dashboard)/settings/profile/page.tsx`:** PageHeader with "My Profile" title, FormSection skeleton card with three skeleton field rows.

**`src/app/(dashboard)/settings/password/page.tsx`:** PageHeader with "Change Password" title, FormSection skeleton.

---

# 17. Modal Registry Update

Register the new cases modal in `ModalRenderer`:

```typescript
// src/shared/components/modals/ModalRenderer.tsx
import { StatusTransitionModal } from '@features/cases/components/StatusTransitionModal'

const MODAL_REGISTRY: Record<string, React.ComponentType<Record<string, unknown>>> = {
  'idle-warning': IdleWarningModal,
  'logout-confirm': LogoutConfirmModal,
  'case-status-transition': StatusTransitionModal,  // NEW
}
```

---

# 18. Shared Types Update

## 18.1 `src/shared/types/api.types.ts`

Add `PaginatedResponse<T>` if not already defined:

```typescript
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

# 19. i18n Completeness

Run the completeness test after creating all message files:

```bash
pnpm test tests/integration/i18n-completeness.test.ts
```

All keys in `en/cases.json` must be present in `am/cases.json`. Fix any mismatches before proceeding.

---

# 20. Testing Requirements

## 20.1 Schema Tests (`src/features/cases/schemas/create-case.schema.test.ts`)

- Valid step 1 data passes
- Title shorter than 5 chars fails
- Missing incident date fails
- Valid step 2 data passes
- Missing crimeTypeId fails
- Valid step 3 data passes
- Missing leadOfficerId fails

## 20.2 Schema Tests (`src/features/cases/schemas/status-transition.schema.test.ts`)

- `OPEN → UNDER_INVESTIGATION` without reason passes
- `CLOSED → ARCHIVED` without reason fails (reason required)
- `CLOSED → ARCHIVED` with reason passes

## 20.3 Type Tests (`src/features/cases/types/case.types.test.ts`)

- `CASE_STATUS_TRANSITIONS.ARCHIVED` returns an empty array (no further transitions)
- `CASE_STATUS_TRANSITIONS.OPEN` contains `UNDER_INVESTIGATION` and `CLOSED`

## 20.4 Hook Tests

**`useCases.test.ts`:** With mocked service, verify:
- Query is called with correct filter params
- `placeholderData` is used (previous data visible during refetch)

**`useAddCaseNote.test.ts`:** With mocked service, verify:
- On success, `caseKeys.timeline(caseId)` is invalidated
- No toast on success

**`useTransitionCaseStatus.test.ts`:** With mocked service, verify:
- On success, `closeModal` is called
- `caseKeys.detail(caseId)` and `caseKeys.lists()` are invalidated

## 20.5 Component Tests

**`CasesListView.test.tsx`:**
- Renders the DataTable with mocked case data
- Clicking a filter chip removes it from the URL state
- "New Case" button is not rendered when officer lacks `cases:write`

**`CreateCaseWizard.test.tsx`:**
- Step indicator shows step 1 as active initially
- Clicking "Next" without filling required fields shows validation errors
- Clicking "Next" with valid step 1 data advances to step 2
- "Back" from step 2 returns to step 1 without losing step 2 data

**`CaseDetailLayout.test.tsx` (header card):**
- Status badge renders as `<button>` for officers with `cases:write`
- Status badge renders as `<span>` for read-only officers
- Tabs for inaccessible roles are not navigable

**`StatusTransitionModal.test.tsx`:**
- Available transitions computed correctly from `CASE_STATUS_TRANSITIONS`
- Reason field appears only when archival is the selected transition
- "Change Status" button disabled when reason is empty and archival is selected

## 20.6 E2E Tests (`tests/e2e/cases.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'
import { stubAuthSession } from './helpers/auth.helper'

test.describe('Cases module', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthSession(page, { role: 'INVESTIGATOR' })
  })

  test('navigating to /cases renders the case list', async ({ page }) => {
    await page.route('**/api/v1/cases*', (route) =>
      route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: 'case-001',
              caseNumber: 'CASE-2026-00001',
              title: 'Test Case',
              status: 'OPEN',
              crimeType: { id: 'ct-1', name: 'Robbery', code: 'ROB' },
              department: { id: 'dept-1', name: 'Bole Division' },
              leadOfficer: { id: 'off-1', badgeNumber: 'BD-001', firstName: 'Dawit', lastName: 'Bekele' },
              incidentDate: '2026-06-01T00:00:00Z',
              reportedDate: '2026-06-02T00:00:00Z',
              evidenceCount: 5,
              arrestCount: 1,
              lastActivityAt: '2026-06-14T09:00:00Z',
            },
          ],
          total: 1, page: 1, pageSize: 25, totalPages: 1,
        },
      }),
    )
    await page.goto('/cases')
    await expect(page.getByText('CASE-2026-00001')).toBeVisible()
    await expect(page.getByText('Test Case')).toBeVisible()
  })

  test('clicking a case row navigates to case detail', async ({ page }) => {
    // ... stub cases list + case detail API
    await page.goto('/cases')
    await page.getByText('CASE-2026-00001').click()
    await expect(page).toHaveURL(/\/cases\/case-001/)
  })

  test('case detail tab for restricted role is disabled', async ({ page }) => {
    // stub case detail; officer role is INVESTIGATOR (no ADMIN)
    await page.goto('/cases/case-001')
    const permissionsTab = page.getByRole('link', { name: /Permissions/i })
    await expect(permissionsTab).not.toBeVisible() // rendered as span, not link
    const permissionsSpan = page.getByText(/Permissions/i)
    await expect(permissionsSpan).toHaveCSS('cursor', 'not-allowed')
  })

  test('timeline tab polls every 30 seconds', async ({ page }) => {
    let callCount = 0
    await page.route('**/api/v1/cases/case-001/timeline*', (route) => {
      callCount++
      route.fulfill({ status: 200, json: { data: [], total: 0, page: 1, pageSize: 50 } })
    })
    await page.goto('/cases/case-001/timeline')
    await page.waitForTimeout(35_000) // wait for one poll cycle
    expect(callCount).toBeGreaterThanOrEqual(2)
  })
})
```

---

# 21. Step-by-Step Execution Order

Execute in this exact order. `pnpm type-check` after each step that creates new TypeScript files.

**Step 1 — Create case types**
Create `src/features/cases/types/case.types.ts` and `src/features/cases/types/index.ts`.
Run `pnpm type-check`. Verify zero errors.

**Step 2 — Create case schemas**
Create all four schema files: `create-case.schema.ts`, `case-filters.schema.ts`, `add-note.schema.ts`, `status-transition.schema.ts`, `case-api.schema.ts`.
Run `pnpm type-check`. Verify zero errors.

**Step 3 — Update shared types**
Add `PaginatedResponse<T>` to `src/shared/types/api.types.ts` if missing.
Add it to the barrel `src/shared/types/index.ts`.

**Step 4 — Implement cases service**
Replace stubs in `src/services/domain/cases.service.ts` with real Axios calls.
Run `pnpm type-check`. Verify zero errors.

**Step 5 — Update caseKeys factory**
Confirm `src/services/query/keys/caseKeys.ts` has all sub-resource keys.

**Step 6 — Create all React Query hooks**
Create all 11 hook files in `src/features/cases/hooks/`.
Create `src/features/cases/hooks/index.ts` barrel.
Run `pnpm type-check`. Verify zero errors.

**Step 7 — Create cases i18n messages**
Fully populate `messages/en/cases.json` and `messages/am/cases.json`.
Run `pnpm i18n:types` to regenerate TypeScript message types.
Run `pnpm test tests/integration/i18n-completeness.test.ts` — must pass.

**Step 8 — Cases list page**
Create `src/features/cases/components/case-columns.tsx`.
Create `src/features/cases/components/CasesListView.tsx`.
Update `src/app/(dashboard)/cases/page.tsx` to render `CasesListView`.
Run `pnpm dev` and navigate to `/cases`. Verify the page renders with table skeleton.

**Step 9 — Case creation wizard**
Create `src/features/cases/components/CreateCaseWizard.tsx`.
Update `src/app/(dashboard)/cases/new/page.tsx` to render `CreateCaseWizard`.
Verify the three-step wizard renders and validates correctly.

**Step 10 — Case detail layout — header card**
Create `src/features/cases/components/CaseHeaderCard.tsx`.
Create `src/features/cases/components/CaseTabNav.tsx`.
Create `src/features/cases/components/CaseDetailLayout.tsx`.
Update `src/app/(dashboard)/cases/[caseId]/layout.tsx`.
Run `pnpm dev` and navigate to a case URL. Verify the header and tabs render.

**Step 11 — Case overview tab**
Create `src/features/cases/components/CaseOverviewTab.tsx`.
Update `src/app/(dashboard)/cases/[caseId]/page.tsx`.
Verify all five sections render with correct loading skeletons.

**Step 12 — Case timeline tab**
Create `src/features/cases/components/CaseTimelineTab.tsx`.
Create `src/features/cases/components/AddCaseNoteForm.tsx`.
Update `src/app/(dashboard)/cases/[caseId]/timeline/page.tsx`.
Verify timeline renders, add-note form works, and the 30s poll indicator appears.

**Step 13 — Status transition modal**
Create `src/features/cases/components/StatusTransitionModal.tsx`.
Register in `ModalRenderer`.
Verify clicking the status badge in the header opens the drawer and the transition form works.

**Step 14 — Skeleton tab pages**
Create all seven remaining tab skeleton pages (evidence, arrests, interrogations, legal, officers, reports, permissions).
Verify they render without errors inside the case detail layout.

**Step 15 — Missing routes**
Create `/403`, admin pages, and settings pages.
Verify `/403` renders correctly and includes a link to `/dashboard`.

**Step 16 — Write all tests**
Write all unit, component, and E2E tests from Section 20.
Run `pnpm test` — all must pass.
Run `pnpm test:e2e` — skeleton E2E tests must pass.

**Step 17 — Barrel exports**
Create `src/features/cases/index.ts` exporting all public APIs.
Ensure `src/features/cases/components/index.ts`, `hooks/index.ts`, `schemas/index.ts`, `types/index.ts` are all complete.

**Step 18 — Final verification**
```bash
pnpm type-check   # Zero errors
pnpm lint         # Zero warnings
pnpm test         # All tests pass
pnpm build        # Production build succeeds
```

---

# 22. Visual Design Standards for This Phase

## 22.1 Case list — density and information hierarchy

The cases list is an operational tool used by investigators who may be scanning dozens of cases rapidly. Design principles:

- **Row height**: 52px standard. Compact mode: 40px (toggle in table header).
- **Case number column**: Render in `font-mono`, `text-sm`, `text-[var(--color-primary)]`. It is always the primary navigation anchor — make it visually distinct.
- **Status badge alignment**: All status badges in a column must align to a fixed width (140px). This allows rapid visual scanning.
- **Last Activity column**: Use relative time ("2h ago") in the cell, absolute timestamp in a `<Tooltip>`. This prioritises quick comprehension over precision.
- **Row hover**: `background: var(--color-card-hover)`, `cursor: pointer`. The entire row is a click target.
- **Zebra striping**: Optional. If enabled, alternate rows use `rgba(255,255,255,0.02)`. Do not use high-contrast zebra striping — it impedes fast scanning.
- **No horizontal scrollbar**: Design columns to fit within `1400px` max-width. Prioritise essential columns; secondary columns are hidden on tablet.

## 22.2 Case detail header — visual weight

The case header must visually communicate that this is the command centre for an investigation:

- **Case number**: 14px, monospace, `var(--color-foreground-muted)`. Not prominent — it's a reference identifier.
- **Title (h1)**: 20px, semibold, `var(--color-foreground)`. This is the most prominent element.
- **Status badge**: Slightly larger than standard status badges in the list — 14px text, 8px vertical padding, 14px horizontal padding. Interactive cursor.
- **Chip row** (department, crime type, lead officer): Icon + label in muted colour. Chips separated by `·` centre dot. On mobile, wrap to two lines.
- **Header card background**: `var(--color-card)`, `border-b: 1px solid var(--color-border)`. No shadow — the card floats on the page background naturally.
- **Sticky behaviour**: The case header card is NOT sticky. Only the tab navigation bar is sticky (`position: sticky; top: 0; z-index: 10; background: var(--color-card)`). This preserves screen real estate on scroll.

## 22.3 Timeline — readability and trust

The timeline is a legal document as much as it is a UI. It must feel immutable and trustworthy:

- **Entry spacing**: 24px between entries. The connecting line is continuous between entries with no gap.
- **Event type icons**: Use semantically correct Lucide icons per event type. Be specific: `Shield` for security events, `Upload` for evidence adds, `UserPlus` for officer assignment, `Gavel` for legal actions, `FileText` for notes, `ArrowRightLeft` for status changes, `Search` for case updates.
- **Timestamps**: ISO 8601 in monospace. Relative time on hover. This signals precision and immutability.
- **Diff viewer**: Use a `border: 1px solid var(--color-border)` card with two columns. Before: red tint. After: green tint. Labels "Before" and "After" in `xs` muted uppercase.
- **Padlock icon**: Always top-right of every entry, `var(--color-muted)`, `h-3 w-3`. Small and consistent — it reads as a watermark rather than a button.
- **Live indicator**: A pulsing `●` (filled circle, 8px, `var(--color-success)`) next to the page title when polling is active. Stops pulsing when the browser tab is hidden. Returns to pulsing when active. Respect `prefers-reduced-motion` — static dot when reduced motion is preferred.

## 22.4 Create case wizard — guidance and trust

The wizard must make a complex operation feel guided and safe:

- **Step indicator line**: `2px`, `var(--color-border)` by default; `var(--color-primary)` for completed connections.
- **Form cards**: Each step is wrapped in a `<FormSection>` card. The current step card has a `border: 1px solid var(--color-primary)` with opacity 0.3.
- **Back button**: Render as an outline/ghost button, not a destructive colour. It is safe and reversible.
- **Next/Submit button**: Full-width at the bottom of each step card. Not a floating fixed footer.
- **Transition animation between steps**: 150ms fade-out + 150ms fade-in. The step content slides slightly left (outgoing) and right (incoming). `translateX(8px)`. Respect `prefers-reduced-motion`.

---

# 23. Anti-Patterns Specific to This Phase

In addition to all Phase 1 and Phase 2 anti-patterns, the following are prohibited in Phase 3:

**Data violations:**
- Storing `Case[]` or any case detail data in any Zustand store — all case data lives exclusively in React Query cache
- Client-side filtering of server-fetched case data — all filters translate to API query parameters
- Displaying more than 100 rows in the DOM without virtual scrolling activating

**State violations:**
- Storing filter state in React component state (`useState`) — all list filters go in URL via `nuqs`
- Storing timeline filter state in URL — timeline filters are local component state (real-time view, not shareable)
- Passing case detail props through multiple component levels — use the React Query hook directly in the consuming component

**UI violations:**
- Hiding (not rendering) disabled tabs — they must render as non-interactive `<span>` elements, not be removed from the DOM
- Rendering case note content via `dangerouslySetInnerHTML` — always plain text
- Using raw case ID (UUID) in breadcrumbs — always resolve to the case title from cache
- Starting the 30s timeline poll on page load instead of only when the timeline tab is active
- Opening the status transition drawer without verifying the officer has write access

**Form violations:**
- Using a single large form for the multi-step wizard — each step must be a separate `useForm` instance
- Allowing the Create Case form to submit when on Step 1 or Step 2 — only Step 3 has a Submit action
- Not implementing the dirty-state guard on the Create Case wizard

**Testing violations:**
- Skipping the i18n completeness test — every key in `en/cases.json` must be present in `am/cases.json`
- Mocking `useCase` with hardcoded English strings — tests must be locale-agnostic

---

# 24. Final Verification Checklist

## 24.1 Cases List

- [ ] `/cases` loads and displays the DataTable with mocked or real data
- [ ] Typing in the search box updates the URL `search` param and refetches
- [ ] Selecting a status filter adds it as a chip and updates the URL `status` param
- [ ] Clicking a chip removes that filter and resets page to 1
- [ ] Clicking a table row navigates to `/cases/[id]`
- [ ] The "New Case" button is visible for INVESTIGATOR+ and hidden for lower roles
- [ ] Loading skeleton renders on first load; existing data remains visible on background refetch
- [ ] Sorting by a column header updates the URL `sortField` and `sortDirection` params
- [ ] Pagination controls work: prev/next, page-size selector updates `pageSize` param
- [ ] The total record count displays correctly in the page header

## 24.2 Case Creation

- [ ] `/cases/new` renders the three-step wizard
- [ ] Step 1 shows correct validation errors on empty submit
- [ ] "Next" on valid Step 1 data advances to Step 2 and preserves Step 1 values on "Back"
- [ ] "Next" on valid Step 2 data advances to Step 3
- [ ] "Submit" on valid Step 3 calls the `createCase` API and navigates to the new case
- [ ] Attempting to navigate away with a dirty form triggers a confirmation dialog
- [ ] The `PermissionGuard` prevents access to `/cases/new` for officers without `cases:write`

## 24.3 Case Detail Layout

- [ ] `/cases/[caseId]` renders the header card with all correct fields
- [ ] Case number is in monospace font
- [ ] The status badge is interactive (renders as `<button>`) for INVESTIGATOR+ officers
- [ ] Clicking the status badge opens the status transition drawer
- [ ] All nine tabs render in the tab navigation bar
- [ ] Tabs the officer cannot access are disabled (not hidden) with a lock icon and tooltip
- [ ] The tab navigation bar is sticky on scroll
- [ ] The header card renders a skeleton while `useCase` is loading

## 24.4 Case Overview Tab

- [ ] All five sections render: metadata card, description, summary panels, officers, recent activity
- [ ] Summary panel counts match the case data
- [ ] Summary panel links navigate to the correct tabs
- [ ] "View full timeline" link navigates to `/cases/[caseId]/timeline`
- [ ] Loading skeletons render correctly for each section

## 24.5 Case Timeline Tab

- [ ] Timeline entries render with correct icons, timestamps, and actor names
- [ ] The 30-second polling indicator (green dot) is visible
- [ ] Polling pauses when the browser tab is backgrounded
- [ ] Filter bar: actor search, event type filter, and date range filters work
- [ ] Add note: typing in the form and submitting creates a new entry without a toast
- [ ] Diff viewer renders for CASE_UPDATED events with before/after panels
- [ ] Security badge renders for security events in the correct colour
- [ ] Padlock icon appears on every entry
- [ ] "Print Timeline" button triggers the print dialog with correct CSS

## 24.6 Status Transition

- [ ] Opening the drawer from the status badge shows the current status highlighted
- [ ] Available transitions are computed correctly from `CASE_STATUS_TRANSITIONS`
- [ ] Inaccessible transitions render as disabled with a tooltip
- [ ] Selecting "Archived" makes the reason field appear and required
- [ ] Confirming a transition updates the status badge immediately (cache update)
- [ ] The drawer closes on success and a success toast appears

## 24.7 Missing Routes

- [ ] `/403` renders `ForbiddenState` with a link to `/dashboard`
- [ ] `/admin/locations`, `/admin/crime-types`, `/admin/health` all render skeleton pages
- [ ] `/settings/profile` and `/settings/password` render skeleton pages

## 24.8 i18n

- [ ] All cases UI text is retrieved from `messages/en/cases.json` or `messages/am/cases.json`
- [ ] Switching to Amharic updates all text on the cases list, detail, timeline, and creation pages
- [ ] The i18n completeness test passes with zero missing keys
- [ ] No hardcoded English or Amharic strings in any `.tsx` file

## 24.9 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` passes all cases-module tests
- [ ] `pnpm build` completes the production build without errors

---

*End of CCMS Phase 3 Instruction — Cases Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 4 will implement the Dashboard and required reference data queries*