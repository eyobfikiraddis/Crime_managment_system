CCMS Frontend — Phase 10: Audit System Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 9 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab — basic implementation with 30s polling, add-note form, and a simple timeline list from Phase 4
- **Evidence Module**: Evidence tab, upload drawer, chain of custody timeline, lightbox viewer
- **Arrests Module**: Arrests tab, create/update drawers
- **Interrogations Module**: Interrogations tab, create/read-only detail drawers
- **Legal Module**: Legal tab (court case panel + charges table), all charge/sentence drawers, court cases list page
- **Personnel Module**: Person list/detail (PII masking, role cards, promotion drawers), officer list/detail (management dialogs), create person/officer drawers
- **Departments & Admin Module**: Department list/detail, all department management drawers, locations/crime types admin pages, system health panel
- **Dashboards & Reports**: All four role-specific dashboards, all six report sub-pages, shared chart components (KpiCard, CcmsLineChart, CcmsBarChart, CcmsDonutChart), DateRangePicker
- **Partial audit scaffolding**: The case timeline tab (`/cases/[caseId]/timeline`) has a basic implementation from Phase 4 — 30s polling, add-note inline form, simple timeline entry list (no diff viewer, no filter bar, no export). The officer detail and person detail pages have a stub "Recent Activity" section (last 5 entries as a plain list). The global audit log page at `/admin/audit` is a skeleton. The shared `Timeline`, `TimelineEntry`, and `TimelineConnector` primitives from Phase 1 are scaffolded but not feature-complete.
- **i18n completeness**: Passes for all prior namespaces

## 1.2 Phase 10 Objective

Phase 10 delivers the **Audit System Module** — the system's immutable event record and operational accountability layer. Every significant action in CCMS creates an audit entry. Phase 10 makes that data inspectable, filterable, exportable, and court-ready across four surfaces.

The audit system is read-only by design. No UI component in Phase 10 edits, deletes, or reorders audit entries. The only write operation is adding a case note, which was partially implemented in Phase 4 and is formalised here.

**Phase 10 delivers five sub-systems:**

1. **Shared `AuditTimeline` Component** — A full-featured, reusable timeline viewer mounted in `shared/components/timeline/`. Replaces the Phase 1 scaffold. Consumes paginated audit entries, renders each with the complete entry anatomy (event icon, actor line, timestamp, diff viewer, security badge, immutability indicator), and includes the filter bar and export panel. The three audit surfaces (case, officer, person) all use this component with surface-specific props.

2. **Case Timeline Tab Replacement** — Replaces the Phase 4 basic implementation at `/cases/[caseId]/timeline`. Adds the full filter bar, diff viewer, custody gap detection integration, print view, and CSV export. The 30s polling and add-note form from Phase 4 are retained and integrated into the new architecture.

3. **Global Audit Log Page** — Replaces the skeleton at `/admin/audit`. Full audit log for admin+ roles. Supports filtering by actor, event type, date range, and entity scope (case, officer, department). Includes CSV export and print view.

4. **Officer Audit History Surface** — Replaces the stub "Recent Activity" section on `/personnel/officers/[officerId]` for admin+ viewers. Full paginated timeline of all audit events involving a specific officer, with filters and export. Rendered as a drawer (not a separate page) opening from the officer detail page.

5. **Person Audit History Surface** — Replaces the stub "Recent Activity" section on `/personnel/persons/[personId]` for admin+ viewers. Same architecture as the officer surface.

**Also in scope:**

- `audit` feature module: full type definitions, Zod schemas, service implementation, React Query hooks
- `auditKeys` query key factory at `src/services/query/keys/auditKeys.ts`
- `audit.service.ts` with all endpoints
- Full replacement of the `shared/components/timeline/` scaffold with production-ready implementations of `AuditTimeline.tsx`, `TimelineEntry.tsx`, `TimelineConnector.tsx`, and new additions: `DiffViewer.tsx`, `AuditFilterBar.tsx`, `AuditExportPanel.tsx`, `CustodyGapBadge.tsx`, `AddCaseNoteForm.tsx`
- Print CSS: `src/shared/styles/print.css` for the court-ready print view
- Full population of `messages/en/audit.json` and `messages/am/audit.json`
- New route page: `src/app/(dashboard)/admin/audit/page.tsx`
- New drawer components: `OfficerAuditDrawer.tsx`, `PersonAuditDrawer.tsx`

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Audit service (`src/services/domain/audit.service.ts`):**
- All 7 endpoints (see §8)
- Response validation via Zod `.parse()` on every response
- No `any` types

**Audit types and schemas:**
- `AuditEntry`, `AuditEntryListItem`, `AuditEventType`, `AuditEventCategory`, `AuditDiff`, `AuditDiffField`, `AuditFilters`, `AddCaseNotePayload`, `AuditExportParams`
- All API response Zod schemas

**React Query hooks:**
- `useCaseTimeline(caseId, filters)` — paginated case audit entries; 30s poll when active
- `useGlobalAuditLog(filters)` — paginated global audit log (admin+); no poll
- `useOfficerAuditHistory(officerId, filters, enabled)` — paginated officer history (admin+); no poll
- `usePersonAuditHistory(personId, filters, enabled)` — paginated person history (admin+); no poll
- `useAddCaseNote(caseId)` — mutation: append a note entry to the case timeline
- `useDownloadAuditCsv()` — mutation: triggers CSV download via blob response

**Shared components (all in `shared/components/timeline/`):**
- `AuditTimeline.tsx` — main orchestration component (full replacement)
- `TimelineEntry.tsx` — single entry card (full replacement)
- `TimelineConnector.tsx` — vertical line connector (refinement)
- `DiffViewer.tsx` — new: side-by-side before/after diff card
- `AuditFilterBar.tsx` — new: actor search, event type multi-select, date range
- `AuditExportPanel.tsx` — new: CSV export + print trigger buttons
- `CustodyGapBadge.tsx` — new: amber warning badge for custody chain gaps
- `AddCaseNoteForm.tsx` — new: inline single-field note form for case timeline

**Feature components:**
- `OfficerAuditDrawer.tsx` — SlideOverDrawer wrapping `AuditTimeline` for officer history
- `PersonAuditDrawer.tsx` — SlideOverDrawer wrapping `AuditTimeline` for person history
- `GlobalAuditLog.tsx` — full-page component for `/admin/audit`
- Updated `src/app/(dashboard)/cases/[caseId]/timeline/page.tsx` — replace Phase 4 implementation

**i18n messages:**
- Fully populate `messages/en/audit.json`
- Fully populate `messages/am/audit.json`

## 1.5 What Must NOT Be Implemented

- **Editing or deleting audit entries** — The audit trail is append-only and immutable. No edit, delete, or reorder actions anywhere in the audit system. The padlock immutability indicator is displayed but never clickable in a way that suggests editability.
- **Real-time streaming** — The case timeline polls every 30 seconds. There is no WebSocket or SSE implementation for live audit streaming. Deferred to Phase 12.
- **Diff syntax highlighting** — The diff viewer renders plain text before/after values. No syntax highlighting, no AST-aware diffing, no `react-diff-viewer` library. Plain two-column card with red (before) and green (after) backgrounds.
- **Audit entry creation** beyond case notes — Officers cannot create manual audit entries. The only write operation is adding a case note via `POST /api/v1/cases/{id}/timeline/note`.
- **Bulk audit export spanning all entities** — The CSV export is scoped per surface (case, officer, person, global). There is no "export everything" feature.
- **Audit entry search by content** — Searching by actor name and event type is supported. Full-text search of the `description` field is deferred to Phase 12.
- **Audit entry grouping / collapsing** — Individual entries are never collapsed or grouped. All entries render individually.
- **MSW mocking** — Still deferred.

## 1.6 Handoff Standard

When Phase 10 finishes:
- Navigating to `/cases/[caseId]/timeline` renders the full audit timeline with filter bar, diff viewer on modified entries, print button, and CSV export — not the Phase 4 basic list
- The case timeline continues to poll every 30s while the tab is active
- The add-case-note form at the bottom of the case timeline is retained and functional
- Chain of custody gaps (>24h between sequential custody events) render with an amber dashed connector and a `CustodyGapBadge`
- The filter bar correctly filters by actor, event type, and date range; filter state survives page refresh
- Navigating to `/admin/audit` renders the global audit log (not the skeleton)
- The global audit log's entity scope filter lets admin+ narrow to a specific case or officer
- Clicking "Officer Audit History" on `/personnel/officers/[officerId]` (admin+ only) opens `OfficerAuditDrawer` with the full timeline
- Clicking "Person Audit History" on `/personnel/persons/[personId]` (admin+ only) opens `PersonAuditDrawer` with the full timeline
- Print view strips navigation chrome and renders the timeline in black-and-white with CCMS letterhead
- CSV export triggers a file download named `ccms-audit-{surface}-{date}.csv`
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds
- i18n completeness test passes for `audit` namespace in both EN and AM

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

If `date-fns` is not already installed:
```bash
pnpm add date-fns
```

---

# 3. File & Directory Structure

```
src/
├── features/
│   └── audit/
│       ├── components/
│       │   ├── GlobalAuditLog.tsx               # Full-page component for /admin/audit
│       │   ├── OfficerAuditDrawer.tsx            # SlideOverDrawer — officer audit history
│       │   └── PersonAuditDrawer.tsx             # SlideOverDrawer — person audit history
│       ├── hooks/
│       │   ├── useCaseTimeline.ts
│       │   ├── useGlobalAuditLog.ts
│       │   ├── useOfficerAuditHistory.ts
│       │   ├── usePersonAuditHistory.ts
│       │   ├── useAddCaseNote.ts
│       │   ├── useDownloadAuditCsv.ts
│       │   └── index.ts
│       ├── schemas/
│       │   └── audit-api.schema.ts
│       ├── types/
│       │   ├── audit.types.ts
│       │   └── index.ts
│       ├── utils/
│       │   └── auditUtils.ts
│       └── index.ts

├── shared/
│   ├── components/
│   │   └── timeline/
│   │       ├── AuditTimeline.tsx                # Full replacement of Phase 1 scaffold
│   │       ├── TimelineEntry.tsx                # Full replacement of Phase 1 scaffold
│   │       ├── TimelineConnector.tsx            # Refinement of Phase 1 scaffold
│   │       ├── DiffViewer.tsx                   # New
│   │       ├── AuditFilterBar.tsx               # New
│   │       ├── AuditExportPanel.tsx             # New
│   │       ├── CustodyGapBadge.tsx              # New
│   │       └── AddCaseNoteForm.tsx              # New (formalises Phase 4 inline form)
│   └── styles/
│       └── print.css                            # New — print-optimised stylesheet

├── services/
│   ├── domain/
│   │   └── audit.service.ts                     # New
│   └── query/
│       └── keys/
│           └── auditKeys.ts                     # New

└── app/
    └── (dashboard)/
        ├── cases/
        │   └── [caseId]/
        │       └── timeline/
        │           └── page.tsx                 # REPLACE Phase 4 implementation
        └── admin/
            └── audit/
                └── page.tsx                     # REPLACE skeleton

messages/
├── en/
│   └── audit.json                               # Full EN population
└── am/
    └── audit.json                               # Full AM population
```

---

# 4. TypeScript Types

## 4.1 `src/features/audit/types/audit.types.ts`

```typescript
// ─── Audit Event Category enum ───────────────────────────────────────────────
// Used to group event types in the filter multi-select.
export const AuditEventCategory = {
  CASE:       'CASE',
  EVIDENCE:   'EVIDENCE',
  SECURITY:   'SECURITY',
  LEGAL:      'LEGAL',
  PERSONNEL:  'PERSONNEL',
  ANNOTATION: 'ANNOTATION',
} as const
export type AuditEventCategory =
  (typeof AuditEventCategory)[keyof typeof AuditEventCategory]

// ─── Audit Event Type enum ───────────────────────────────────────────────────
// The full list of discrete event types the backend can emit.
export const AuditEventType = {
  // Case events
  CASE_CREATED:            'CASE_CREATED',
  CASE_UPDATED:            'CASE_UPDATED',
  CASE_STATUS_CHANGED:     'CASE_STATUS_CHANGED',
  CASE_OFFICER_ASSIGNED:   'CASE_OFFICER_ASSIGNED',
  CASE_OFFICER_REMOVED:    'CASE_OFFICER_REMOVED',
  CASE_PERMISSIONS_CHANGED:'CASE_PERMISSIONS_CHANGED',
  CASE_DELETED:            'CASE_DELETED',
  // Evidence events
  EVIDENCE_ADDED:          'EVIDENCE_ADDED',
  EVIDENCE_UPDATED:        'EVIDENCE_UPDATED',
  EVIDENCE_DELETED:        'EVIDENCE_DELETED',
  CUSTODY_TRANSFERRED:     'CUSTODY_TRANSFERRED',
  CUSTODY_EXAMINED:        'CUSTODY_EXAMINED',
  CUSTODY_STORED:          'CUSTODY_STORED',
  CUSTODY_PRESENTED:       'CUSTODY_PRESENTED',
  // Security events
  LOGIN_SUCCESS:           'LOGIN_SUCCESS',
  LOGIN_FAILURE:           'LOGIN_FAILURE',
  LOGOUT:                  'LOGOUT',
  SESSION_EXPIRED:         'SESSION_EXPIRED',
  FORCED_LOGOUT:           'FORCED_LOGOUT',
  PERMISSION_GRANTED:      'PERMISSION_GRANTED',
  PERMISSION_REVOKED:      'PERMISSION_REVOKED',
  ROLE_CHANGED:            'ROLE_CHANGED',
  PASSWORD_RESET:          'PASSWORD_RESET',
  PII_ACCESSED:            'PII_ACCESSED',
  // Legal events
  CHARGE_FILED:            'CHARGE_FILED',
  CHARGE_UPDATED:          'CHARGE_UPDATED',
  CHARGE_DROPPED:          'CHARGE_DROPPED',
  SENTENCE_RECORDED:       'SENTENCE_RECORDED',
  COURT_CASE_CREATED:      'COURT_CASE_CREATED',
  COURT_CASE_UPDATED:      'COURT_CASE_UPDATED',
  HEARING_SCHEDULED:       'HEARING_SCHEDULED',
  // Personnel events
  PERSON_CREATED:          'PERSON_CREATED',
  PERSON_UPDATED:          'PERSON_UPDATED',
  PERSON_ROLE_PROMOTED:    'PERSON_ROLE_PROMOTED',
  OFFICER_CREATED:         'OFFICER_CREATED',
  OFFICER_UPDATED:         'OFFICER_UPDATED',
  OFFICER_ACTIVATED:       'OFFICER_ACTIVATED',
  OFFICER_DEACTIVATED:     'OFFICER_DEACTIVATED',
  // Annotation
  CASE_NOTE_ADDED:         'CASE_NOTE_ADDED',
} as const
export type AuditEventType =
  (typeof AuditEventType)[keyof typeof AuditEventType]

// ─── Category membership ──────────────────────────────────────────────────────
// Maps each event type to its parent category for filter grouping.
export const EVENT_TYPE_CATEGORY: Record<AuditEventType, AuditEventCategory> = {
  CASE_CREATED:             AuditEventCategory.CASE,
  CASE_UPDATED:             AuditEventCategory.CASE,
  CASE_STATUS_CHANGED:      AuditEventCategory.CASE,
  CASE_OFFICER_ASSIGNED:    AuditEventCategory.CASE,
  CASE_OFFICER_REMOVED:     AuditEventCategory.CASE,
  CASE_PERMISSIONS_CHANGED: AuditEventCategory.CASE,
  CASE_DELETED:             AuditEventCategory.CASE,
  EVIDENCE_ADDED:           AuditEventCategory.EVIDENCE,
  EVIDENCE_UPDATED:         AuditEventCategory.EVIDENCE,
  EVIDENCE_DELETED:         AuditEventCategory.EVIDENCE,
  CUSTODY_TRANSFERRED:      AuditEventCategory.EVIDENCE,
  CUSTODY_EXAMINED:         AuditEventCategory.EVIDENCE,
  CUSTODY_STORED:           AuditEventCategory.EVIDENCE,
  CUSTODY_PRESENTED:        AuditEventCategory.EVIDENCE,
  LOGIN_SUCCESS:            AuditEventCategory.SECURITY,
  LOGIN_FAILURE:            AuditEventCategory.SECURITY,
  LOGOUT:                   AuditEventCategory.SECURITY,
  SESSION_EXPIRED:          AuditEventCategory.SECURITY,
  FORCED_LOGOUT:            AuditEventCategory.SECURITY,
  PERMISSION_GRANTED:       AuditEventCategory.SECURITY,
  PERMISSION_REVOKED:       AuditEventCategory.SECURITY,
  ROLE_CHANGED:             AuditEventCategory.SECURITY,
  PASSWORD_RESET:           AuditEventCategory.SECURITY,
  PII_ACCESSED:             AuditEventCategory.SECURITY,
  CHARGE_FILED:             AuditEventCategory.LEGAL,
  CHARGE_UPDATED:           AuditEventCategory.LEGAL,
  CHARGE_DROPPED:           AuditEventCategory.LEGAL,
  SENTENCE_RECORDED:        AuditEventCategory.LEGAL,
  COURT_CASE_CREATED:       AuditEventCategory.LEGAL,
  COURT_CASE_UPDATED:       AuditEventCategory.LEGAL,
  HEARING_SCHEDULED:        AuditEventCategory.LEGAL,
  PERSON_CREATED:           AuditEventCategory.PERSONNEL,
  PERSON_UPDATED:           AuditEventCategory.PERSONNEL,
  PERSON_ROLE_PROMOTED:     AuditEventCategory.PERSONNEL,
  OFFICER_CREATED:          AuditEventCategory.PERSONNEL,
  OFFICER_UPDATED:          AuditEventCategory.PERSONNEL,
  OFFICER_ACTIVATED:        AuditEventCategory.PERSONNEL,
  OFFICER_DEACTIVATED:      AuditEventCategory.PERSONNEL,
  CASE_NOTE_ADDED:          AuditEventCategory.ANNOTATION,
}

// Security-level event types — displayed with a severity badge
export const SECURITY_EVENT_TYPES: AuditEventType[] = [
  AuditEventType.LOGIN_FAILURE,
  AuditEventType.FORCED_LOGOUT,
  AuditEventType.PERMISSION_GRANTED,
  AuditEventType.PERMISSION_REVOKED,
  AuditEventType.ROLE_CHANGED,
  AuditEventType.PII_ACCESSED,
]

// ─── Diff types ───────────────────────────────────────────────────────────────
export interface AuditDiffField {
  field: string            // Human-readable field name (server-generated)
  before: string | null    // String representation of the old value; null if new
  after: string | null     // String representation of the new value; null if deleted
}

export interface AuditDiff {
  fields: AuditDiffField[]
}

// ─── Actor reference ──────────────────────────────────────────────────────────
export interface AuditActor {
  officerId: string
  fullName: string
  badgeNumber: string
  departmentName: string
}

// ─── Custody gap ─────────────────────────────────────────────────────────────
// The backend populates this when consecutive custody events have a gap > 24h.
export interface CustodyGap {
  gapHours: number                // Rounded to nearest hour
  fromTimestamp: string           // ISO 8601 — end of previous custody event
  toTimestamp: string             // ISO 8601 — start of this event
}

// ─── Security severity ────────────────────────────────────────────────────────
export const SecuritySeverity = {
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
} as const
export type SecuritySeverity =
  (typeof SecuritySeverity)[keyof typeof SecuritySeverity]

// ─── Audit Entry ──────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string
  eventType: AuditEventType
  category: AuditEventCategory
  actor: AuditActor
  timestamp: string               // ISO 8601
  description: string             // Human-readable summary from the server
  // Present only for data-modified event types (CASE_UPDATED, PERSON_UPDATED, etc.)
  diff: AuditDiff | null
  // Present only for CASE_NOTE_ADDED events
  noteText: string | null
  // Present only for SECURITY event category
  securitySeverity: SecuritySeverity | null
  // Present when this entry is part of a chain of custody with a detected gap before it
  custodyGap: CustodyGap | null
  // Always true — immutability indicator for UI rendering
  isImmutable: boolean
  // Optional entity links for global audit log context
  linkedCaseId: string | null
  linkedCaseNumber: string | null
}

// ─── Audit Entry List Item (lighter version for list rendering) ───────────────
// Identical to AuditEntry in this implementation — the backend returns full entries.
export type AuditEntryListItem = AuditEntry

// ─── Audit Filters ────────────────────────────────────────────────────────────
export interface AuditFilters {
  actorSearch?: string           // Officer name or badge number
  eventTypes?: AuditEventType[]
  dateFrom?: string              // 'YYYY-MM-DD'
  dateTo?: string                // 'YYYY-MM-DD'
  // Global audit log only:
  linkedCaseId?: string
  linkedOfficerId?: string
  page?: number
  pageSize?: number
}

// Default filter: last 7 days, all event types
export const DEFAULT_AUDIT_PAGE_SIZE = 25

// ─── Add Case Note ────────────────────────────────────────────────────────────
export interface AddCaseNotePayload {
  text: string
}

// ─── Audit Export ─────────────────────────────────────────────────────────────
export interface AuditExportParams {
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string       // caseId, officerId, personId, or 'all' for global
  filters: AuditFilters
}
```

## 4.2 `src/features/audit/types/index.ts`

```typescript
export * from './audit.types'
```

---

# 5. Zod Schemas

## 5.1 `src/features/audit/schemas/audit-api.schema.ts`

```typescript
import { z } from 'zod'
import { AuditEventType, AuditEventCategory, SecuritySeverity } from '../types/audit.types'

const auditActorSchema = z.object({
  officerId: z.string().uuid(),
  fullName: z.string(),
  badgeNumber: z.string(),
  departmentName: z.string(),
})

const auditDiffFieldSchema = z.object({
  field: z.string(),
  before: z.string().nullable(),
  after: z.string().nullable(),
})

const auditDiffSchema = z.object({
  fields: z.array(auditDiffFieldSchema),
})

const custodyGapSchema = z.object({
  gapHours: z.number(),
  fromTimestamp: z.string(),
  toTimestamp: z.string(),
})

export const auditEntrySchema = z.object({
  id: z.string().uuid(),
  eventType: z.nativeEnum(AuditEventType),
  category: z.nativeEnum(AuditEventCategory),
  actor: auditActorSchema,
  timestamp: z.string(),
  description: z.string(),
  diff: auditDiffSchema.nullable(),
  noteText: z.string().nullable(),
  securitySeverity: z.nativeEnum(SecuritySeverity).nullable(),
  custodyGap: custodyGapSchema.nullable(),
  isImmutable: z.boolean(),
  linkedCaseId: z.string().uuid().nullable(),
  linkedCaseNumber: z.string().nullable(),
})

export const paginatedAuditEntriesSchema = z.object({
  data: z.array(auditEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// Add case note response — the server echoes back the created AuditEntry
export const addCaseNoteResponseSchema = auditEntrySchema
```

---

# 6. `src/features/audit/utils/auditUtils.ts`

```typescript
import {
  AuditEventType,
  AuditEventCategory,
  SecuritySeverity,
  SECURITY_EVENT_TYPES,
  EVENT_TYPE_CATEGORY,
} from '../types/audit.types'
import type { LucideIcon } from 'lucide-react'
import {
  Shield,
  Folder,
  Upload,
  User,
  Gavel,
  MessageSquare,
  AlertTriangle,
  LogIn,
  LogOut,
  Key,
  Eye,
} from 'lucide-react'

// ─── Event icon mapping ───────────────────────────────────────────────────────
export const EVENT_TYPE_ICONS: Record<AuditEventType, LucideIcon> = {
  CASE_CREATED:             Folder,
  CASE_UPDATED:             Folder,
  CASE_STATUS_CHANGED:      Folder,
  CASE_OFFICER_ASSIGNED:    User,
  CASE_OFFICER_REMOVED:     User,
  CASE_PERMISSIONS_CHANGED: Shield,
  CASE_DELETED:             Folder,
  EVIDENCE_ADDED:           Upload,
  EVIDENCE_UPDATED:         Upload,
  EVIDENCE_DELETED:         Upload,
  CUSTODY_TRANSFERRED:      Upload,
  CUSTODY_EXAMINED:         Upload,
  CUSTODY_STORED:           Upload,
  CUSTODY_PRESENTED:        Upload,
  LOGIN_SUCCESS:            LogIn,
  LOGIN_FAILURE:            AlertTriangle,
  LOGOUT:                   LogOut,
  SESSION_EXPIRED:          LogOut,
  FORCED_LOGOUT:            LogOut,
  PERMISSION_GRANTED:       Key,
  PERMISSION_REVOKED:       Key,
  ROLE_CHANGED:             Key,
  PASSWORD_RESET:           Key,
  PII_ACCESSED:             Eye,
  CHARGE_FILED:             Gavel,
  CHARGE_UPDATED:           Gavel,
  CHARGE_DROPPED:           Gavel,
  SENTENCE_RECORDED:        Gavel,
  COURT_CASE_CREATED:       Gavel,
  COURT_CASE_UPDATED:       Gavel,
  HEARING_SCHEDULED:        Gavel,
  PERSON_CREATED:           User,
  PERSON_UPDATED:           User,
  PERSON_ROLE_PROMOTED:     User,
  OFFICER_CREATED:          User,
  OFFICER_UPDATED:          User,
  OFFICER_ACTIVATED:        User,
  OFFICER_DEACTIVATED:      User,
  CASE_NOTE_ADDED:          MessageSquare,
}

// ─── Event icon colour by category ───────────────────────────────────────────
// Returns a Tailwind text colour class for the event icon.
export function getEventIconColour(category: AuditEventCategory): string {
  switch (category) {
    case AuditEventCategory.CASE:       return 'text-primary'
    case AuditEventCategory.EVIDENCE:   return 'text-accent'
    case AuditEventCategory.SECURITY:   return 'text-destructive'
    case AuditEventCategory.LEGAL:      return 'text-warning'
    case AuditEventCategory.PERSONNEL:  return 'text-success'
    case AuditEventCategory.ANNOTATION: return 'text-muted'
    default: return 'text-muted'
  }
}

// ─── Security severity badge variant ─────────────────────────────────────────
import type { BadgeVariant } from '@shared/types/ui.types'

export const SECURITY_SEVERITY_VARIANTS: Record<SecuritySeverity, BadgeVariant> = {
  LOW:    'muted',
  MEDIUM: 'warning',
  HIGH:   'destructive',
}

// ─── Security event check ─────────────────────────────────────────────────────
export function isSecurityEvent(eventType: AuditEventType): boolean {
  return SECURITY_EVENT_TYPES.includes(eventType)
}

// ─── Diff-producing event check ───────────────────────────────────────────────
// Returns true when the event type is expected to carry a diff payload.
const DIFF_PRODUCING_TYPES: AuditEventType[] = [
  AuditEventType.CASE_UPDATED,
  AuditEventType.CASE_STATUS_CHANGED,
  AuditEventType.CASE_PERMISSIONS_CHANGED,
  AuditEventType.EVIDENCE_UPDATED,
  AuditEventType.CHARGE_UPDATED,
  AuditEventType.COURT_CASE_UPDATED,
  AuditEventType.PERSON_UPDATED,
  AuditEventType.OFFICER_UPDATED,
  AuditEventType.ROLE_CHANGED,
]

export function isDiffProducingEvent(eventType: AuditEventType): boolean {
  return DIFF_PRODUCING_TYPES.includes(eventType)
}

// ─── Custody event check ─────────────────────────────────────────────────────
const CUSTODY_EVENT_TYPES: AuditEventType[] = [
  AuditEventType.CUSTODY_TRANSFERRED,
  AuditEventType.CUSTODY_EXAMINED,
  AuditEventType.CUSTODY_STORED,
  AuditEventType.CUSTODY_PRESENTED,
  AuditEventType.EVIDENCE_ADDED,
]

export function isCustodyEvent(eventType: AuditEventType): boolean {
  return CUSTODY_EVENT_TYPES.includes(eventType)
}

// ─── Format custody gap duration ─────────────────────────────────────────────
export function formatCustodyGapHours(gapHours: number): string {
  if (gapHours < 24) return `${gapHours} hour${gapHours === 1 ? '' : 's'}`
  const days = Math.floor(gapHours / 24)
  const rem = gapHours % 24
  if (rem === 0) return `${days} day${days === 1 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'}, ${rem} hour${rem === 1 ? '' : 's'}`
}

// ─── Audit CSV filename ───────────────────────────────────────────────────────
import { format } from 'date-fns'

export function buildAuditCsvFilename(
  surface: 'case' | 'officer' | 'person' | 'global',
  entityLabel?: string,
): string {
  const date = format(new Date(), 'yyyy-MM-dd')
  if (entityLabel) return `ccms-audit-${surface}-${entityLabel}-${date}.csv`
  return `ccms-audit-${surface}-${date}.csv`
}

// ─── Event type groups for filter multi-select ────────────────────────────────
// Returns all event types belonging to a category.
export function getEventTypesByCategory(
  category: AuditEventCategory,
): AuditEventType[] {
  return Object.entries(EVENT_TYPE_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([type]) => type as AuditEventType)
}
```

---

# 7. Query Key Factory

## 7.1 `src/services/query/keys/auditKeys.ts`

```typescript
import type { AuditFilters } from '@features/audit/types/audit.types'

export const auditKeys = {
  all: () => ['audit'] as const,

  // Case timeline
  caseTimeline: (caseId: string) =>
    [...auditKeys.all(), 'case', caseId] as const,
  caseTimelineFiltered: (caseId: string, filters: AuditFilters) =>
    [...auditKeys.caseTimeline(caseId), filters] as const,

  // Global audit log (admin+)
  global: () => [...auditKeys.all(), 'global'] as const,
  globalFiltered: (filters: AuditFilters) =>
    [...auditKeys.global(), filters] as const,

  // Officer history (admin+)
  officerHistory: (officerId: string) =>
    [...auditKeys.all(), 'officer', officerId] as const,
  officerHistoryFiltered: (officerId: string, filters: AuditFilters) =>
    [...auditKeys.officerHistory(officerId), filters] as const,

  // Person history (admin+)
  personHistory: (personId: string) =>
    [...auditKeys.all(), 'person', personId] as const,
  personHistoryFiltered: (personId: string, filters: AuditFilters) =>
    [...auditKeys.personHistory(personId), filters] as const,
} as const
```

---

# 8. Service Layer

## 8.1 `src/services/domain/audit.service.ts`

```typescript
import { apiClient } from '@services/api/client'
import { axiosInstance } from '@services/api/client'
import {
  paginatedAuditEntriesSchema,
  addCaseNoteResponseSchema,
} from '@features/audit/schemas/audit-api.schema'
import { buildAuditCsvFilename } from '@features/audit/utils/auditUtils'
import type {
  AuditEntry,
  AuditFilters,
  AddCaseNotePayload,
} from '@features/audit/types/audit.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildAuditParams(filters: AuditFilters): string {
  const p = new URLSearchParams()
  if (filters.actorSearch) p.set('actorSearch', filters.actorSearch)
  if (filters.eventTypes?.length)
    p.set('eventTypes', filters.eventTypes.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  if (filters.linkedCaseId) p.set('linkedCaseId', filters.linkedCaseId)
  if (filters.linkedOfficerId) p.set('linkedOfficerId', filters.linkedOfficerId)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  return p.toString()
}

// ─── Case timeline ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/cases/{caseId}/timeline
 * Paginated audit entries for a specific investigation case.
 * Returns newest-first. Includes custody gap metadata on chain-of-custody entries.
 */
export async function getCaseTimeline(
  caseId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/cases/${caseId}/timeline?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

/**
 * POST /api/v1/cases/{caseId}/timeline/note
 * Appends a case note audit entry to the case timeline.
 * Returns the created AuditEntry.
 */
export async function addCaseNote(
  caseId: string,
  payload: AddCaseNotePayload,
): Promise<AuditEntry> {
  const raw = await apiClient.post(
    `/api/v1/cases/${caseId}/timeline/note`,
    payload,
  )
  return addCaseNoteResponseSchema.parse(raw)
}

// ─── Global audit log (admin+) ────────────────────────────────────────────────

/**
 * GET /api/v1/audit
 * System-wide paginated audit log. Admin+ only.
 * Supports entity scope filters (linkedCaseId, linkedOfficerId).
 */
export async function getGlobalAuditLog(
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── Officer audit history (admin+) ──────────────────────────────────────────

/**
 * GET /api/v1/personnel/officers/{officerId}/audit
 * All audit entries where the officer was the actor. Admin+ only.
 */
export async function getOfficerAuditHistory(
  officerId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/personnel/officers/${officerId}/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── Person audit history (admin+) ───────────────────────────────────────────

/**
 * GET /api/v1/personnel/persons/{personId}/audit
 * All audit entries related to a person record. Admin+ only.
 */
export async function getPersonAuditHistory(
  personId: string,
  filters: AuditFilters,
): Promise<PaginatedResponse<AuditEntry>> {
  const raw = await apiClient.get(
    `/api/v1/personnel/persons/${personId}/audit?${buildAuditParams(filters)}`,
  )
  return paginatedAuditEntriesSchema.parse(raw)
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

/**
 * Downloads an audit timeline as CSV.
 * The endpoint path varies by surface; append ?format=csv to request the blob.
 *
 * endpointPath examples:
 *   'cases/{caseId}/timeline'
 *   'audit'
 *   'personnel/officers/{id}/audit'
 *   'personnel/persons/{id}/audit'
 */
export async function downloadAuditCsv(
  endpointPath: string,
  filters: AuditFilters,
  filename: string,
): Promise<void> {
  const params = buildAuditParams(filters)
  const response = await axiosInstance.get(
    `/api/v1/${endpointPath}?${params}&format=csv`,
    { responseType: 'blob' },
  )
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
```

---

# 9. React Query Hooks

## 9.1 `useCaseTimeline.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCaseTimeline } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useCaseTimeline(caseId: string, filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.caseTimelineFiltered(caseId, filters),
    queryFn: () => getCaseTimeline(caseId, filters),
    // No staleTime — case timeline is always considered stale (append-only stream)
    staleTime: 0,
    // 30s poll while the tab is in the foreground
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
```

## 9.2 `useGlobalAuditLog.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getGlobalAuditLog } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useGlobalAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.globalFiltered(filters),
    queryFn: () => getGlobalAuditLog(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom),
  })
}
```

## 9.3 `useOfficerAuditHistory.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getOfficerAuditHistory } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useOfficerAuditHistory(
  officerId: string,
  filters: AuditFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: auditKeys.officerHistoryFiltered(officerId, filters),
    queryFn: () => getOfficerAuditHistory(officerId, filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(officerId) && enabled,
  })
}
```

## 9.4 `usePersonAuditHistory.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPersonAuditHistory } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function usePersonAuditHistory(
  personId: string,
  filters: AuditFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: auditKeys.personHistoryFiltered(personId, filters),
    queryFn: () => getPersonAuditHistory(personId, filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(personId) && enabled,
  })
}
```

## 9.5 `useAddCaseNote.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { addCaseNote } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { AddCaseNotePayload } from '../types/audit.types'

export function useAddCaseNote(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('audit')

  return useMutation({
    mutationFn: (payload: AddCaseNotePayload) => addCaseNote(caseId, payload),
    onSuccess: () => {
      // Invalidate the case timeline so the new note appears immediately.
      // The 30s poll will also pick it up, but optimistic invalidation is
      // acceptable for append-only annotations (low consequence of a false
      // refetch).
      void queryClient.invalidateQueries({
        queryKey: auditKeys.caseTimeline(caseId),
      })
      addToast({ message: t('note.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('note.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.6 `useDownloadAuditCsv.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { downloadAuditCsv } from '@services/domain/audit.service'
import { useNotificationStore } from '@shared/stores/notification.store'
import { buildAuditCsvFilename } from '../utils/auditUtils'
import type { AuditExportParams } from '../types/audit.types'

export function useDownloadAuditCsv() {
  const { addToast } = useNotificationStore()
  const t = useTranslations('audit')

  const surfaceToEndpoint = (
    surface: AuditExportParams['surface'],
    entityId: string,
  ): string => {
    switch (surface) {
      case 'case':    return `cases/${entityId}/timeline`
      case 'officer': return `personnel/officers/${entityId}/audit`
      case 'person':  return `personnel/persons/${entityId}/audit`
      case 'global':  return 'audit'
    }
  }

  return useMutation({
    mutationFn: (params: AuditExportParams) =>
      downloadAuditCsv(
        surfaceToEndpoint(params.surface, params.entityId),
        params.filters,
        buildAuditCsvFilename(params.surface),
      ),
    onSuccess: () => {
      addToast({ message: t('export.csvSuccessMessage'), variant: 'success' })
    },
    onError: () => {
      addToast({ message: t('export.csvErrorMessage'), variant: 'error' })
    },
  })
}
```

## 9.7 `src/features/audit/hooks/index.ts`

```typescript
export { useCaseTimeline } from './useCaseTimeline'
export { useGlobalAuditLog } from './useGlobalAuditLog'
export { useOfficerAuditHistory } from './useOfficerAuditHistory'
export { usePersonAuditHistory } from './usePersonAuditHistory'
export { useAddCaseNote } from './useAddCaseNote'
export { useDownloadAuditCsv } from './useDownloadAuditCsv'
```

---

# 10. i18n Messages

## 10.1 `messages/en/audit.json` — Full Population

```json
{
  "pageTitle": "Audit Log",
  "caseTimeline": {
    "pageTitle": "Timeline",
    "heading": "Case Timeline",
    "pollingIndicator": "Live — updates every 30s",
    "loading": "Loading timeline...",
    "loadingMore": "Loading more entries...",
    "empty": {
      "title": "No Timeline Entries",
      "description": "No audit events have been recorded for this case yet."
    },
    "emptyFiltered": "No entries match your current filters.",
    "error": "Failed to load the case timeline.",
    "entryCount": "{count} event(s)"
  },
  "globalLog": {
    "heading": "Global Audit Log",
    "description": "System-wide audit trail for all entities and actors.",
    "loading": "Loading audit log...",
    "empty": {
      "title": "No Audit Entries",
      "description": "No audit events match the selected filters."
    },
    "error": "Failed to load the audit log.",
    "entityScope": {
      "label": "Scope",
      "allEntities": "All Entities",
      "caseLabel": "Case",
      "officerLabel": "Officer",
      "casePlaceholder": "Filter by case number...",
      "officerPlaceholder": "Filter by officer badge..."
    }
  },
  "officerHistory": {
    "drawerTitle": "Officer Audit History",
    "drawerDescription": "All audit events involving this officer.",
    "empty": "No audit history for this officer.",
    "error": "Failed to load officer audit history.",
    "openButton": "View Audit History"
  },
  "personHistory": {
    "drawerTitle": "Person Audit History",
    "drawerDescription": "All audit events related to this person record.",
    "empty": "No audit history for this person.",
    "error": "Failed to load person audit history.",
    "openButton": "View Audit History"
  },
  "filter": {
    "label": "Filter",
    "actorSearch": "Search by officer name or badge...",
    "eventType": "Event Type",
    "dateFrom": "From",
    "dateTo": "To",
    "clearAll": "Clear filters",
    "activeFiltersLabel": "{count} filter(s) active",
    "categories": {
      "CASE": "Case Events",
      "EVIDENCE": "Evidence & Custody",
      "SECURITY": "Security Events",
      "LEGAL": "Legal Events",
      "PERSONNEL": "Personnel Events",
      "ANNOTATION": "Annotations"
    }
  },
  "entry": {
    "actor": "by {actorName}",
    "badgeNumber": "({badgeNumber})",
    "timestamp": {
      "absolute": "Absolute time",
      "relative": "Relative time"
    },
    "immutableTooltip": "This audit record cannot be modified or deleted.",
    "diffLabel": "Changes",
    "diffBefore": "Before",
    "diffAfter": "After",
    "diffNoChange": "—",
    "noteLabel": "Note",
    "securityBadge": {
      "LOW": "Low Severity",
      "MEDIUM": "Medium Severity",
      "HIGH": "High Severity"
    }
  },
  "custodyGap": {
    "badgeLabel": "Custody Gap Detected",
    "tooltipText": "A gap of {duration} was detected between sequential custody events. This may require investigation.",
    "fromTo": "From {from} to {to}"
  },
  "eventType": {
    "CASE_CREATED":            "Case Created",
    "CASE_UPDATED":            "Case Updated",
    "CASE_STATUS_CHANGED":     "Status Changed",
    "CASE_OFFICER_ASSIGNED":   "Officer Assigned",
    "CASE_OFFICER_REMOVED":    "Officer Removed",
    "CASE_PERMISSIONS_CHANGED":"Permissions Changed",
    "CASE_DELETED":            "Case Deleted",
    "EVIDENCE_ADDED":          "Evidence Added",
    "EVIDENCE_UPDATED":        "Evidence Updated",
    "EVIDENCE_DELETED":        "Evidence Deleted",
    "CUSTODY_TRANSFERRED":     "Custody Transferred",
    "CUSTODY_EXAMINED":        "Custody Examined",
    "CUSTODY_STORED":          "Custody Stored",
    "CUSTODY_PRESENTED":       "Presented in Court",
    "LOGIN_SUCCESS":           "Login",
    "LOGIN_FAILURE":           "Failed Login Attempt",
    "LOGOUT":                  "Logout",
    "SESSION_EXPIRED":         "Session Expired",
    "FORCED_LOGOUT":           "Forced Logout",
    "PERMISSION_GRANTED":      "Permission Granted",
    "PERMISSION_REVOKED":      "Permission Revoked",
    "ROLE_CHANGED":            "Role Changed",
    "PASSWORD_RESET":          "Password Reset",
    "PII_ACCESSED":            "PII Field Accessed",
    "CHARGE_FILED":            "Charge Filed",
    "CHARGE_UPDATED":          "Charge Updated",
    "CHARGE_DROPPED":          "Charge Dropped",
    "SENTENCE_RECORDED":       "Sentence Recorded",
    "COURT_CASE_CREATED":      "Court Case Created",
    "COURT_CASE_UPDATED":      "Court Case Updated",
    "HEARING_SCHEDULED":       "Hearing Scheduled",
    "PERSON_CREATED":          "Person Record Created",
    "PERSON_UPDATED":          "Person Record Updated",
    "PERSON_ROLE_PROMOTED":    "Role Assigned",
    "OFFICER_CREATED":         "Officer Account Created",
    "OFFICER_UPDATED":         "Officer Account Updated",
    "OFFICER_ACTIVATED":       "Officer Activated",
    "OFFICER_DEACTIVATED":     "Officer Deactivated",
    "CASE_NOTE_ADDED":         "Note Added"
  },
  "note": {
    "formLabel": "Add a case note",
    "placeholder": "Write a note for the case record...",
    "submitButton": "Add Note",
    "successMessage": "Note added to the case timeline.",
    "errorMessage": "Failed to add note. Please try again.",
    "characterCount": "{count} / 2000"
  },
  "export": {
    "csvButton": "Export CSV",
    "printButton": "Print Timeline",
    "csvDownloading": "Downloading...",
    "csvSuccessMessage": "Audit log downloaded.",
    "csvErrorMessage": "Failed to download audit log. Please try again.",
    "printTitle": "CCMS Audit Timeline",
    "printClassification": "CLASSIFICATION: INTERNAL — RESTRICTED",
    "printAuthorisedNotice": "Authorised personnel only. All access is logged and audited.",
    "printGeneratedAt": "Generated: {datetime}",
    "printPageOf": "Page {page} of {total}"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "pageSize": "Per page",
    "showing": "Showing {from}–{to} of {total}"
  }
}
```

## 10.2 `messages/am/audit.json` — Full Amharic Equivalent

```json
{
  "pageTitle": "የኦዲት ምዝገባ",
  "caseTimeline": {
    "pageTitle": "የጊዜ ሰሌዳ",
    "heading": "የጉዳይ ሰሌዳ",
    "pollingIndicator": "ቀጥታ — በ30 ሰከንዶች ይዘምናል",
    "loading": "ሰሌዳ እየጫነ ነው...",
    "loadingMore": "ተጨማሪ ግቤቶች እየጫነ ነው...",
    "empty": {
      "title": "ምንም የሰሌዳ ግቤቶች የሉም",
      "description": "ለዚህ ጉዳይ ምንም ክስተቶች ገና አልተመዘገቡም።"
    },
    "emptyFiltered": "ምንም ግቤቶች ከማጣሪያዎ ጋር አይዛመዱም።",
    "error": "የጉዳዩን ሰሌዳ ለመጫን አልተሳካም።",
    "entryCount": "{count} ክስተት(ቾ)"
  },
  "globalLog": {
    "heading": "ዓለም አቀፍ የኦዲት ምዝገባ",
    "description": "ለሁሉም አካላት እና ተዋናዮች የስርዓት ሙሉ ኦዲት።",
    "loading": "ምዝገባ እየጫነ ነው...",
    "empty": {
      "title": "ምንም ኦዲት ግቤቶች የሉም",
      "description": "ምንም ክስተቶች ከተምረጡ ማጣሪያዎች ጋር አይዛመዱም።"
    },
    "error": "ምዝገባ ለመጫን አልተሳካም።",
    "entityScope": {
      "label": "ወሰን",
      "allEntities": "ሁሉም አካላት",
      "caseLabel": "ጉዳይ",
      "officerLabel": "ፖሊስ",
      "casePlaceholder": "በጉዳይ ቁጥር አጣራ...",
      "officerPlaceholder": "በፖሊስ ባጅ አጣራ..."
    }
  },
  "officerHistory": {
    "drawerTitle": "የፖሊስ ኦዲት ታሪክ",
    "drawerDescription": "ፖሊሱን የሚሳተፉ ሁሉም ክስተቶች።",
    "empty": "ለዚህ ፖሊስ ምንም ኦዲት ታሪክ የለም።",
    "error": "የፖሊስ ኦዲት ታሪክ ለመጫን አልተሳካም።",
    "openButton": "ኦዲት ታሪክ ተመልከት"
  },
  "personHistory": {
    "drawerTitle": "የሰው ኦዲት ታሪክ",
    "drawerDescription": "ከዚህ ሰው መዝገብ ጋር ሁሉም ክስተቶች።",
    "empty": "ለዚህ ሰው ምንም ኦዲት ታሪክ የለም።",
    "error": "የሰው ኦዲት ታሪክ ለመጫን አልተሳካም።",
    "openButton": "ኦዲት ታሪክ ተመልከት"
  },
  "filter": {
    "label": "አጣራ",
    "actorSearch": "በፖሊስ ስም ወይም ባጅ ፈልግ...",
    "eventType": "የክስተት ዓይነት",
    "dateFrom": "ከ",
    "dateTo": "እስከ",
    "clearAll": "ማጣሪያዎች አጽዳ",
    "activeFiltersLabel": "{count} ማጣሪያ(ዎች) ንቁ",
    "categories": {
      "CASE": "የጉዳይ ክስተቶች",
      "EVIDENCE": "ማስረጃ እና ቁጥጥር",
      "SECURITY": "የጸጥታ ክስተቶች",
      "LEGAL": "ሕጋዊ ክስተቶች",
      "PERSONNEL": "የፒርሰን ክስተቶች",
      "ANNOTATION": "ማስታወሻዎች"
    }
  },
  "entry": {
    "actor": "በ {actorName}",
    "badgeNumber": "({badgeNumber})",
    "timestamp": {
      "absolute": "ፍጹም ጊዜ",
      "relative": "አንፃራዊ ጊዜ"
    },
    "immutableTooltip": "ይህ ኦዲት መዝገብ ሊቀየር ወይም ሊሰረዝ አይችልም።",
    "diffLabel": "ለውጦች",
    "diffBefore": "ቀደም",
    "diffAfter": "ዛሬ",
    "diffNoChange": "—",
    "noteLabel": "ማስታወሻ",
    "securityBadge": {
      "LOW": "ዝቅተኛ ክብደት",
      "MEDIUM": "መካከለኛ ክብደት",
      "HIGH": "ከፍተኛ ክብደት"
    }
  },
  "custodyGap": {
    "badgeLabel": "የቁጥጥር ክፍተት ተገኝቷል",
    "tooltipText": "ተከታታይ ክስተቶች መካከል {duration} ክፍተት ተገኝቷል። ምርመራ ሊያስፈልግ ይችላል።",
    "fromTo": "ከ {from} እስከ {to}"
  },
  "eventType": {
    "CASE_CREATED":            "ጉዳይ ተፈጥሯል",
    "CASE_UPDATED":            "ጉዳይ ተዘምኗል",
    "CASE_STATUS_CHANGED":     "ሁኔታ ተቀይሯል",
    "CASE_OFFICER_ASSIGNED":   "ፖሊስ ተሰጥቷል",
    "CASE_OFFICER_REMOVED":    "ፖሊስ ተወግዷል",
    "CASE_PERMISSIONS_CHANGED":"ፈቃዶች ተቀይረዋል",
    "CASE_DELETED":            "ጉዳይ ተሰርዟል",
    "EVIDENCE_ADDED":          "ማስረጃ ተጨምሯል",
    "EVIDENCE_UPDATED":        "ማስረጃ ተዘምኗል",
    "EVIDENCE_DELETED":        "ማስረጃ ተሰርዟል",
    "CUSTODY_TRANSFERRED":     "ቁጥጥር ተላልፏል",
    "CUSTODY_EXAMINED":        "ቁጥጥር ተፈትሷል",
    "CUSTODY_STORED":          "ቁጥጥር ተቀምጧል",
    "CUSTODY_PRESENTED":       "በፍርድ ቤት ቀርቧል",
    "LOGIN_SUCCESS":           "ግቤት",
    "LOGIN_FAILURE":           "ያልተሳካ ሙከራ",
    "LOGOUT":                  "ወጥቷል",
    "SESSION_EXPIRED":         "ክፍለ ጊዜ አልቋል",
    "FORCED_LOGOUT":           "ግዳጅ ወጥቷል",
    "PERMISSION_GRANTED":      "ፈቃድ ተሰጥቷል",
    "PERMISSION_REVOKED":      "ፈቃድ ተሰርዟል",
    "ROLE_CHANGED":            "ሚና ተቀይሯል",
    "PASSWORD_RESET":          "የይለፍ ቃል ዳግም ጀምሯል",
    "PII_ACCESSED":            "ሚስጥራዊ መስክ ተይቷል",
    "CHARGE_FILED":            "ክስ ቀርቧል",
    "CHARGE_UPDATED":          "ክስ ተዘምኗል",
    "CHARGE_DROPPED":          "ክስ ውድቅ ሆኗል",
    "SENTENCE_RECORDED":       "ቅጣት ተሰፍሯል",
    "COURT_CASE_CREATED":      "ፍርድ ቤት ጉዳይ ተፈጥሯል",
    "COURT_CASE_UPDATED":      "ፍርድ ቤት ጉዳይ ተዘምኗል",
    "HEARING_SCHEDULED":       "ችሎት ተዘጋጅቷል",
    "PERSON_CREATED":          "ሰው ተፈጥሯል",
    "PERSON_UPDATED":          "ሰው ተዘምኗል",
    "PERSON_ROLE_PROMOTED":    "ሚና ተሰጥቷል",
    "OFFICER_CREATED":         "ፖሊስ ተፈጥሯል",
    "OFFICER_UPDATED":         "ፖሊስ ተዘምኗል",
    "OFFICER_ACTIVATED":       "ፖሊስ ንቁ ሆኗል",
    "OFFICER_DEACTIVATED":     "ፖሊስ ቆሟል",
    "CASE_NOTE_ADDED":         "ማስታወሻ ታክሏል"
  },
  "note": {
    "formLabel": "ማስታወሻ ጨምር",
    "placeholder": "ለጉዳዩ ማስታወሻ ይፃፉ...",
    "submitButton": "ማስታወሻ ጨምር",
    "successMessage": "ማስታወሻ ወደ ጊዜ ሰሌዳ ታክሏል።",
    "errorMessage": "ማስታወሻ ለማከል አልተሳካም። እንደገና ይሞክሩ።",
    "characterCount": "{count} / 2000"
  },
  "export": {
    "csvButton": "CSV ወርዶ አውርድ",
    "printButton": "ሰሌዳ አትም",
    "csvDownloading": "እያወረደ ነው...",
    "csvSuccessMessage": "ኦዲት ምዝገባ ወርዶ ተጫነ።",
    "csvErrorMessage": "ምዝገባ ለማውረድ አልተሳካም። እንደገና ይሞክሩ።",
    "printTitle": "CCMS ኦዲት ሰሌዳ",
    "printClassification": "ምደባ: ውስጣዊ — ተገቢ",
    "printAuthorisedNotice": "ፈቃደኛ ሰዎች ብቻ። ሁሉም ሁሉም ሁሉም።",
    "printGeneratedAt": "ተፈጥሯል: {datetime}",
    "printPageOf": "ገጽ {page} ከ {total}"
  },
  "pagination": {
    "previous": "ቀዳሚ",
    "next": "ቀጣይ",
    "pageSize": "በገጽ",
    "showing": "{from}–{to} ከ {total}"
  }
}
```

---

# 11. Shared Component — `AuditFilterBar`

## 11.1 `src/shared/components/timeline/AuditFilterBar.tsx`

Client Component. Renders the filter bar used across all four audit surfaces. Filter state is managed by the parent component and passed down via props.

```typescript
'use client'

import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@shared/components/ui/Input'
import { Button } from '@shared/components/ui/Button'
import { DatePicker } from '@shared/components/forms/DatePicker'
import { parseISO, format } from 'date-fns'
import {
  AuditEventCategory,
  AuditEventType,
  EVENT_TYPE_CATEGORY,
} from '@features/audit/types/audit.types'
import { getEventTypesByCategory } from '@features/audit/utils/auditUtils'

interface AuditFilterBarProps {
  actorSearch: string
  onActorSearchChange: (value: string) => void
  selectedEventTypes: AuditEventType[]
  onEventTypesChange: (types: AuditEventType[]) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearAll: () => void
  // Optional: active filter chip count for accessibility label
  activeFilterCount: number
}
```

### 11.1.1 Layout

```
AuditFilterBar
──────────────────────────────────────────────────────────────
[🔍 Search by officer name or badge... ]  [📅 From] [📅 To]
[Event Type ▼]  → opens a Popover with grouped checkboxes

Active filter chips:
  [Actor: Sara Haile ×]  [Type: Case Events ×]  [After: Jun 1 ×]
  [Clear all filters]
──────────────────────────────────────────────────────────────
```

### 11.1.2 Event type multi-select structure

The Event Type filter opens a `Popover` containing grouped checkboxes:

```
Event Type ▼
┌─────────────────────────────────┐
│ [✓] Case Events            (7)  │  ← selects/deselects all in category
│   [✓] Case Created              │
│   [✓] Case Updated              │
│   ...                           │
│ [ ] Evidence & Custody     (7)  │
│ [ ] Security Events        (10) │
│ [ ] Legal Events           (7)  │
│ [ ] Personnel Events       (7)  │
│ [ ] Annotations             (1) │
└─────────────────────────────────┘
```

Selecting a category checkbox toggles all event types within that category. The category checkbox is in an indeterminate state when some (but not all) of its types are selected.

### 11.1.3 Active filter chips

A chip renders for each active filter dimension:
- Actor search: `Actor: {actorSearch} ×`
- Event types: one chip per category that has at least one type selected: `Type: Case Events ×` (clicking × deselects all types in that category)
- Date from: `After: {dateFrom} ×`
- Date to: `Before: {dateTo} ×`

"Clear all filters" link appears when any filter is active.

---

# 12. Shared Component — `DiffViewer`

## 12.1 `src/shared/components/timeline/DiffViewer.tsx`

Client Component. Renders a side-by-side before/after diff for `AuditDiff` payloads.

### 12.1.1 Layout

```
DiffViewer
──────────────────────────────────────────────────────────────
Changes
──────────────────────────────────────────────────────────────
┌── Field: Case Title ─────────────────────────────────────────┐
│  Before                    │  After                         │
│  [red bg]                  │  [green bg]                    │
│  Robbery Investigation     │  Robbery at Bole, June 2026    │
└──────────────────────────────────────────────────────────────┘
┌── Field: Status ─────────────────────────────────────────────┐
│  Before                    │  After                         │
│  [red bg]                  │  [green bg]                    │
│  OPEN                      │  UNDER_INVESTIGATION            │
└──────────────────────────────────────────────────────────────┘
```

### 12.1.2 Colours (use CSS variables — NOT Tailwind colour classes, because these are semantic backgrounds)

```css
/* Before panel */
background-color: rgba(239, 68, 68, 0.08);   /* destructive at 8% opacity */
border-left: 2px solid var(--color-destructive);

/* After panel */
background-color: rgba(34, 197, 94, 0.08);   /* success at 8% opacity */
border-left: 2px solid var(--color-success);
```

### 12.1.3 Null value rendering

- `before === null`: Before panel shows `t('audit.entry.diffNoChange')` ("—") in muted text. This indicates the field was newly added.
- `after === null`: After panel shows `t('audit.entry.diffNoChange')` in muted text. This indicates the field was deleted.

### 12.1.4 Font

All diff values render in `JetBrains Mono` (monospace font), font size `xs` (11px). This matches the blueprint specification: "Monospace font for values."

### 12.1.5 Collapsing

When `diff.fields.length > 5`, render the first 5 fields and a "Show {n} more changes" expand button. Clicking expands all fields. Use local `useState` for expand state — no URL state.

---

# 13. Shared Component — `CustodyGapBadge`

## 13.1 `src/shared/components/timeline/CustodyGapBadge.tsx`

Client Component. Renders the amber warning badge between timeline entries when a custody gap is detected.

### 13.1.1 Visual structure

```
CustodyGapBadge
──────────────────────────────────────────────────────────────
  [amber dashed vertical line — 24px gap]

  ⚠ Custody Gap Detected
    72 hours between sequential events
    From: 14 Jun 2026 08:32 → To: 17 Jun 2026 09:15

  [amber dashed vertical line — 24px gap]
──────────────────────────────────────────────────────────────
```

The badge itself:
- Background: `rgba(245, 158, 11, 0.08)` (warning at 8%)
- Border: `1px solid var(--color-warning)`
- Border radius: `var(--radius-sm)` (4px)
- Padding: 8px 12px
- Icon: `AlertTriangle` (14px, `text-warning`)

The dashed connectors above and below use `border-left: 2px dashed var(--color-warning)` instead of the solid connector used between normal entries.

The badge is not interactive — no tooltip needed. The gap duration and timestamps render as plain text within the badge.

---

# 14. Shared Component — `TimelineEntry`

## 14.1 `src/shared/components/timeline/TimelineEntry.tsx`

Client Component. Replaces the Phase 1 scaffold. Renders a single immutable audit entry card.

### 14.1.1 Full entry anatomy

```
TimelineEntry
──────────────────────────────────────────────────────────────
┌── Entry card ────────────────────────────────────────────────┐
│  [Event icon 16px]  Event Type Label         [🔒 padlock]   │
│                                                              │
│  Actor: Sara Haile (BD-082) — Criminal Investigations Dept  │
│  [Link to officer detail for admin+; unlinked for others]   │
│                                                              │
│  [Absolute timestamp in JetBrains Mono]                     │
│  (Relative time "5 minutes ago" shown on hover as tooltip)  │
│                                                              │
│  Description text (plain text, no HTML)                     │
│                                                              │
│  [Security badge if SECURITY category]                      │
│  ⚠ High Severity                                            │
│                                                              │
│  [DiffViewer if diff !== null] (collapsed by default if >5) │
│                                                              │
│  [Note block if noteText !== null]                          │
│  📝 "Note text rendered in muted italic text"               │
└──────────────────────────────────────────────────────────────┘
```

### 14.1.2 Card styling

```typescript
// Card base styles — no shadow, border-based separation
className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-2"
```

Security events with severity `HIGH` receive an additional subtle left border tint:
```typescript
// HIGH severity security events only
className="... border-l-2 border-l-destructive"
```

### 14.1.3 Actor line and linking

```tsx
// For admin+ roles: actor name is a link to the officer detail page
<PermissionGuard permission={Permission.OFFICERS_MANAGE}>
  <Link href={`/personnel/officers/${entry.actor.officerId}`}
    className="text-sm text-primary hover:underline font-medium">
    {entry.actor.fullName}
  </Link>
</PermissionGuard>
// For lower roles: plain text
<span className="text-sm text-foreground font-medium">
  {entry.actor.fullName}
</span>
// Always rendered (both roles):
<span className="text-xs text-foreground-muted font-mono">
  ({entry.actor.badgeNumber})
</span>
<span className="text-xs text-foreground-muted">
  — {entry.actor.departmentName}
</span>
```

### 14.1.4 Timestamp rendering

```tsx
import { format, formatDistanceToNow, parseISO } from 'date-fns'

const parsed = parseISO(entry.timestamp)
const absolute = format(parsed, 'dd MMM yyyy, HH:mm:ss')
const relative = formatDistanceToNow(parsed, { addSuffix: true })

<Tooltip content={relative}>
  <time
    dateTime={entry.timestamp}
    className="text-xs font-mono text-foreground-muted cursor-default"
    suppressHydrationWarning
  >
    {absolute}
  </time>
</Tooltip>
```

`suppressHydrationWarning` is required because `format` uses the local timezone, which may differ between server and client.

### 14.1.5 Padlock immutability indicator

```tsx
<Tooltip content={t('audit.entry.immutableTooltip')}>
  <Lock className="h-3.5 w-3.5 text-muted flex-shrink-0" aria-label={t('audit.entry.immutableTooltip')} />
</Tooltip>
```

Rendered in the top-right corner of every entry. Non-interactive.

---

# 15. Shared Component — `TimelineConnector`

## 15.1 `src/shared/components/timeline/TimelineConnector.tsx`

The connector renders the vertical line linking one entry to the next. Two variants:

**Normal connector:**
```tsx
<div className="ml-[19px] w-[2px] h-6 bg-border" aria-hidden="true" />
```

**Gap connector (amber dashed):** Used when the next entry has `custodyGap !== null`. The `CustodyGapBadge` is inserted between the two connectors.

```tsx
<div
  className="ml-[19px] w-[2px] h-6"
  style={{ background: 'repeating-linear-gradient(to bottom, var(--color-warning) 0px, var(--color-warning) 4px, transparent 4px, transparent 8px)' }}
  aria-hidden="true"
/>
```

---

# 16. Shared Component — `AuditExportPanel`

## 16.1 `src/shared/components/timeline/AuditExportPanel.tsx`

Client Component. Renders the CSV export and print buttons. Mounted at the top-right of every audit surface.

```typescript
interface AuditExportPanelProps {
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string          // caseId, officerId, personId, or 'all'
  filters: AuditFilters
  printTitle?: string       // e.g. "Case #0042 — Robbery Investigation"
}
```

### 16.1.1 Layout

```tsx
<div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={handlePrint}
    className="print:hidden"
  >
    <Printer className="mr-1.5 h-3.5 w-3.5" />
    {t('audit.export.printButton')}
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={handleCsvExport}
    disabled={downloadMutation.isPending}
  >
    {downloadMutation.isPending ? (
      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
    ) : (
      <Download className="mr-1.5 h-3.5 w-3.5" />
    )}
    {downloadMutation.isPending
      ? t('audit.export.csvDownloading')
      : t('audit.export.csvButton')}
  </Button>
</div>
```

### 16.1.2 Print trigger

`handlePrint` calls `window.print()`. The print CSS (§17) handles stripping navigation chrome. No separate print page route is needed — the print stylesheet handles everything.

---

# 17. Shared Component — `AddCaseNoteForm`

## 17.1 `src/shared/components/timeline/AddCaseNoteForm.tsx`

Client Component. Formalises the Phase 4 inline add-note form. Rendered at the **bottom** of the case timeline only (not on officer, person, or global surfaces).

```typescript
interface AddCaseNoteFormProps {
  caseId: string
}
```

### 17.1.1 Layout

```
AddCaseNoteForm (rendered below the timeline list)
──────────────────────────────────────────────────────────────
  Add a case note
  ┌────────────────────────────────────────────────────────────┐
  │ Write a note for the case record...                       │
  │                                                            │
  │                                    (0 / 2000 chars)        │
  └────────────────────────────────────────────────────────────┘
  [Add Note]   (disabled when empty or exceeds 2000 chars)
──────────────────────────────────────────────────────────────
```

Uses React Hook Form with a single `text` field. Zod schema:

```typescript
const addNoteSchema = z.object({
  text: z
    .string()
    .min(1, { message: 'Note text is required.' })
    .max(2000, { message: 'Note cannot exceed 2000 characters.' }),
})
```

On submit: calls `useAddCaseNote(caseId)`. On success: form resets, timeline invalidates, new note appears at the top. The submit button shows a spinner during submission.

Guard: wrap the form in `PermissionGuard permission={Permission.CASES_MANAGE}`. Officers without case write access see a read-only timeline with no note form.

---

# 18. Shared Component — `AuditTimeline`

## 18.1 `src/shared/components/timeline/AuditTimeline.tsx`

Client Component. The master orchestration component. All four audit surfaces compose this.

```typescript
interface AuditTimelineProps {
  // Data
  entries: AuditEntry[]
  total: number
  isLoading: boolean
  isFetchingNext: boolean
  isError: boolean
  onRetry: () => void

  // Pagination
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void

  // Filters (managed externally)
  filters: AuditFilters
  onFiltersChange: (filters: Partial<AuditFilters>) => void

  // Export
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string
  exportPrintTitle?: string

  // Case note form (case timeline only)
  showNoteForm?: boolean
  caseId?: string

  // Entity scope (global audit log only)
  showEntityScope?: boolean

  // Polling indicator (case timeline only)
  showPollingIndicator?: boolean

  // Empty state customisation
  emptyTitle?: string
  emptyDescription?: string
}
```

### 18.1.1 Render tree

```
AuditTimeline
├── [showPollingIndicator] → polling indicator dot + label (top-right, screen only)
├── AuditFilterBar (filter controls)
│     [showEntityScope] → entity scope dropdowns
├── AuditExportPanel (top-right, screen only)
├── Active filter chips
│
├── [isLoading && entries.length === 0] → Skeleton entries (5× TimelineEntry shapes)
├── [isError] → inline ErrorState with retry button
├── [entries.length === 0 && !isLoading] → EmptyState
│
└── Timeline list (entries.length > 0):
    For each entry (newest first):
      [entry.custodyGap !== null] → CustodyGapBadge ABOVE this entry
      [connector (gap variant if custodyGap)] OR [connector (normal)]
      TimelineEntry
    [connector not rendered after last entry]
│
├── Pagination strip (prev/next, page numbers, page size selector, total count)
│
└── [showNoteForm && caseId] → AddCaseNoteForm (bottom, screen only)
```

### 18.1.2 Loading skeleton

On initial load (`isLoading === true` and `entries.length === 0`), render 5 skeleton entries. Each skeleton matches the TimelineEntry layout:

```tsx
<div className="flex flex-col gap-3">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-48 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  ))}
</div>
```

On background refetch (poll every 30s), existing entries remain visible — no skeleton overlay. Use `isLoading` (not `isFetching`) to guard skeleton visibility.

### 18.1.3 Polling indicator

A subtle animated green dot with label renders in the top-right of the timeline when `showPollingIndicator={true}`:

```tsx
<div className="flex items-center gap-1.5 text-xs text-foreground-muted">
  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
  {t('audit.caseTimeline.pollingIndicator')}
</div>
```

This is a screen-only element — add `print:hidden` to its className.

---

# 19. Print Stylesheet

## 19.1 `src/shared/styles/print.css`

```css
@media print {
  /* ── Hide navigation chrome ─────────────────────────────────── */
  .print\:hidden,
  nav,
  aside,
  header,
  [data-sidebar],
  [data-topbar],
  [data-breadcrumb] {
    display: none !important;
  }

  /* ── Page setup ──────────────────────────────────────────────── */
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 15mm;
  }

  body {
    background-color: #ffffff !important;
    color: #000000 !important;
    font-family: 'Times New Roman', serif;
    font-size: 10pt;
  }

  /* ── CCMS letterhead (injected via JS into a .print-header div) */
  .print-header {
    display: block !important;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .print-header .print-title {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
  }

  .print-header .print-classification {
    font-size: 8pt;
    text-align: center;
    letter-spacing: 0.05em;
    font-weight: bold;
  }

  .print-header .print-notice {
    font-size: 8pt;
    text-align: center;
    font-style: italic;
    margin-top: 4px;
  }

  /* ── Timeline entries ────────────────────────────────────────── */
  [data-timeline-entry] {
    border: 1px solid #cccccc !important;
    background-color: #ffffff !important;
    color: #000000 !important;
    border-radius: 0 !important;
    page-break-inside: avoid;
    margin-bottom: 8px;
    padding: 8px 10px;
  }

  /* ── Diff viewer ─────────────────────────────────────────────── */
  [data-diff-before] {
    background-color: #fff0f0 !important;
    border-left: 2px solid #cc0000 !important;
  }

  [data-diff-after] {
    background-color: #f0fff0 !important;
    border-left: 2px solid #007700 !important;
  }

  /* ── Custody gap badge ───────────────────────────────────────── */
  [data-custody-gap] {
    border: 1px solid #b45309 !important;
    background-color: #fffbeb !important;
    color: #92400e !important;
  }

  /* ── Timeline connector ──────────────────────────────────────── */
  [data-timeline-connector] {
    border-left: 1px solid #cccccc !important;
    background: none !important;
  }

  /* ── Pagination and filter bar — hide on print ───────────────── */
  [data-pagination],
  [data-filter-bar],
  [data-export-panel],
  [data-note-form] {
    display: none !important;
  }

  /* ── Links: show URL ─────────────────────────────────────────── */
  a[href]::after {
    content: none;  /* Do NOT print URLs — audit entries contain no links */
  }

  /* ── Page footer with page numbers ──────────────────────────── */
  @bottom-center {
    content: counter(page) ' / ' counter(pages);
    font-size: 8pt;
    color: #555555;
  }
}
```

### 19.1.1 Import this stylesheet

In `src/app/layout.tsx`, add the import:

```typescript
import '@shared/styles/print.css'
```

This ensures print styles apply globally.

### 19.1.2 Letterhead injection

In `AuditExportPanel`, `handlePrint()` should inject the print header before calling `window.print()`:

```typescript
function handlePrint() {
  // Inject a print-only header into the DOM before printing
  const existing = document.getElementById('ccms-print-header')
  if (existing) existing.remove()

  const header = document.createElement('div')
  header.id = 'ccms-print-header'
  header.className = 'print-header'
  header.innerHTML = `
    <div class="print-classification">${t('audit.export.printClassification')}</div>
    <div class="print-title">${t('audit.export.printTitle')}</div>
    ${printTitle ? `<div class="print-subtitle">${printTitle}</div>` : ''}
    <div class="print-notice">${t('audit.export.printAuthorisedNotice')}</div>
    <div class="print-notice">${t('audit.export.printGeneratedAt', {
      datetime: format(new Date(), 'dd MMM yyyy HH:mm:ss'),
    })}</div>
  `
  document.body.prepend(header)
  window.print()

  // Remove the header after printing to keep the DOM clean
  setTimeout(() => {
    const el = document.getElementById('ccms-print-header')
    if (el) el.remove()
  }, 1000)
}
```

---

# 20. Route Pages

## 20.1 `src/app/(dashboard)/cases/[caseId]/timeline/page.tsx`

Replace the Phase 4 implementation entirely:

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs'
import { format, subDays } from 'date-fns'
import { AuditTimeline } from '@shared/components/timeline/AuditTimeline'
import { useCaseTimeline } from '@features/audit/hooks'
import { AuditEventType, DEFAULT_AUDIT_PAGE_SIZE } from '@features/audit/types/audit.types'
import { useTranslations } from 'next-intl'

export default function CaseTimelinePage() {
  const params = useParams<{ caseId: string }>()
  const caseId = params.caseId
  const t = useTranslations('audit')

  const [filters, setFilters] = useQueryStates({
    actorSearch:   parseAsString.withDefault(''),
    eventTypes:    parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom:      parseAsString.withDefault(''),
    dateTo:        parseAsString.withDefault(''),
    page:          parseAsInteger.withDefault(1),
    pageSize:      parseAsInteger.withDefault(DEFAULT_AUDIT_PAGE_SIZE),
  })

  const { data, isLoading, isError, refetch, isFetching } = useCaseTimeline(
    caseId,
    {
      ...filters,
      eventTypes: filters.eventTypes as AuditEventType[],
    },
  )

  return (
    <AuditTimeline
      entries={data?.data ?? []}
      total={data?.total ?? 0}
      isLoading={isLoading}
      isFetchingNext={isFetching && !isLoading}
      isError={isError}
      onRetry={refetch}
      page={filters.page}
      pageSize={filters.pageSize}
      onPageChange={(page) => setFilters({ page })}
      onPageSizeChange={(pageSize) => setFilters({ pageSize, page: 1 })}
      filters={{
        ...filters,
        eventTypes: filters.eventTypes as AuditEventType[],
      }}
      onFiltersChange={(partial) =>
        setFilters({ ...partial, page: 1 } as typeof filters)
      }
      surface="case"
      entityId={caseId}
      showNoteForm={true}
      caseId={caseId}
      showPollingIndicator={true}
      emptyTitle={t('caseTimeline.empty.title')}
      emptyDescription={t('caseTimeline.empty.description')}
    />
  )
}
```

## 20.2 `src/app/(dashboard)/admin/audit/page.tsx`

Replace the skeleton:

```typescript
import { getTranslations } from 'next-intl/server'
import { GlobalAuditLog } from '@features/audit/components/GlobalAuditLog'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('audit')
  return { title: t('pageTitle') }
}

export default function AuditLogPage() {
  return <GlobalAuditLog />
}
```

---

# 21. Feature Components

## 21.1 `GlobalAuditLog.tsx`

Client Component. Full-page component for `/admin/audit`.

### 21.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  actorSearch:      parseAsString.withDefault(''),
  eventTypes:       parseAsArrayOf(parseAsString).withDefault([]),
  dateFrom:         parseAsString.withDefault(
    format(subDays(new Date(), 6), 'yyyy-MM-dd')
  ),
  dateTo:           parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd')),
  linkedCaseId:     parseAsString.withDefault(''),
  linkedOfficerId:  parseAsString.withDefault(''),
  page:             parseAsInteger.withDefault(1),
  pageSize:         parseAsInteger.withDefault(DEFAULT_AUDIT_PAGE_SIZE),
})
```

### 21.1.2 PageHeader

```tsx
<PageHeader
  title={t('audit.globalLog.heading')}
  description={t('audit.globalLog.description')}
/>
```

No action buttons in the PageHeader — the export panel is inside `AuditTimeline`.

### 21.1.3 Entity scope filter

The entity scope filter renders as two optional input fields below the main filter bar, visible only for `admin+`:

```
Entity Scope (optional):
  [Scope ▼]   ←  Dropdown: "All Entities" / "Case" / "Officer"

  When "Case":
    [Search case number...] → sets linkedCaseId filter

  When "Officer":
    [Search officer badge...] → sets linkedOfficerId filter
```

### 21.1.4 Compose with AuditTimeline

```tsx
<AuditTimeline
  entries={data?.data ?? []}
  total={data?.total ?? 0}
  // ...standard props
  surface="global"
  entityId="all"
  showEntityScope={true}
  showNoteForm={false}
  showPollingIndicator={false}
/>
```

## 21.2 `OfficerAuditDrawer.tsx`

Client Component. Wraps `AuditTimeline` in a `SlideOverDrawer` (480px width — exception: audit drawers use 640px due to content density).

```typescript
interface OfficerAuditDrawerProps {
  officerId: string
  officerName: string
  open: boolean
  onClose: () => void
}
```

### 21.2.1 How to open this drawer

In `OfficerDetail.tsx` (Phase 7 component), add:

```typescript
// In the officer detail page state:
const [auditOpen, setAuditOpen] = useState(false)

// In the PageHeader actions (PermissionGuard: OFFICERS_MANAGE):
<Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
  <ClipboardList className="mr-2 h-3.5 w-3.5" />
  {t('audit.officerHistory.openButton')}
</Button>

// At the bottom of OfficerDetail render tree:
<OfficerAuditDrawer
  officerId={officer.id}
  officerName={`${officer.firstName} ${officer.lastName}`}
  open={auditOpen}
  onClose={() => setAuditOpen(false)}
/>
```

### 21.2.2 Internal filter state

```typescript
const [filters, setFilters] = useState<AuditFilters>({
  page: 1,
  pageSize: DEFAULT_AUDIT_PAGE_SIZE,
})
```

The officer audit drawer uses local React state for filters (NOT URL state) because it's a drawer, not a page. URL state would pollute the officer detail page URL. Local state resets when the drawer is closed.

### 21.2.3 Drawer footer

The `AuditExportPanel` renders inside the drawer content area (not the footer), above the `AuditTimeline`.

### 21.2.4 Closing

On close, reset `filters` to defaults. Dirty state guard: not needed — this is a read-only drawer.

## 21.3 `PersonAuditDrawer.tsx`

Identical architecture to `OfficerAuditDrawer`. Differences:

- Props: `personId`, `personName`
- Opens from `PersonDetail.tsx` (Phase 7 component) via a "View Audit History" button guarded by `PERSONNEL_MANAGE`
- Uses `usePersonAuditHistory(personId, filters, open)`
- Drawer title: `t('audit.personHistory.drawerTitle')`
- Surface: `"person"`

---

# 22. Updates to Phase 7 Components

## 22.1 Officer Detail page — add audit history button

Open `src/features/personnel/components/officers/OfficerDetail.tsx`. Add:

1. Import `OfficerAuditDrawer` from `@features/audit/components/OfficerAuditDrawer`
2. Add `const [auditOpen, setAuditOpen] = useState(false)` to state
3. Add the "View Audit History" button to the PageHeader actions:

```tsx
<PermissionGuard permission={Permission.OFFICERS_MANAGE}>
  <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
    <ClipboardList className="mr-2 h-3.5 w-3.5" />
    {t('audit.officerHistory.openButton')}
  </Button>
</PermissionGuard>
```

4. Mount `OfficerAuditDrawer` at the bottom of the render tree.
5. Remove the Phase 7 "Recent Activity" stub section from the officer detail page — `OfficerAuditDrawer` replaces it entirely.

## 22.2 Person Detail page — add audit history button

Open `src/features/personnel/components/persons/PersonDetail.tsx`. Apply the same pattern:

1. Import `PersonAuditDrawer`
2. Add audit drawer state
3. Add "View Audit History" to the promote dropdown (as a secondary action, separated by a divider from the promote options):

```tsx
<DropdownMenuSeparator />
<DropdownMenuItem onClick={() => setAuditOpen(true)}>
  <ClipboardList className="mr-2 h-4 w-4" />
  {t('audit.personHistory.openButton')}
</DropdownMenuItem>
```

Guard this menu item with `PermissionGuard permission={Permission.PERSONNEL_MANAGE}`.

4. Mount `PersonAuditDrawer` at the bottom of the render tree.
5. Remove the Phase 7 "Recent Activity" stub section from the person detail page.

---

# 23. Sidebar Navigation Update

## 23.1 Verify `/admin/audit` is in the Sidebar

The sidebar navigation's "System" section (from Phase 1) should already include:

```
System: Admin, Health, Audit
```

The "Audit" item links to `/admin/audit` and is visible to `admin` and `superadmin` roles. If this item is missing from the sidebar configuration (`src/shared/constants/navigation.ts` or equivalent), add it now:

```typescript
{
  label: 'navigation.audit',         // i18n key
  href: '/admin/audit',
  icon: ClipboardList,
  requiredRole: ['admin', 'superadmin'],
}
```

---

# 24. `src/features/audit/index.ts`

Public barrel export:

```typescript
// Types
export * from './types/audit.types'

// Hooks
export {
  useCaseTimeline,
  useGlobalAuditLog,
  useOfficerAuditHistory,
  usePersonAuditHistory,
  useAddCaseNote,
  useDownloadAuditCsv,
} from './hooks'

// Components
export { GlobalAuditLog } from './components/GlobalAuditLog'
export { OfficerAuditDrawer } from './components/OfficerAuditDrawer'
export { PersonAuditDrawer } from './components/PersonAuditDrawer'

// Utils
export {
  EVENT_TYPE_ICONS,
  getEventIconColour,
  SECURITY_SEVERITY_VARIANTS,
  isSecurityEvent,
  isDiffProducingEvent,
  isCustodyEvent,
  formatCustodyGapHours,
  buildAuditCsvFilename,
  getEventTypesByCategory,
} from './utils/auditUtils'
```

---

# 25. Testing Requirements

## 25.1 Unit Tests — `auditUtils.ts`

Create `src/features/audit/utils/auditUtils.test.ts`:

- `isSecurityEvent('LOGIN_FAILURE')` → `true`
- `isSecurityEvent('CASE_CREATED')` → `false`
- `isDiffProducingEvent('CASE_UPDATED')` → `true`
- `isDiffProducingEvent('CASE_CREATED')` → `false`
- `isCustodyEvent('CUSTODY_TRANSFERRED')` → `true`
- `isCustodyEvent('CASE_UPDATED')` → `false`
- `formatCustodyGapHours(6)` → `"6 hours"`
- `formatCustodyGapHours(24)` → `"1 day"`
- `formatCustodyGapHours(36)` → `"1 day, 12 hours"`
- `formatCustodyGapHours(48)` → `"2 days"`
- `getEventTypesByCategory('SECURITY')` → array containing `'LOGIN_FAILURE'`, `'ROLE_CHANGED'`, etc.
- `getEventTypesByCategory('ANNOTATION')` → array containing only `'CASE_NOTE_ADDED'`
- `EVENT_TYPE_CATEGORY['CASE_CREATED']` → `'CASE'`
- `EVENT_TYPE_CATEGORY['HEARING_SCHEDULED']` → `'LEGAL'`

## 25.2 Unit Tests — Zod Schemas

Create `src/features/audit/schemas/audit-schemas.test.ts`:

**`auditEntrySchema`:**
- Valid entry with all required fields → no error
- Missing `id` (not a UUID) → validation error
- `eventType: 'UNKNOWN_EVENT'` (not in enum) → validation error
- `diff: null` → valid (nullable)
- `noteText: null` → valid (nullable)
- `securitySeverity: 'LOW'` → valid
- `custodyGap.gapHours: -1` → no schema error (schema validates type, not semantics)

**`paginatedAuditEntriesSchema`:**
- Valid paginated response → no error
- Missing `totalPages` → validation error

## 25.3 Component Tests — `DiffViewer`

Create `src/shared/components/timeline/DiffViewer.test.tsx`:

- Renders one row per `diff.fields` entry
- `before: null` → Before panel shows "—" in muted text
- `after: null` → After panel shows "—" in muted text
- When `diff.fields.length === 3`: all fields render without expand button
- When `diff.fields.length === 8`: first 5 fields render, "Show 3 more changes" button present
- Clicking "Show 3 more changes" expands all 8 fields
- All values render in monospace font

## 25.4 Component Tests — `TimelineEntry`

Create `src/shared/components/timeline/TimelineEntry.test.tsx`:

- Event icon renders for each event category
- Actor name renders as a link when `OFFICERS_MANAGE` permission is present
- Actor name renders as plain text when permission is absent
- Padlock icon is always rendered (immutability indicator)
- Timestamp renders in `dd MMM yyyy, HH:mm:ss` format
- Security badge renders for `SECURITY` category events
- Security badge absent for non-security events
- `diff !== null` → `DiffViewer` renders within the entry
- `diff === null` → `DiffViewer` is not rendered
- `noteText !== null` → Note block renders in muted italic
- `HIGH` severity security event has `border-l-destructive` class

## 25.5 Component Tests — `AuditFilterBar`

Create `src/shared/components/timeline/AuditFilterBar.test.tsx`:

- Actor search input calls `onActorSearchChange` on change
- Event type category selection toggles all types in that category
- Selecting some (not all) types in a category → category checkbox is indeterminate
- Active filter chips render for each active filter dimension
- "Clear all filters" link calls `onClearAll`
- Date pickers call `onDateFromChange` and `onDateToChange`

## 25.6 Component Tests — `AddCaseNoteForm`

Create `src/shared/components/timeline/AddCaseNoteForm.test.tsx`:

- Submit button is disabled when the text field is empty
- Submit button is disabled when text exceeds 2000 characters
- Character count label renders and updates as user types
- Submitting a valid note calls `useAddCaseNote().mutateAsync`
- On success, the form resets to empty
- On error, the form does not reset and shows error toast

## 25.7 Component Tests — `CustodyGapBadge`

Create `src/shared/components/timeline/CustodyGapBadge.test.tsx`:

- Renders the badge with formatted gap duration
- `gapHours: 6` → "6 hours" appears in the badge
- `gapHours: 48` → "2 days" appears in the badge
- From and to timestamps render in the badge

## 25.8 i18n Completeness

Extend the existing i18n completeness test to cover the `audit` namespace. All keys in `en/audit.json` must have corresponding keys in `am/audit.json`. Test runner: `pnpm test`.

---

# 26. Anti-Pattern Reference

The following patterns are strictly forbidden.

**Immutability violations:**
- Adding any edit, delete, or reorder action to any audit entry — the audit trail is immutable. No exceptions.
- Rendering an "Edit Note" button on `CASE_NOTE_ADDED` entries — case notes are append-only. The note text within the entry is read-only.
- Allowing `useAddCaseNote` to be called without the submit button displaying a loading spinner — the user must see feedback that the request is in progress.

**Polling violations:**
- Setting `refetchIntervalInBackground: true` on `useCaseTimeline` — the 30-second poll must pause when the browser tab is inactive to avoid unnecessary server load.
- Using `isFetching` to show the skeleton loading state on the case timeline — `isFetching` is true on every 30-second poll, which would cause the skeleton to flash on every refetch. Use `isLoading` only (true only on the first fetch when no data exists yet).
- Setting `staleTime > 0` on `useCaseTimeline` — the case timeline must always be considered stale. Any nonzero stale time would suppress background refetches.

**Filter state violations:**
- Using local React state for the case timeline tab's filter state — the case timeline is a full page (not a drawer), so all filter state must live in URL query params via `nuqs`. Filter state must survive page refresh.
- Using URL query params for the officer and person audit drawers' filter state — drawers are ephemeral UI. URL state would pollute the officer/person detail page URL with audit filter params. Use local React state for drawer filter state.
- Sharing filter state between the case timeline filter bar and the add-note form — these are independent concerns.

**DiffViewer violations:**
- Using a third-party diff library — the diff viewer renders plain before/after text values. No syntax highlighting, no `react-diff-viewer`, no line-by-line AST diff.
- Rendering `dangerouslySetInnerHTML` for diff values — all diff values from the server are plain text and must be rendered as text nodes, never as HTML.
- Showing the DiffViewer for `CASE_NOTE_ADDED` events — note events have `diff: null` by design. The DiffViewer must not render when `diff === null`.

**Custody gap violations:**
- Rendering `CustodyGapBadge` for non-custody events — only entries where `entry.custodyGap !== null` trigger the gap badge. The parent `AuditTimeline` checks `entries[i].custodyGap !== null` to decide whether to render the badge above entry `i`.
- Using a normal solid connector between the gap badge and the entries around it — gap connectors use amber dashed styling. The solid connector only appears between entries with no gap.
- Computing custody gaps on the frontend — gap detection is a backend responsibility. The frontend only renders what the backend provides in `entry.custodyGap`.

**Print violations:**
- Using `@media print` styles within Tailwind classes — all print overrides must live in `src/shared/styles/print.css`. Tailwind's print: prefix (`print:hidden`) is acceptable for simple hide/show, but complex print layout overrides belong in the dedicated stylesheet.
- Omitting `data-timeline-entry`, `data-diff-before`, `data-diff-after`, `data-custody-gap`, `data-pagination`, `data-filter-bar`, `data-export-panel`, `data-note-form` attributes from their respective components — these data attributes are how the print stylesheet targets elements. They must be applied as `data-timeline-entry=""` (empty string value) on the outermost element of each component.
- Calling `window.print()` from a `useEffect` hook — call it directly from the button's `onClick` handler after DOM manipulation completes.

**Global audit log violations:**
- Allowing the global audit log to fire a query without a date range — the `enabled` condition on `useGlobalAuditLog` must require `Boolean(filters.dateFrom)`. The default filter should set `dateFrom` to the last 7 days.
- Rendering the entity scope filters (linked case/officer) for non-admin roles — the global audit log itself is admin-only, but if the component is ever rendered below the permission level, the entity scope section must be absent.

**Officer/Person audit drawer violations:**
- Using URL state for drawer filter state — as explained above, this pollutes the parent page URL.
- Not resetting the drawer filter state when the drawer closes — stale filter state from a previous drawer open should not persist to the next open. Reset `filters` to defaults in the `onClose` handler.
- Leaving the Phase 7 "Recent Activity" stub sections in `OfficerDetail.tsx` and `PersonDetail.tsx` after Phase 10 — these stubs are replaced by the audit drawers. Remove them.

**Module boundary violations:**
- Importing `AuditTimeline` from `@features/audit/components/` — `AuditTimeline` is a **shared** component (`@shared/components/timeline/AuditTimeline`). It must not be in the `features/audit` directory. Feature-specific wrappers (`GlobalAuditLog`, `OfficerAuditDrawer`, `PersonAuditDrawer`) live in `features/audit/components/` and consume the shared component.
- Adding chart or data visualisation components to the audit module — no charts in the audit system. All data is presented as timeline entries and tables.

**i18n violations:**
- Hardcoding event type labels (`"Case Created"`) instead of `t('audit.eventType.CASE_CREATED')`
- Hardcoding security severity labels instead of `t('audit.entry.securityBadge.LOW')`
- Hardcoding event category labels in the filter multi-select instead of `t('audit.filter.categories.CASE')`

---

# 27. Final Verification Checklist

## 27.1 Case Timeline Tab

- [ ] `/cases/[caseId]/timeline` renders the full audit timeline (not the Phase 4 basic list)
- [ ] Polling indicator dot is visible and animates
- [ ] Timeline polls every 30s while the tab is active
- [ ] Timeline does NOT show skeleton overlay during 30s background refetch — existing entries stay visible
- [ ] Timeline stops polling when the browser tab is in the background
- [ ] Filter bar renders: actor search input, event type multi-select, date from/to pickers
- [ ] Actor search filters entries in real-time (each keystroke triggers a query key change)
- [ ] Event type category checkboxes toggle all types in that category
- [ ] Category checkbox is indeterminate when some (not all) types are selected
- [ ] Date range filter updates query and re-fetches entries
- [ ] Active filter chips render and can be dismissed individually
- [ ] "Clear all filters" removes all active filters
- [ ] Filter state survives page refresh (URL params)
- [ ] Timeline entries render: event icon, event type label, actor line, timestamp, padlock
- [ ] Hovering the timestamp shows the relative time tooltip
- [ ] Actor name is a link to officer detail for admin+; plain text for lower roles
- [ ] `DiffViewer` renders for `CASE_UPDATED` and other diff-producing events
- [ ] `DiffViewer` shows null values as "—" with muted styling
- [ ] `DiffViewer` collapses to 5 fields with "Show N more" when >5 fields
- [ ] Security badge renders for security events with correct severity colour
- [ ] `HIGH` severity security entries have a red left border accent
- [ ] `CustodyGapBadge` renders above custody entries that have `custodyGap !== null`
- [ ] Gap connector uses amber dashed styling; normal connector uses solid styling
- [ ] Badge shows formatted gap duration and from/to timestamps
- [ ] `AddCaseNoteForm` renders at the bottom (for users with `CASES_MANAGE` permission)
- [ ] Note form submit button is disabled when empty and when >2000 characters
- [ ] Character count updates as user types
- [ ] Submitting a note closes the form, invalidates the timeline, new note appears at top
- [ ] Note form is absent for users without `CASES_MANAGE` permission
- [ ] CSV export downloads `ccms-audit-case-{date}.csv`
- [ ] Print button triggers the print dialog with CCMS letterhead visible
- [ ] Print view hides: nav, sidebar, filter bar, pagination, export panel, note form
- [ ] Print view shows all timeline entries in black-and-white card format
- [ ] Pagination controls render and function correctly
- [ ] Empty state renders when no entries match filters
- [ ] Error state renders with retry button on fetch failure

## 27.2 Global Audit Log

- [ ] `/admin/audit` renders the global audit log (not the skeleton)
- [ ] Page is accessible only to `admin` and `superadmin`
- [ ] Filter bar renders: actor search, event type multi-select, date range
- [ ] Entity scope filter renders: "All Entities" / "Case" / "Officer" dropdown
- [ ] Selecting "Case" reveals a case number input that sets `linkedCaseId`
- [ ] Selecting "Officer" reveals a badge number input that sets `linkedOfficerId`
- [ ] Default date range is Last 7 Days (dateFrom = today−6)
- [ ] Filter state survives page refresh
- [ ] All timeline entry anatomy renders correctly (same as case timeline)
- [ ] CSV export downloads `ccms-audit-global-{date}.csv`
- [ ] Print button triggers print with global audit log letterhead

## 27.3 Officer Audit Drawer

- [ ] "View Audit History" button is visible on `/personnel/officers/[officerId]` for admin+
- [ ] Button is absent for roles without `OFFICERS_MANAGE`
- [ ] Clicking opens `OfficerAuditDrawer` (640px width)
- [ ] Drawer shows the officer's full name in the title
- [ ] Timeline renders officer's audit entries (filter bar, entries, pagination)
- [ ] Filter state is local React state — NOT in the URL
- [ ] Closing the drawer resets filter state to defaults
- [ ] Phase 7 "Recent Activity" stub section is removed from the officer detail page
- [ ] CSV export downloads `ccms-audit-officer-{date}.csv`

## 27.4 Person Audit Drawer

- [ ] "View Audit History" option appears in the "Promote to" dropdown on person detail for admin+
- [ ] Option is absent for roles without `PERSONNEL_MANAGE`
- [ ] Clicking opens `PersonAuditDrawer` (640px width)
- [ ] Drawer shows the person's full name in the title
- [ ] Timeline renders person's audit entries (filter bar, entries, pagination)
- [ ] Filter state is local React state — NOT in the URL
- [ ] Closing the drawer resets filter state to defaults
- [ ] Phase 7 "Recent Activity" stub section is removed from the person detail page
- [ ] CSV export downloads `ccms-audit-person-{date}.csv`

## 27.5 Print View

- [ ] Navigating to any audit surface and clicking "Print Timeline" opens the print dialog
- [ ] CCMS letterhead is visible: classification, title, authorised notice, generation timestamp
- [ ] Sidebar, topbar, breadcrumb, filter bar, pagination, export panel, note form are hidden
- [ ] Timeline entries render in black-and-white card format with 1px solid border
- [ ] Diff viewer panels render with red (before) and green (after) tints
- [ ] Custody gap badge renders with amber border
- [ ] Print CSS is imported via `src/app/layout.tsx` and applies globally

## 27.6 Shared Components — `DiffViewer`

- [ ] Each `diff.fields` entry renders as one row
- [ ] `before: null` → Before panel shows "—" in muted text
- [ ] `after: null` → After panel shows "—" in muted text
- [ ] All values render in monospace font (`JetBrains Mono`)
- [ ] Expand/collapse works correctly for >5 fields

## 27.7 Shared Components — `CustodyGapBadge`

- [ ] Badge background and border use amber (`warning`) token colours
- [ ] Gap duration formats correctly for hours and days
- [ ] From/to timestamps render

## 27.8 i18n

- [ ] All audit UI text is retrieved from message files — no hardcoded English
- [ ] Switching to Amharic updates all audit text across all four surfaces
- [ ] i18n completeness test passes with zero missing keys in `audit` namespace (EN + AM)
- [ ] Event type labels render in selected locale
- [ ] Security severity labels render in selected locale
- [ ] Event category filter labels render in selected locale

## 27.9 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` — all audit module tests pass (unit tests for auditUtils, schemas, component tests)
- [ ] `pnpm build` — production build succeeds without errors
- [ ] `axiosInstance` is exported from `@services/api/client` (required for CSV blob download)
- [ ] `print.css` is imported in `src/app/layout.tsx`

---

*End of CCMS Phase 10 Instruction — Audit System Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 11 will implement the Hardening phase — accessibility audit (WCAG 2.1 AA sweep across all primary pages), full E2E test coverage (Playwright — login, case status transition, officer assignment, evidence upload), performance profiling (bundle size analysis, image optimisation, code splitting verification), offline resilience (React Query persistence via `@tanstack/query-sync-storage-persister`), bulk operations (bulk case status update, bulk charge operations, bulk evidence export), sentence editing workflow (updating conviction details post-sentence), appeal charge workflow (reversing CONVICTED status via admin action), person de-promotion UI (admin-only removal of SUSPECT/VICTIM/WITNESS roles), advanced diff features (syntax-highlighted diffs for JSON payloads), PDF/print export of court documents, and Storybook documentation for all shared components*
