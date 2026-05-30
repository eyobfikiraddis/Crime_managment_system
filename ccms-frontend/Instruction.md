# CCMS Frontend — Phase 6: Legal Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 5 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all 12 key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab (30s polling, add-note, diff viewer, print), status transition drawer
- **Evidence Module**: Evidence tab (DataTable + gallery toggle), evidence upload drawer (Cloudinary three-step flow), evidence detail drawer with chain of custody timeline, lightbox viewer, record custody event drawer
- **Arrests Module**: Arrests tab (DataTable + filter bar), create arrest drawer, arrest detail drawer, update detention/bail status drawer
- **Interrogations Module**: Interrogations tab (DataTable + filter bar), create interrogation drawer, read-only interrogation detail drawer
- **Route coverage**: All nine case tab skeletons render; `/legal/court-cases` skeleton is in place; `/403`, admin, settings, and dashboard skeleton routes all render
- **i18n completeness**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases`, `evidence`, `arrests`, and `interrogations` namespaces

## 1.2 Phase 6 Objective

Phase 6 delivers the **Legal Module** — the system's judicial proceedings interface. It sits at the intersection of law enforcement and the court system, accessible exclusively to `legal_officer`, `admin`, and `superadmin` roles. A non-legal officer who opens the Legal tab in a case sees the tab rendered but locked (established in Phase 3); Phase 6 replaces the skeleton content that appears behind that lock for authorised roles.

The legal module introduces a **two-level entity hierarchy**: one CourtCase per investigation case, and multiple Charges under that CourtCase. This is architecturally distinct from the flat lists in arrests and interrogations. It also introduces **terminal status states** — a charge that reaches `CONVICTED` or `ACQUITTED` cannot revert. Sentencing data is only recorded after conviction and is immutable once saved.

**Phase 6 delivers five sub-systems:**

1. **Legal Tab (Case Detail)** — Replaces the Phase 3 skeleton at `/cases/[caseId]/legal`. Full judicial proceedings workspace for legal officers.
2. **Court Case Panel** — Displays the court case linked to the investigation case. Includes `CreateCourtCaseDrawer` for the empty state and `UpdateCourtCaseDrawer` for editing.
3. **Charges Table & Management** — DataTable of all charges within the court case. Row-level actions to update status, drop, and view sentencing.
4. **Charge Drawers** — `AddChargeDrawer`, `UpdateChargeStatusDrawer`, `DropChargeDialog`, `RecordSentenceDrawer`, and `ViewSentenceDrawer`.
5. **Court Cases List Page** — Replaces the Phase 3 skeleton at `/legal/court-cases`. Global list of court cases for the authenticated legal officer.

**Also in scope:**

- `legal` feature module: full type definitions, Zod schemas, service implementation, React Query hooks
- Full population of `messages/en/legal.json` and `messages/am/legal.json`
- `legalKeys` query key factory at `src/services/query/keys/legalKeys.ts`
- Case overview tab charge count card query invalidation after charge mutations (the count card at `/cases/[caseId]` already renders using `caseKeys.summary(caseId)`; the Legal module must invalidate it after every charge mutation)
- Sidebar navigation `Legal` section already renders; verify `/legal/court-cases` route is wired and accessible to `legal_officer+`

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Legal service (`src/services/domain/legal.service.ts`):**
- Replace all stubs with real Axios calls
- All 7 endpoints covering court cases and charges (see §8)
- Response validation via Zod `.parse()` on every response
- Typed return values throughout — no `any`

**Legal types and schemas:**
- All TypeScript types: `CourtCase`, `CourtCaseSummary`, `CourtCaseStatus`, `CourtCaseOutcome`, `HearingDate`, `HearingType`, `Charge`, `ChargeListItem`, `ChargeStatus`, `SentenceType`, `Sentence`, `CourtCaseFilters`, `ChargeFilters`, `CreateCourtCasePayload`, `UpdateCourtCasePayload`, `CreateChargePayload`, `UpdateChargePayload`, `RecordSentencePayload`
- All Zod schemas: create/update form schemas, API response schemas, filter schemas

**Legal query hooks:**
- `useCourtCaseByCase(caseId)` — fetches the single court case linked to an investigation case
- `useCourtCaseList(filters)` — paginated list for the standalone `/legal/court-cases` page
- `useCreateCourtCase(caseId)` — create mutation
- `useUpdateCourtCase(courtCaseId, caseId)` — update mutation
- `useChargeList(courtCaseId, caseId, filters)` — paginated charges for a given court case
- `useCreateCharge(courtCaseId, caseId)` — file a new charge mutation
- `useUpdateCharge(chargeId, courtCaseId, caseId)` — update charge status mutation
- `useDropCharge(chargeId, courtCaseId, caseId)` — destructive mutation: set status to `DROPPED`
- `useRecordSentence(chargeId, courtCaseId, caseId)` — record sentencing for a convicted charge

**i18n messages:**
- Fully populate `messages/en/legal.json`
- Fully populate `messages/am/legal.json`

**Legal Tab (`/cases/[caseId]/legal/page.tsx`):**
- Replace Phase 3 skeleton
- Empty state when no court case is linked: EmptyState component with "Create Court Case" CTA (legal_officer+)
- When court case exists: `CourtCaseCard` + `ChargesTable` + filter bar + "Add Charge" button

**Court Cases List Page (`/legal/court-cases/page.tsx`):**
- Replace Phase 3 skeleton
- Full DataTable with filter bar, loading, empty, and error states

**All drawers and dialogs** as listed in §1.2

## 1.5 What Must NOT Be Implemented

- **Charge reversal** — a charge that reaches `CONVICTED` or `ACQUITTED` cannot change status. The `UpdateChargeStatusDrawer` must not present these as options when the charge is in a terminal state.
- **Sentence editing or deletion** — once a sentence is recorded via `RecordSentenceDrawer`, it is immutable. No edit button, no delete button.
- **Court case deletion** — legal records are permanent. No delete action on court cases.
- **Bulk charge operations** — deferred to Phase 11.
- **Hearing date calendar integration** — hearing dates are recorded as data fields only; no calendar booking or external scheduling.
- **Court case duplication** — each investigation case has exactly one linked court case. The "Create Court Case" CTA must be hidden once a court case exists.
- **PDF/print export of court documents** — deferred to Phase 11.
- **Appeal workflow** — reversing or appealing CONVICTED/ACQUITTED charges is not in scope.
- **MSW mocking** — still deferred.
- **Legal Officer Dashboard widgets** — deferred to Phase 9 (Dashboards & Reports).

## 1.6 Handoff Standard

When Phase 6 finishes:
- Navigating to `/cases/[caseId]/legal` as a `legal_officer` shows the real legal tab (not the Phase 3 skeleton)
- If no court case is linked: `EmptyState` with "Create Court Case" button is visible; clicking opens `CreateCourtCaseDrawer`
- If a court case exists: `CourtCaseCard` shows the court metadata, `HearingDatesList` shows upcoming hearings, `ChargesTable` below shows all charges
- "Add Charge" button (legal_officer+) opens `AddChargeDrawer`; submitting files the charge, closes the drawer, and refreshes the charges list
- Charge row kebab menu renders: "Update Status" → `UpdateChargeStatusDrawer`, "Drop Charge" → `DropChargeDialog`, "View Sentence" (only when `CONVICTED`) → `ViewSentenceDrawer`
- "Drop Charge" triggers `DestructiveConfirmDialog` with the confirm phrase pattern
- In `UpdateChargeStatusDrawer`, selecting `CONVICTED` expands a sentencing inline form; submitting records the sentence
- Navigating to `/legal/court-cases` shows the full DataTable of court cases (not the skeleton)
- Case overview tab charge count card increments after every successful `useCreateCharge` mutation
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds
- i18n completeness test passes for the `legal` namespace in both EN and AM

---

# 2. Dependencies

No new packages are required. All dependencies are already installed from prior phases:

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

Create the following new directories and files. All stubs from Phase 3 are replaced.

```
src/
├── features/
│   └── legal/
│       ├── components/
│       │   ├── CourtCaseCard.tsx            # Displays linked court case metadata
│       │   ├── HearingDatesList.tsx          # Chronological list of hearing dates
│       │   ├── CreateCourtCaseDrawer.tsx     # SlideOverDrawer — create court case form
│       │   ├── UpdateCourtCaseDrawer.tsx     # SlideOverDrawer — edit court case
│       │   ├── ChargesTable.tsx              # DataTable of charges within court case
│       │   ├── AddChargeDrawer.tsx           # SlideOverDrawer — file a new charge
│       │   ├── UpdateChargeStatusDrawer.tsx  # SlideOverDrawer — update status + sentencing
│       │   ├── DropChargeDialog.tsx          # DestructiveConfirmDialog wrapper
│       │   ├── RecordSentenceDrawer.tsx      # SlideOverDrawer — sentence details (CONVICTED)
│       │   ├── ViewSentenceDrawer.tsx        # SlideOverDrawer — read-only sentence view
│       │   └── CourtCasesList.tsx            # Main component for /legal/court-cases page
│       ├── hooks/
│       │   ├── useCourtCaseByCase.ts
│       │   ├── useCourtCaseList.ts
│       │   ├── useCreateCourtCase.ts
│       │   ├── useUpdateCourtCase.ts
│       │   ├── useChargeList.ts
│       │   ├── useCreateCharge.ts
│       │   ├── useUpdateCharge.ts
│       │   ├── useDropCharge.ts
│       │   ├── useRecordSentence.ts
│       │   └── index.ts
│       ├── schemas/
│       │   ├── court-case.schema.ts
│       │   ├── charge.schema.ts
│       │   ├── sentence.schema.ts
│       │   ├── legal-api.schema.ts
│       │   └── legal-filters.schema.ts
│       ├── types/
│       │   ├── legal.types.ts
│       │   └── index.ts
│       ├── utils/
│       │   └── chargeUtils.ts
│       └── index.ts

├── services/
│   └── query/
│       └── keys/
│           └── legalKeys.ts                  # New — query key factory

└── app/
    └── (dashboard)/
        ├── cases/
        │   └── [caseId]/
        │       └── legal/
        │           └── page.tsx              # Replaces Phase 3 skeleton
        └── legal/
            └── court-cases/
                └── page.tsx                  # Replaces Phase 3 skeleton

messages/
├── en/
│   └── legal.json                           # Full EN population
└── am/
    └── legal.json                           # Full AM population
```

---

# 4. TypeScript Types

## 4.1 `src/features/legal/types/legal.types.ts`

```typescript
// ─── Court Case Status enum ──────────────────────────────────────────────────
export const CourtCaseStatus = {
  PENDING:    'PENDING',
  ACTIVE:     'ACTIVE',
  CONCLUDED:  'CONCLUDED',
  DISMISSED:  'DISMISSED',
} as const
export type CourtCaseStatus = (typeof CourtCaseStatus)[keyof typeof CourtCaseStatus]

// ─── Court Case Outcome enum ──────────────────────────────────────────────────
export const CourtCaseOutcome = {
  GUILTY:        'GUILTY',
  NOT_GUILTY:    'NOT_GUILTY',
  DISMISSED:     'DISMISSED',
  MISTRIAL:      'MISTRIAL',
  PLEA_DEAL:     'PLEA_DEAL',
} as const
export type CourtCaseOutcome = (typeof CourtCaseOutcome)[keyof typeof CourtCaseOutcome]

// ─── Hearing Type enum ───────────────────────────────────────────────────────
export const HearingType = {
  PRELIMINARY:  'PRELIMINARY',
  TRIAL:        'TRIAL',
  SENTENCING:   'SENTENCING',
  APPEAL:       'APPEAL',
  ARRAIGNMENT:  'ARRAIGNMENT',
} as const
export type HearingType = (typeof HearingType)[keyof typeof HearingType]

// ─── Charge Status enum ───────────────────────────────────────────────────────
export const ChargeStatus = {
  FILED:      'FILED',
  ACTIVE:     'ACTIVE',
  CONVICTED:  'CONVICTED',
  ACQUITTED:  'ACQUITTED',
  DROPPED:    'DROPPED',
} as const
export type ChargeStatus = (typeof ChargeStatus)[keyof typeof ChargeStatus]

// Terminal charge statuses — cannot be changed once reached
export const TERMINAL_CHARGE_STATUSES: ChargeStatus[] = [
  ChargeStatus.CONVICTED,
  ChargeStatus.ACQUITTED,
  ChargeStatus.DROPPED,
]

// ─── Sentence Type enum ───────────────────────────────────────────────────────
export const SentenceType = {
  IMPRISONMENT:        'IMPRISONMENT',
  FINE:                'FINE',
  COMMUNITY_SERVICE:   'COMMUNITY_SERVICE',
  SUSPENDED:           'SUSPENDED',
  DEATH_PENALTY:       'DEATH_PENALTY',
  LIFE_IMPRISONMENT:   'LIFE_IMPRISONMENT',
} as const
export type SentenceType = (typeof SentenceType)[keyof typeof SentenceType]

// Sentence types that require a duration field
export const SENTENCE_TYPES_WITH_DURATION: SentenceType[] = [
  SentenceType.IMPRISONMENT,
  SentenceType.COMMUNITY_SERVICE,
  SentenceType.SUSPENDED,
]

// Sentence types that require a fine amount field
export const SENTENCE_TYPES_WITH_FINE: SentenceType[] = [
  SentenceType.FINE,
]

// ─── Shared reference shapes ──────────────────────────────────────────────────
export interface PersonRef {
  id: string
  firstName: string
  lastName: string
}

export interface OfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

export interface CrimeTypeRef {
  id: string
  name: string
}

// ─── Hearing Date ─────────────────────────────────────────────────────────────
export interface HearingDate {
  id: string
  date: string             // ISO 8601
  type: HearingType
  location: string
  notes: string | null
  outcome: string | null   // Free-text outcome note for concluded hearings
}

// ─── Sentence ─────────────────────────────────────────────────────────────────
export interface Sentence {
  id: string
  sentenceType: SentenceType
  durationMonths: number | null   // In months; null for non-duration sentence types
  fineAmountETB: number | null    // In ETB; null for non-fine types
  notes: string | null
  issuedAt: string                // ISO 8601
  issuedByJudge: string | null
}

// ─── Charge List Item (for DataTable) ────────────────────────────────────────
export interface ChargeListItem {
  id: string
  courtCaseId: string
  caseId: string
  suspect: PersonRef
  crimeType: CrimeTypeRef
  status: ChargeStatus
  filedAt: string          // ISO 8601
  updatedAt: string
  hasSentence: boolean     // True when status is CONVICTED and a sentence is recorded
}

// ─── Charge Detail (for detail drawer and sentence panel) ────────────────────
export interface Charge extends ChargeListItem {
  sentence: Sentence | null
  notes: string | null
}

// ─── Court Case Summary (for list page) ──────────────────────────────────────
export interface CourtCaseSummary {
  id: string
  courtCaseNumber: string     // Court-assigned reference (e.g. "CC-2026-0047")
  investigationCaseId: string
  investigationCaseTitle: string
  court: string
  status: CourtCaseStatus
  outcome: CourtCaseOutcome | null
  filedAt: string
  nextHearingDate: string | null   // ISO 8601
  chargeCount: number
  updatedAt: string
}

// ─── Court Case Detail (for case detail legal tab) ────────────────────────────
export interface CourtCase extends CourtCaseSummary {
  hearingDates: HearingDate[]
  presidingJudge: string | null
  prosecutor: string | null
  defenceCounsel: string | null
  notes: string | null
  charges: ChargeListItem[]
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface CourtCaseFilters {
  search?: string          // Court case number or investigation case title
  status?: CourtCaseStatus[]
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortField?: 'filedAt' | 'courtCaseNumber' | 'status'
  sortDirection?: 'asc' | 'desc'
}

export interface ChargeFilters {
  search?: string          // Suspect name or crime type
  status?: ChargeStatus[]
  page?: number
  pageSize?: number
  sortField?: 'filedAt' | 'status'
  sortDirection?: 'asc' | 'desc'
}

// ─── Payloads ──────────────────────────────────────────────────────────────────
export interface CreateCourtCasePayload {
  court: string
  filedAt: string
  presidingJudge?: string
  prosecutor?: string
  defenceCounsel?: string
  hearingDates?: Omit<HearingDate, 'id' | 'outcome'>[]
  notes?: string
}

export interface UpdateCourtCasePayload {
  court?: string
  status?: CourtCaseStatus
  outcome?: CourtCaseOutcome | null
  presidingJudge?: string | null
  prosecutor?: string | null
  defenceCounsel?: string | null
  hearingDates?: Omit<HearingDate, 'id' | 'outcome'>[]
  notes?: string | null
}

export interface CreateChargePayload {
  suspectId: string
  crimeTypeId: string
  notes?: string
}

export interface UpdateChargePayload {
  status: Exclude<ChargeStatus, 'CONVICTED'>  // CONVICTED goes via RecordSentencePayload
}

export interface RecordSentencePayload {
  sentenceType: SentenceType
  durationMonths?: number | null
  fineAmountETB?: number | null
  notes?: string | null
  issuedAt: string
  issuedByJudge?: string | null
}
```

## 4.2 `src/features/legal/types/index.ts`

```typescript
export * from './legal.types'
```

---

# 5. Zod Schemas

## 5.1 `src/features/legal/schemas/court-case.schema.ts`

```typescript
import { z } from 'zod'
import { CourtCaseStatus, CourtCaseOutcome, HearingType } from '../types/legal.types'

// ─── Hearing date sub-schema ──────────────────────────────────────────────────
export const hearingDateInputSchema = z.object({
  date: z.string().min(1, { message: 'Hearing date is required.' }),
  type: z.nativeEnum(HearingType),
  location: z.string().min(2, { message: 'Location is required.' }).max(300),
  notes: z.string().max(1000).optional(),
})

// ─── Create court case ────────────────────────────────────────────────────────
export const createCourtCaseSchema = z.object({
  court: z
    .string()
    .min(2, { message: 'Court name is required.' })
    .max(300),
  filedAt: z.string().min(1, { message: 'Filing date is required.' }),
  presidingJudge: z.string().max(200).optional(),
  prosecutor: z.string().max(200).optional(),
  defenceCounsel: z.string().max(200).optional(),
  hearingDates: z.array(hearingDateInputSchema).max(20).optional().default([]),
  notes: z.string().max(3000).optional(),
})

export type CreateCourtCaseValues = z.infer<typeof createCourtCaseSchema>

// ─── Update court case ────────────────────────────────────────────────────────
export const updateCourtCaseSchema = z.object({
  court: z.string().min(2).max(300).optional(),
  status: z.nativeEnum(CourtCaseStatus).optional(),
  outcome: z.nativeEnum(CourtCaseOutcome).nullable().optional(),
  presidingJudge: z.string().max(200).nullable().optional(),
  prosecutor: z.string().max(200).nullable().optional(),
  defenceCounsel: z.string().max(200).nullable().optional(),
  hearingDates: z.array(hearingDateInputSchema).max(20).optional(),
  notes: z.string().max(3000).nullable().optional(),
}).refine(
  (data) => {
    // If status is CONCLUDED, outcome is required
    if (data.status === CourtCaseStatus.CONCLUDED && !data.outcome) {
      return false
    }
    return true
  },
  {
    message: 'An outcome is required when the court case status is Concluded.',
    path: ['outcome'],
  },
)

export type UpdateCourtCaseValues = z.infer<typeof updateCourtCaseSchema>
```

## 5.2 `src/features/legal/schemas/charge.schema.ts`

```typescript
import { z } from 'zod'
import { ChargeStatus } from '../types/legal.types'

// ─── Add charge ───────────────────────────────────────────────────────────────
export const createChargeSchema = z.object({
  suspectId: z.string().min(1, { message: 'Suspect is required.' }),
  crimeTypeId: z.string().min(1, { message: 'Crime type is required.' }),
  notes: z.string().max(2000).optional(),
})

export type CreateChargeValues = z.infer<typeof createChargeSchema>

// ─── Update charge status (excludes CONVICTED — that goes via sentence form) ──
export const updateChargeStatusSchema = z.object({
  status: z.enum([
    ChargeStatus.ACTIVE,
    ChargeStatus.ACQUITTED,
  ] as const, {
    errorMap: () => ({ message: 'Please select a valid status.' }),
  }),
})

export type UpdateChargeStatusValues = z.infer<typeof updateChargeStatusSchema>
```

## 5.3 `src/features/legal/schemas/sentence.schema.ts`

```typescript
import { z } from 'zod'
import {
  SentenceType,
  SENTENCE_TYPES_WITH_DURATION,
  SENTENCE_TYPES_WITH_FINE,
} from '../types/legal.types'

export const recordSentenceSchema = z.object({
  sentenceType: z.nativeEnum(SentenceType, {
    errorMap: () => ({ message: 'Sentence type is required.' }),
  }),
  durationMonths: z.number().int().positive().max(999).nullable().optional(),
  fineAmountETB: z.number().positive().max(999_999_999).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
  issuedAt: z.string().min(1, { message: 'Sentence date is required.' }),
  issuedByJudge: z.string().max(200).nullable().optional(),
}).superRefine((data, ctx) => {
  // Duration is required for imprisonment, community service, suspended
  if (
    SENTENCE_TYPES_WITH_DURATION.includes(data.sentenceType) &&
    (data.durationMonths === null || data.durationMonths === undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duration is required for this sentence type.',
      path: ['durationMonths'],
    })
  }
  // Fine amount is required for fine-type sentences
  if (
    SENTENCE_TYPES_WITH_FINE.includes(data.sentenceType) &&
    (data.fineAmountETB === null || data.fineAmountETB === undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fine amount is required for a fine sentence.',
      path: ['fineAmountETB'],
    })
  }
})

export type RecordSentenceValues = z.infer<typeof recordSentenceSchema>
```

## 5.4 `src/features/legal/schemas/legal-api.schema.ts`

```typescript
import { z } from 'zod'
import {
  CourtCaseStatus,
  CourtCaseOutcome,
  HearingType,
  ChargeStatus,
  SentenceType,
} from '../types/legal.types'

// ─── Shared refs ──────────────────────────────────────────────────────────────
const personRefSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
})

const crimeTypeRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

// ─── Sentence ─────────────────────────────────────────────────────────────────
export const sentenceSchema = z.object({
  id: z.string().uuid(),
  sentenceType: z.nativeEnum(SentenceType),
  durationMonths: z.number().nullable(),
  fineAmountETB: z.number().nullable(),
  notes: z.string().nullable(),
  issuedAt: z.string(),
  issuedByJudge: z.string().nullable(),
})

// ─── Hearing Date ─────────────────────────────────────────────────────────────
export const hearingDateSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  type: z.nativeEnum(HearingType),
  location: z.string(),
  notes: z.string().nullable(),
  outcome: z.string().nullable(),
})

// ─── Charge List Item ─────────────────────────────────────────────────────────
export const chargeListItemSchema = z.object({
  id: z.string().uuid(),
  courtCaseId: z.string().uuid(),
  caseId: z.string().uuid(),
  suspect: personRefSchema,
  crimeType: crimeTypeRefSchema,
  status: z.nativeEnum(ChargeStatus),
  filedAt: z.string(),
  updatedAt: z.string(),
  hasSentence: z.boolean(),
})

// ─── Charge Detail ────────────────────────────────────────────────────────────
export const chargeDetailSchema = chargeListItemSchema.extend({
  sentence: sentenceSchema.nullable(),
  notes: z.string().nullable(),
})

// ─── Paginated charges ────────────────────────────────────────────────────────
export const paginatedChargesSchema = z.object({
  data: z.array(chargeListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})

// ─── Court Case Summary ───────────────────────────────────────────────────────
export const courtCaseSummarySchema = z.object({
  id: z.string().uuid(),
  courtCaseNumber: z.string(),
  investigationCaseId: z.string().uuid(),
  investigationCaseTitle: z.string(),
  court: z.string(),
  status: z.nativeEnum(CourtCaseStatus),
  outcome: z.nativeEnum(CourtCaseOutcome).nullable(),
  filedAt: z.string(),
  nextHearingDate: z.string().nullable(),
  chargeCount: z.number(),
  updatedAt: z.string(),
})

// ─── Court Case Detail ────────────────────────────────────────────────────────
export const courtCaseDetailSchema = courtCaseSummarySchema.extend({
  hearingDates: z.array(hearingDateSchema),
  presidingJudge: z.string().nullable(),
  prosecutor: z.string().nullable(),
  defenceCounsel: z.string().nullable(),
  notes: z.string().nullable(),
  charges: z.array(chargeListItemSchema),
})

// ─── Paginated court cases ────────────────────────────────────────────────────
export const paginatedCourtCasesSchema = z.object({
  data: z.array(courtCaseSummarySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
})
```

## 5.5 `src/features/legal/schemas/legal-filters.schema.ts`

```typescript
import { z } from 'zod'
import { CourtCaseStatus, ChargeStatus } from '../types/legal.types'

export const courtCaseFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(CourtCaseStatus)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z
    .enum(['filedAt', 'courtCaseNumber', 'status'])
    .optional()
    .default('filedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const chargeFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.nativeEnum(ChargeStatus)).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(10).max(100).optional().default(25),
  sortField: z.enum(['filedAt', 'status']).optional().default('filedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})
```

---

# 6. `src/features/legal/utils/chargeUtils.ts`

Utility functions shared across charge components.

```typescript
import { ChargeStatus, TERMINAL_CHARGE_STATUSES } from '../types/legal.types'
import type { BadgeVariant } from '@shared/types/ui.types'

// ─── Charge Status badge variant mapping ─────────────────────────────────────
export const CHARGE_STATUS_VARIANTS: Record<ChargeStatus, BadgeVariant> = {
  FILED:      'primary',       // Blue — charge has been filed
  ACTIVE:     'warning',       // Amber — case in active proceedings
  CONVICTED:  'destructive',   // Red — found guilty
  ACQUITTED:  'success',       // Green — found not guilty
  DROPPED:    'muted',         // Slate — charge withdrawn
}

// ─── Terminal state guard ─────────────────────────────────────────────────────
export function isChargeTerminal(status: ChargeStatus): boolean {
  return TERMINAL_CHARGE_STATUSES.includes(status)
}

// ─── Available next statuses for a charge ────────────────────────────────────
// CONVICTED is omitted here — that transition is only available via the
// "Record Conviction & Sentence" flow in UpdateChargeStatusDrawer.
export function getAvailableChargeStatuses(
  current: ChargeStatus,
): ChargeStatus[] {
  if (isChargeTerminal(current)) return []
  if (current === ChargeStatus.FILED) {
    return [ChargeStatus.ACTIVE, ChargeStatus.ACQUITTED]
  }
  if (current === ChargeStatus.ACTIVE) {
    return [ChargeStatus.ACQUITTED]
  }
  return []
}

// ─── Duration formatter ───────────────────────────────────────────────────────
export function formatDurationMonths(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years} year${years === 1 ? '' : 's'}, ${rem} month${rem === 1 ? '' : 's'}`
}

// ─── Fine amount formatter ────────────────────────────────────────────────────
export function formatFineAmount(amount: number): string {
  return `${amount.toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`
}
```

---

# 7. Query Key Factory

## 7.1 `src/services/query/keys/legalKeys.ts`

```typescript
export const legalKeys = {
  // ── Court case root ─────────────────────────────────────────────────────────
  courtCases: () => ['courtCases'] as const,

  // ── Global court case list (for /legal/court-cases page) ────────────────────
  courtCaseList: () => [...legalKeys.courtCases(), 'list'] as const,
  courtCaseListFiltered: (filters: Record<string, unknown>) =>
    [...legalKeys.courtCaseList(), filters] as const,

  // ── Court case detail ────────────────────────────────────────────────────────
  courtCaseDetail: () => [...legalKeys.courtCases(), 'detail'] as const,
  courtCase: (courtCaseId: string) =>
    [...legalKeys.courtCaseDetail(), courtCaseId] as const,

  // ── Court case by investigation case (for legal tab) ────────────────────────
  courtCaseByCase: (caseId: string) =>
    [...legalKeys.courtCases(), 'byCase', caseId] as const,

  // ── Charges ──────────────────────────────────────────────────────────────────
  charges: () => ['charges'] as const,

  chargeList: (courtCaseId: string) =>
    [...legalKeys.charges(), 'list', courtCaseId] as const,
  chargeListFiltered: (
    courtCaseId: string,
    filters: Record<string, unknown>,
  ) => [...legalKeys.chargeList(courtCaseId), filters] as const,

  chargeDetail: (chargeId: string) =>
    [...legalKeys.charges(), 'detail', chargeId] as const,
} as const
```

---

# 8. Service Layer

## 8.1 `src/services/domain/legal.service.ts`

Replace all stubs. Every response is validated with the corresponding Zod schema. Services return typed objects; the Zod parse throws on schema mismatch, which the `ApiError` interceptor handles.

```typescript
import { apiClient } from '@services/api/client'
import {
  paginatedCourtCasesSchema,
  courtCaseDetailSchema,
  paginatedChargesSchema,
  chargeDetailSchema,
} from '@features/legal/schemas/legal-api.schema'
import type {
  CourtCase,
  CourtCaseSummary,
  CourtCaseFilters,
  ChargeListItem,
  Charge,
  ChargeFilters,
  CreateCourtCasePayload,
  UpdateCourtCasePayload,
  CreateChargePayload,
  UpdateChargePayload,
  RecordSentencePayload,
} from '@features/legal/types/legal.types'
import type { PaginatedResponse } from '@shared/types/api.types'

// ─── Court Cases ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/court-cases
 * List all court cases (scoped to officer's access level by backend).
 */
export async function getCourtCases(
  filters: CourtCaseFilters,
): Promise<PaginatedResponse<CourtCaseSummary>> {
  const params = buildCourtCaseParams(filters)
  const raw = await apiClient.get(`/api/v1/court-cases?${params}`)
  return paginatedCourtCasesSchema.parse(raw)
}

/**
 * GET /api/v1/cases/{caseId}/court-case
 * Fetch the single court case linked to an investigation case.
 * Returns null-equivalent (empty response) when no court case exists.
 * Backend returns 404 when none is linked — catch 404 and return null in the hook.
 */
export async function getCourtCaseByCase(
  caseId: string,
): Promise<CourtCase | null> {
  try {
    const raw = await apiClient.get(`/api/v1/cases/${caseId}/court-case`)
    return courtCaseDetailSchema.parse(raw)
  } catch (err: unknown) {
    // A 404 means no court case is linked yet — this is an expected state
    if (isNotFoundError(err)) return null
    throw err
  }
}

/**
 * POST /api/v1/cases/{caseId}/court-case
 * Create and link a court case to an investigation case.
 */
export async function createCourtCase(
  caseId: string,
  payload: CreateCourtCasePayload,
): Promise<CourtCase> {
  const raw = await apiClient.post(
    `/api/v1/cases/${caseId}/court-case`,
    payload,
  )
  return courtCaseDetailSchema.parse(raw)
}

/**
 * PATCH /api/v1/court-cases/{courtCaseId}
 * Update a court case's metadata, status, hearing dates, or outcome.
 */
export async function updateCourtCase(
  courtCaseId: string,
  payload: UpdateCourtCasePayload,
): Promise<CourtCase> {
  const raw = await apiClient.patch(
    `/api/v1/court-cases/${courtCaseId}`,
    payload,
  )
  return courtCaseDetailSchema.parse(raw)
}

// ─── Charges ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/court-cases/{courtCaseId}/charges
 * Paginated list of charges for a given court case.
 */
export async function getCharges(
  courtCaseId: string,
  filters: ChargeFilters,
): Promise<PaginatedResponse<ChargeListItem>> {
  const params = buildChargeParams(filters)
  const raw = await apiClient.get(
    `/api/v1/court-cases/${courtCaseId}/charges?${params}`,
  )
  return paginatedChargesSchema.parse(raw)
}

/**
 * POST /api/v1/court-cases/{courtCaseId}/charges
 * File a new charge against a suspect within a court case.
 */
export async function createCharge(
  courtCaseId: string,
  payload: CreateChargePayload,
): Promise<Charge> {
  const raw = await apiClient.post(
    `/api/v1/court-cases/${courtCaseId}/charges`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

/**
 * PATCH /api/v1/charges/{chargeId}
 * Update a charge's status. For conviction, use recordSentence instead.
 */
export async function updateCharge(
  chargeId: string,
  payload: UpdateChargePayload,
): Promise<Charge> {
  const raw = await apiClient.patch(`/api/v1/charges/${chargeId}`, payload)
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/charges/{chargeId}/sentence
 * Record conviction and sentence for a charge. Sets status to CONVICTED.
 */
export async function recordSentence(
  chargeId: string,
  payload: RecordSentencePayload,
): Promise<Charge> {
  const raw = await apiClient.post(
    `/api/v1/charges/${chargeId}/sentence`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCourtCaseParams(filters: CourtCaseFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) p.set('dateTo', filters.dateTo)
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function buildChargeParams(filters: ChargeFilters): string {
  const p = new URLSearchParams()
  if (filters.search) p.set('search', filters.search)
  if (filters.status?.length) p.set('status', filters.status.join(','))
  p.set('page', String(filters.page ?? 1))
  p.set('pageSize', String(filters.pageSize ?? 25))
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortDirection) p.set('sortDirection', filters.sortDirection)
  return p.toString()
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 404
  )
}
```

---

# 9. React Query Hooks

Create all hooks in `src/features/legal/hooks/`.

## 9.1 `useCourtCaseByCase.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCourtCaseByCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'

export function useCourtCaseByCase(caseId: string) {
  return useQuery({
    queryKey: legalKeys.courtCaseByCase(caseId),
    queryFn: () => getCourtCaseByCase(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
    // null result (no court case) is a valid state — not an error
    retry: (failureCount, error: unknown) => {
      const is404 =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as { status: number }).status === 404
      if (is404) return false
      return failureCount < 3
    },
  })
}
```

## 9.2 `useCourtCaseList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCourtCases } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import type { CourtCaseFilters } from '../types/legal.types'

export function useCourtCaseList(filters: CourtCaseFilters) {
  return useQuery({
    queryKey: legalKeys.courtCaseListFiltered(filters as Record<string, unknown>),
    queryFn: () => getCourtCases(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
```

## 9.3 `useCreateCourtCase.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createCourtCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateCourtCasePayload } from '../types/legal.types'

export function useCreateCourtCase(caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: CreateCourtCasePayload) =>
      createCourtCase(caseId, payload),
    onSuccess: () => {
      // Invalidate the court case for this investigation case
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      // Invalidate the global court case list
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseList(),
      })
      // Invalidate case summary so the overview tab count cards update
      void queryClient.invalidateQueries({
        queryKey: caseKeys.summary(caseId),
      })
      addToast({ message: t('courtCase.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('courtCase.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.4 `useUpdateCourtCase.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCourtCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateCourtCasePayload } from '../types/legal.types'

export function useUpdateCourtCase(courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: UpdateCourtCasePayload) =>
      updateCourtCase(courtCaseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCase(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseList(),
      })
      addToast({ message: t('courtCase.update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('courtCase.update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.5 `useChargeList.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getCharges } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import type { ChargeFilters } from '../types/legal.types'

export function useChargeList(
  courtCaseId: string,
  caseId: string,
  filters: ChargeFilters,
) {
  return useQuery({
    queryKey: legalKeys.chargeListFiltered(
      courtCaseId,
      filters as Record<string, unknown>,
    ),
    queryFn: () => getCharges(courtCaseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(courtCaseId) && Boolean(caseId),
  })
}
```

## 9.6 `useCreateCharge.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { CreateChargePayload } from '../types/legal.types'

export function useCreateCharge(courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: CreateChargePayload) =>
      createCharge(courtCaseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeList(courtCaseId),
      })
      // Refresh the court case so chargeCount updates in the CourtCaseCard
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      // Update case overview tab count card
      void queryClient.invalidateQueries({
        queryKey: caseKeys.summary(caseId),
      })
      addToast({ message: t('charges.create.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('charges.create.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.7 `useUpdateCharge.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { UpdateChargePayload } from '../types/legal.types'

export function useUpdateCharge(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: UpdateChargePayload) =>
      updateCharge(chargeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeDetail(chargeId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeList(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      addToast({ message: t('charges.update.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('charges.update.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.8 `useDropCharge.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { updateCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ChargeStatus } from '../types/legal.types'

export function useDropCharge(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    // Drop is a specific status update — set to DROPPED
    mutationFn: () =>
      updateCharge(chargeId, { status: ChargeStatus.DROPPED }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeList(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: caseKeys.summary(caseId),
      })
      addToast({ message: t('charges.drop.successMessage'), variant: 'success' })
    },
  })
}
```

## 9.9 `useRecordSentence.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { recordSentence } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { RecordSentencePayload } from '../types/legal.types'

export function useRecordSentence(
  chargeId: string,
  courtCaseId: string,
  caseId: string,
) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (payload: RecordSentencePayload) =>
      recordSentence(chargeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeDetail(chargeId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.chargeList(courtCaseId),
      })
      void queryClient.invalidateQueries({
        queryKey: legalKeys.courtCaseByCase(caseId),
      })
      addToast({ message: t('charges.sentence.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : t('charges.sentence.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 9.10 `src/features/legal/hooks/index.ts`

Export all hooks:

```typescript
export { useCourtCaseByCase } from './useCourtCaseByCase'
export { useCourtCaseList } from './useCourtCaseList'
export { useCreateCourtCase } from './useCreateCourtCase'
export { useUpdateCourtCase } from './useUpdateCourtCase'
export { useChargeList } from './useChargeList'
export { useCreateCharge } from './useCreateCharge'
export { useUpdateCharge } from './useUpdateCharge'
export { useDropCharge } from './useDropCharge'
export { useRecordSentence } from './useRecordSentence'
```

---

# 10. i18n Messages — Legal

## 10.1 `messages/en/legal.json` — Full Population

```json
{
  "pageTitle": "Legal",
  "tab": {
    "heading": "Legal Proceedings",
    "lockedTooltip": "You do not have access to legal proceedings. Contact a Legal Officer.",
    "loading": "Loading legal proceedings...",
    "errorTitle": "Failed to load legal proceedings",
    "errorDescription": "Please refresh the page or contact support if the issue persists."
  },
  "courtCase": {
    "sectionTitle": "Court Case",
    "empty": {
      "title": "No Court Case Linked",
      "description": "This investigation case has not yet been linked to a court case. A Legal Officer can create and link one.",
      "createButton": "Create Court Case"
    },
    "card": {
      "caseNumber": "Court Case No.",
      "court": "Court",
      "status": "Status",
      "outcome": "Outcome",
      "filedAt": "Filed",
      "nextHearing": "Next Hearing",
      "noNextHearing": "No hearing scheduled",
      "presidingJudge": "Presiding Judge",
      "noJudge": "Not recorded",
      "prosecutor": "Prosecutor",
      "noProsecutor": "Not recorded",
      "defenceCounsel": "Defence Counsel",
      "noDefenceCounsel": "Not recorded",
      "notes": "Notes",
      "noNotes": "No notes.",
      "chargeCount": "{count} charge(s)",
      "editButton": "Edit Court Case",
      "hearingsSectionTitle": "Hearing Dates"
    },
    "status": {
      "PENDING": "Pending",
      "ACTIVE": "Active",
      "CONCLUDED": "Concluded",
      "DISMISSED": "Dismissed"
    },
    "outcome": {
      "GUILTY": "Guilty",
      "NOT_GUILTY": "Not Guilty",
      "DISMISSED": "Dismissed",
      "MISTRIAL": "Mistrial",
      "PLEA_DEAL": "Plea Deal"
    },
    "hearingType": {
      "PRELIMINARY": "Preliminary Hearing",
      "TRIAL": "Trial",
      "SENTENCING": "Sentencing",
      "APPEAL": "Appeal",
      "ARRAIGNMENT": "Arraignment"
    },
    "create": {
      "drawerTitle": "Create Court Case",
      "drawerDescription": "Link this investigation case to court proceedings.",
      "section1Title": "Court Details",
      "section2Title": "Key Personnel",
      "section3Title": "Hearing Dates (optional)",
      "section4Title": "Additional Notes",
      "courtLabel": "Court Name",
      "courtPlaceholder": "e.g. Federal High Court — Lideta Division",
      "filedAtLabel": "Date Filed",
      "presidingJudgeLabel": "Presiding Judge (optional)",
      "presidingJudgePlaceholder": "Full name of the judge",
      "prosecutorLabel": "Prosecutor (optional)",
      "prosecutorPlaceholder": "Full name of the prosecutor",
      "defenceCounselLabel": "Defence Counsel (optional)",
      "defenceCounselPlaceholder": "Full name of the defence counsel",
      "addHearingButton": "Add Hearing Date",
      "hearingDateLabel": "Date",
      "hearingTypeLabel": "Hearing Type",
      "hearingLocationLabel": "Location",
      "hearingLocationPlaceholder": "e.g. Courtroom 4, Lideta Courts",
      "hearingNotesLabel": "Notes (optional)",
      "removeHearingButton": "Remove",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Any additional notes about the court case...",
      "submitButton": "Create Court Case",
      "cancelButton": "Cancel",
      "successMessage": "Court case created and linked successfully.",
      "errorMessage": "Failed to create court case. Please try again."
    },
    "update": {
      "drawerTitle": "Edit Court Case",
      "drawerDescription": "Update court case metadata, status, or hearing dates.",
      "courtLabel": "Court Name",
      "statusLabel": "Status",
      "outcomeLabel": "Outcome",
      "outcomeHint": "Required when status is Concluded.",
      "presidingJudgeLabel": "Presiding Judge",
      "prosecutorLabel": "Prosecutor",
      "defenceCounselLabel": "Defence Counsel",
      "hearingsSectionTitle": "Hearing Dates",
      "addHearingButton": "Add Hearing Date",
      "notesLabel": "Notes",
      "submitButton": "Save Changes",
      "cancelButton": "Cancel",
      "successMessage": "Court case updated successfully.",
      "errorMessage": "Failed to update court case. Please try again."
    }
  },
  "charges": {
    "sectionTitle": "Charges",
    "addChargeButton": "Add Charge",
    "entityCount": "{count} charge(s)",
    "filters": {
      "search": "Search by suspect or crime type...",
      "status": "Status",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading charges...",
    "empty": {
      "title": "No Charges Filed",
      "description": "No charges have been filed in this court case yet.",
      "cta": "Add the first charge using the button above."
    },
    "emptyFiltered": "No charges match your current filters.",
    "columns": {
      "suspect": "Suspect",
      "crimeType": "Crime Type",
      "status": "Status",
      "filedAt": "Filed",
      "sentence": "Sentence",
      "actions": "Actions"
    },
    "sentenceIndicator": {
      "recorded": "Recorded",
      "pending": "Pending"
    },
    "rowActions": {
      "updateStatus": "Update Status",
      "viewSentence": "View Sentence",
      "dropCharge": "Drop Charge"
    },
    "status": {
      "FILED": "Filed",
      "ACTIVE": "Active",
      "CONVICTED": "Convicted",
      "ACQUITTED": "Acquitted",
      "DROPPED": "Dropped"
    },
    "create": {
      "drawerTitle": "Add Charge",
      "drawerDescription": "File a new charge in this court case.",
      "section1Title": "Charge Details",
      "suspectLabel": "Suspect",
      "suspectPlaceholder": "Search suspects linked to this case...",
      "suspectHint": "Only persons linked to this investigation case as suspects are shown.",
      "crimeTypeLabel": "Crime Type",
      "crimeTypePlaceholder": "Search crime types...",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Additional notes about this charge...",
      "submitButton": "File Charge",
      "cancelButton": "Cancel",
      "successMessage": "Charge filed successfully.",
      "errorMessage": "Failed to file charge. Please try again."
    },
    "update": {
      "drawerTitle": "Update Charge Status",
      "drawerDescription": "Change the status of this charge.",
      "currentStatusLabel": "Current Status",
      "newStatusLabel": "New Status",
      "newStatusPlaceholder": "Select new status...",
      "terminalNotice": "This charge has reached a final status and cannot be changed.",
      "convictSection": "Record Conviction",
      "convictNotice": "Selecting 'Convicted' will record this charge as a conviction. You must also record the sentencing details. This action cannot be reversed.",
      "convictButton": "Record Conviction & Sentence",
      "submitButton": "Update Status",
      "cancelButton": "Cancel",
      "successMessage": "Charge status updated successfully.",
      "errorMessage": "Failed to update charge status. Please try again."
    },
    "drop": {
      "confirmTitle": "Drop this charge?",
      "confirmDescription": "Charge against {suspectName} ({crimeType}) will be permanently set to Dropped. This action cannot be undone.",
      "confirmButton": "Drop Charge",
      "cancelButton": "Cancel",
      "successMessage": "Charge dropped successfully."
    },
    "sentence": {
      "drawerTitle": "Record Sentence",
      "drawerDescription": "Record the sentencing details for this conviction.",
      "convictionNotice": "Recording a sentence will permanently set this charge to Convicted. This cannot be reversed.",
      "section1Title": "Sentence Details",
      "sentenceTypeLabel": "Sentence Type",
      "durationMonthsLabel": "Duration (months)",
      "durationMonthsPlaceholder": "e.g. 60 for 5 years",
      "durationMonthsHint": "Enter the total sentence length in months.",
      "fineAmountLabel": "Fine Amount (ETB)",
      "fineAmountPlaceholder": "Enter fine amount in Ethiopian Birr",
      "issuedAtLabel": "Sentence Date",
      "issuedByJudgeLabel": "Issued By Judge (optional)",
      "issuedByJudgePlaceholder": "Full name of the sentencing judge",
      "notesLabel": "Sentence Notes (optional)",
      "notesPlaceholder": "Any additional sentencing notes or conditions...",
      "submitButton": "Record Sentence",
      "cancelButton": "Cancel",
      "successMessage": "Sentence recorded successfully. Charge is now Convicted.",
      "errorMessage": "Failed to record sentence. Please try again."
    },
    "viewSentence": {
      "drawerTitle": "Sentence Details",
      "immutableNotice": "This sentence record is permanent and cannot be modified.",
      "sentenceType": "Sentence Type",
      "duration": "Duration",
      "fineAmount": "Fine Amount",
      "issuedAt": "Sentenced On",
      "issuedByJudge": "Sentenced By",
      "noJudge": "Not recorded",
      "notes": "Notes",
      "noNotes": "No notes.",
      "closeButton": "Close"
    },
    "sentenceType": {
      "IMPRISONMENT": "Imprisonment",
      "FINE": "Fine",
      "COMMUNITY_SERVICE": "Community Service",
      "SUSPENDED": "Suspended Sentence",
      "DEATH_PENALTY": "Death Penalty",
      "LIFE_IMPRISONMENT": "Life Imprisonment"
    }
  },
  "courtCasesList": {
    "pageTitle": "Court Cases",
    "entityCount": "{count} court case(s)",
    "filters": {
      "search": "Search by case title or court no...",
      "status": "Status",
      "dateRange": "Date Range",
      "clearAll": "Clear all filters"
    },
    "loading": "Loading court cases...",
    "empty": {
      "title": "No Court Cases",
      "description": "No court cases found. Court cases are created from within individual case files."
    },
    "emptyFiltered": "No court cases match your current filters.",
    "columns": {
      "courtCaseNumber": "Court Case No.",
      "investigationCase": "Investigation Case",
      "court": "Court",
      "status": "Status",
      "outcome": "Outcome",
      "filedAt": "Filed",
      "nextHearing": "Next Hearing",
      "chargeCount": "Charges",
      "actions": "Actions"
    },
    "rowActions": {
      "viewCase": "View Investigation Case"
    }
  }
}
```

## 10.2 `messages/am/legal.json` — Full Amharic Equivalent

Every key in `en/legal.json` must appear with the identical key path:

```json
{
  "pageTitle": "ሕጋዊ",
  "tab": {
    "heading": "ሕጋዊ ሂደቶች",
    "lockedTooltip": "ወደ ሕጋዊ ሂደቶች ስልጣን የለዎትም። ሕጋዊ ባለሙያ ያነጋግሩ።",
    "loading": "ሕጋዊ ሂደቶች እየጫነ ነው...",
    "errorTitle": "ሕጋዊ ሂደቶችን መጫን አልተሳካም",
    "errorDescription": "ገጹን ያድሱ ወይም ችግሩ ከቀጠለ ድጋፍ ያነጋግሩ።"
  },
  "courtCase": {
    "sectionTitle": "የፍርድ ቤት ጉዳይ",
    "empty": {
      "title": "ምንም የፍርድ ቤት ጉዳይ አልተጣበቀም",
      "description": "ይህ የምርመራ ጉዳይ ለፍርድ ቤት ጉዳይ ገና አልተጣበቀም። ሕጋዊ ባለሙያ መፍጠር ይችላል።",
      "createButton": "የፍርድ ቤት ጉዳይ ፍጠር"
    },
    "card": {
      "caseNumber": "የፍርድ ቤት ጉዳይ ቁ.",
      "court": "ፍርድ ቤት",
      "status": "ሁኔታ",
      "outcome": "ውጤት",
      "filedAt": "የቀረበ",
      "nextHearing": "ቀጣይ ችሎት",
      "noNextHearing": "ምንም ችሎት አልታቀደም",
      "presidingJudge": "ሊቀ-ዳኛ",
      "noJudge": "አልተመዘገበም",
      "prosecutor": "አቃቤ ሕግ",
      "noProsecutor": "አልተመዘገበም",
      "defenceCounsel": "ጠበቃ",
      "noDefenceCounsel": "አልተመዘገበም",
      "notes": "ማስታወሻ",
      "noNotes": "ምንም ማስታወሻ የለም።",
      "chargeCount": "{count} ክስ(ቾ)",
      "editButton": "የፍርድ ቤት ጉዳይ አርም",
      "hearingsSectionTitle": "የቤት ቀናት"
    },
    "status": {
      "PENDING": "በመጠባበቅ ላይ",
      "ACTIVE": "ንቁ",
      "CONCLUDED": "የተጠናቀቀ",
      "DISMISSED": "ውድቅ"
    },
    "outcome": {
      "GUILTY": "ጥፋተኛ",
      "NOT_GUILTY": "ጥፋተኛ አይደለም",
      "DISMISSED": "ውድቅ ተደርጓል",
      "MISTRIAL": "ሚስትሪያል",
      "PLEA_DEAL": "ስምምነት"
    },
    "hearingType": {
      "PRELIMINARY": "ቅድመ ችሎት",
      "TRIAL": "ፍርድ",
      "SENTENCING": "ቅጣት",
      "APPEAL": "ይግባኝ",
      "ARRAIGNMENT": "ክስ ማቅረቢያ"
    },
    "create": {
      "drawerTitle": "የፍርድ ቤት ጉዳይ ፍጠር",
      "drawerDescription": "ይህን የምርመራ ጉዳይ ከፍርድ ቤት ሂደት ጋር ያጣምሩ።",
      "section1Title": "የፍርድ ቤት ዝርዝሮች",
      "section2Title": "ዋና ሰዎች",
      "section3Title": "የቤት ቀናት (አማራጭ)",
      "section4Title": "ተጨማሪ ማስታወሻዎች",
      "courtLabel": "የፍርድ ቤት ስም",
      "courtPlaceholder": "ለምሳሌ የፌደራል ከፍተኛ ፍርድ ቤት — ልደታ ምድብ",
      "filedAtLabel": "የቀረበበት ቀን",
      "presidingJudgeLabel": "ሊቀ-ዳኛ (አማራጭ)",
      "presidingJudgePlaceholder": "የዳኛ ሙሉ ስም",
      "prosecutorLabel": "አቃቤ ሕግ (አማራጭ)",
      "prosecutorPlaceholder": "የአቃቤ ሕግ ሙሉ ስም",
      "defenceCounselLabel": "ጠበቃ (አማራጭ)",
      "defenceCounselPlaceholder": "የጠበቃ ሙሉ ስም",
      "addHearingButton": "የቤት ቀን ጨምር",
      "hearingDateLabel": "ቀን",
      "hearingTypeLabel": "የቤት አይነት",
      "hearingLocationLabel": "ቦታ",
      "hearingLocationPlaceholder": "ለምሳሌ አዳራሽ 4፣ ልደታ ፍርድ ቤቶች",
      "hearingNotesLabel": "ማስታወሻ (አማራጭ)",
      "removeHearingButton": "አስወግድ",
      "notesLabel": "ማስታወሻ (አማራጭ)",
      "notesPlaceholder": "ስለ ፍርድ ቤቱ ጉዳይ ማናቸውም ተጨማሪ ማስታወሻ...",
      "submitButton": "የፍርድ ቤት ጉዳይ ፍጠር",
      "cancelButton": "ሰርዝ",
      "successMessage": "የፍርድ ቤት ጉዳይ በተሳካ ሁኔታ ተፈጥሮ ተጣምሯል።",
      "errorMessage": "የፍርድ ቤት ጉዳይ ለመፍጠር አልተሳካም። እንደገና ይሞክሩ።"
    },
    "update": {
      "drawerTitle": "የፍርድ ቤት ጉዳይ አርም",
      "drawerDescription": "የፍርድ ቤት ጉዳዩን ዝርዝሮች፣ ሁኔታ፣ ወይም የቤት ቀናት ያዘምኑ።",
      "courtLabel": "የፍርድ ቤት ስም",
      "statusLabel": "ሁኔታ",
      "outcomeLabel": "ውጤት",
      "outcomeHint": "ሁኔታው 'ተጠናቋል' ሲሆን ውጤት ያስፈልጋል።",
      "presidingJudgeLabel": "ሊቀ-ዳኛ",
      "prosecutorLabel": "አቃቤ ሕግ",
      "defenceCounselLabel": "ጠበቃ",
      "hearingsSectionTitle": "የቤት ቀናት",
      "addHearingButton": "የቤት ቀን ጨምር",
      "notesLabel": "ማስታወሻ",
      "submitButton": "ለውጦች ያስቀምጡ",
      "cancelButton": "ሰርዝ",
      "successMessage": "የፍርድ ቤት ጉዳይ በተሳካ ሁኔታ ተዘምኗል።",
      "errorMessage": "የፍርድ ቤት ጉዳይ ለማዘምን አልተሳካም። እንደገና ይሞክሩ።"
    }
  },
  "charges": {
    "sectionTitle": "ክሶች",
    "addChargeButton": "ክስ ጨምር",
    "entityCount": "{count} ክስ(ቾ)",
    "filters": {
      "search": "በተጠርጣሪ ወይም ወንጀል አይነት ፈልግ...",
      "status": "ሁኔታ",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "ክሶቾ እየጫነ ነው...",
    "empty": {
      "title": "ምንም ክስ አልቀረበም",
      "description": "ለዚህ የፍርድ ቤት ጉዳይ ምንም ክስ ገና አልቀረበም።",
      "cta": "ከላይ ያለውን አዝራር በመጠቀም የመጀመሪያ ክስ ያቅርቡ።"
    },
    "emptyFiltered": "ምንም ክሶቾ ከማጣሪያዎ ጋር አይዛመዱም።",
    "columns": {
      "suspect": "ተጠርጣሪ",
      "crimeType": "የወንጀል አይነት",
      "status": "ሁኔታ",
      "filedAt": "የቀረበ",
      "sentence": "ቅጣት",
      "actions": "ድርጊቶች"
    },
    "sentenceIndicator": {
      "recorded": "ተመዝግቧል",
      "pending": "በጥበቃ ላይ"
    },
    "rowActions": {
      "updateStatus": "ሁኔታ አዘምን",
      "viewSentence": "ቅጣት ተመልከት",
      "dropCharge": "ክስ ዝቅ አድርግ"
    },
    "status": {
      "FILED": "ቀርቧል",
      "ACTIVE": "ንቁ",
      "CONVICTED": "ጥፋተኛ ተብሏል",
      "ACQUITTED": "ነጻ ተለቋል",
      "DROPPED": "ውድቅ"
    },
    "create": {
      "drawerTitle": "ክስ ጨምር",
      "drawerDescription": "ለዚህ ፍርድ ቤት ጉዳይ አዲስ ክስ ያቅርቡ።",
      "section1Title": "የክስ ዝርዝሮች",
      "suspectLabel": "ተጠርጣሪ",
      "suspectPlaceholder": "ለዚህ ጉዳይ ተጠርጣሪዎችን ፈልግ...",
      "suspectHint": "ለዚህ ምርመራ ጉዳይ ተጠርጣሪ ሆነው የተጣበቁ ሰዎች ብቻ ይታያሉ።",
      "crimeTypeLabel": "የወንጀል አይነት",
      "crimeTypePlaceholder": "የወንጀል አይነቶችን ፈልግ...",
      "notesLabel": "ማስታወሻ (አማራጭ)",
      "notesPlaceholder": "ስለዚህ ክስ ተጨማሪ ማስታወሻዎች...",
      "submitButton": "ክስ አቅርብ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ክሱ በተሳካ ሁኔታ ቀርቧል።",
      "errorMessage": "ክስ ለማቅረብ አልተሳካም። እንደገና ይሞክሩ።"
    },
    "update": {
      "drawerTitle": "የክስ ሁኔታ አዘምን",
      "drawerDescription": "የዚህን ክስ ሁኔታ ይቀይሩ።",
      "currentStatusLabel": "አሁናዊ ሁኔታ",
      "newStatusLabel": "አዲስ ሁኔታ",
      "newStatusPlaceholder": "አዲስ ሁኔታ ይምረጡ...",
      "terminalNotice": "ይህ ክስ የመጨረሻ ሁኔታ ላይ ደርሷል እና ሊቀየር አይችልም።",
      "convictSection": "ጥፋተኛ ያስመዝጉ",
      "convictNotice": "'ጥፋተኛ' መምረጥ ይህን ክስ ጥፋተኛ ሆኖ ያሰፍረዋል። የቅጣት ዝርዝሮችንም ማስቀመጥ ያለቦት። ይህ ድርጊት ሊቀለበስ አይችልም።",
      "convictButton": "ጥፋተኛ & ቅጣት ይመዝግቡ",
      "submitButton": "ሁኔታ አዘምን",
      "cancelButton": "ሰርዝ",
      "successMessage": "የክስ ሁኔታ በተሳካ ሁኔታ ተዘምኗል።",
      "errorMessage": "የክስ ሁኔታ ለማዘምን አልተሳካም። እንደገና ይሞክሩ።"
    },
    "drop": {
      "confirmTitle": "ይህን ክስ ዝቅ ያድርጉ?",
      "confirmDescription": "{suspectName} ({crimeType}) ላይ የቀረበ ክስ ቋሚ ሆኖ ውድቅ ይሆናል። ይህ ድርጊት ሊቀለበስ አይችልም።",
      "confirmButton": "ክስ ዝቅ አድርግ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ክሱ በተሳካ ሁኔታ ውድቅ ሆኗል።"
    },
    "sentence": {
      "drawerTitle": "ቅጣት ይምዝግቡ",
      "drawerDescription": "ለዚህ ጥፋተኛ ፍርድ የቅጣት ዝርዝሮች ያስቀምጡ።",
      "convictionNotice": "ቅጣት መሰወር ይህን ክስ ቋሚ ሆኖ ጥፋተኛ ያስቀምጠዋል። ሊቀለበስ አይችልም።",
      "section1Title": "የቅጣት ዝርዝሮች",
      "sentenceTypeLabel": "የቅጣት አይነት",
      "durationMonthsLabel": "ቆይታ (ወራት)",
      "durationMonthsPlaceholder": "ለምሳሌ 5 ዓመት = 60",
      "durationMonthsHint": "ጠቅላላ የቅጣት ቆይታ በወራት ያስገቡ።",
      "fineAmountLabel": "የቅጣት መጠን (ብር)",
      "fineAmountPlaceholder": "መጠን በኢትዮጵያ ብር ያስገቡ",
      "issuedAtLabel": "የቅጣት ቀን",
      "issuedByJudgeLabel": "ቅጣቱ የተሰጠ ዳኛ (አማራጭ)",
      "issuedByJudgePlaceholder": "የዳኛ ሙሉ ስም",
      "notesLabel": "የቅጣት ማስታወሻ (አማራጭ)",
      "notesPlaceholder": "ስለ ቅጣቱ ተጨማሪ ማስታወሻዎች...",
      "submitButton": "ቅጣት ይምዝገቡ",
      "cancelButton": "ሰርዝ",
      "successMessage": "ቅጣቱ በተሳካ ሁኔታ ተሰፍሯል። ክሱ አሁን ጥፋተኛ ሆኗል።",
      "errorMessage": "ቅጣቱን ለማስፈር አልተሳካም። እንደገና ይሞክሩ።"
    },
    "viewSentence": {
      "drawerTitle": "የቅጣት ዝርዝሮች",
      "immutableNotice": "ይህ የቅጣት መዝገብ ቋሚ ነው እና ሊቀየር አይችልም።",
      "sentenceType": "የቅጣት አይነት",
      "duration": "ቆይታ",
      "fineAmount": "የቅጣት መጠን",
      "issuedAt": "የቅጣት ቀን",
      "issuedByJudge": "ቅጣቱ ያሰጠ",
      "noJudge": "አልተመዘገበም",
      "notes": "ማስታወሻ",
      "noNotes": "ምንም ማስታወሻ የለም።",
      "closeButton": "ዝጋ"
    },
    "sentenceType": {
      "IMPRISONMENT": "እስር",
      "FINE": "ቅጣት",
      "COMMUNITY_SERVICE": "ማህበረሰብ አገልግሎት",
      "SUSPENDED": "የተቋረጠ ፍርድ",
      "DEATH_PENALTY": "ሞት ቅጣት",
      "LIFE_IMPRISONMENT": "የዕድሜ ልክ እስር"
    }
  },
  "courtCasesList": {
    "pageTitle": "የፍርድ ቤት ጉዳዮች",
    "entityCount": "{count} ጉዳይ(ዎች)",
    "filters": {
      "search": "በጉዳይ ርዕስ ወይም ቁጥር ፈልግ...",
      "status": "ሁኔታ",
      "dateRange": "የቀን ክልል",
      "clearAll": "ሁሉም ማጣሪያዎች አጽዳ"
    },
    "loading": "የፍርድ ቤት ጉዳዮች እየጫነ ነው...",
    "empty": {
      "title": "ምንም የፍርድ ቤት ጉዳዮች የሉም",
      "description": "ምንም የፍርድ ቤት ጉዳዮች አልተገኙም። ጉዳዮቹ ከምርመራ ፋይሎቹ ውስጥ ይፈጠራሉ።"
    },
    "emptyFiltered": "ምንም ጉዳዮቾ ከማጣሪያዎ ጋር አይዛመዱም።",
    "columns": {
      "courtCaseNumber": "የፍርድ ቤት ቁ.",
      "investigationCase": "የምርመራ ጉዳይ",
      "court": "ፍርድ ቤት",
      "status": "ሁኔታ",
      "outcome": "ውጤት",
      "filedAt": "የቀረበ",
      "nextHearing": "ቀጣይ ቤት",
      "chargeCount": "ክሶቾ",
      "actions": "ድርጊቶች"
    },
    "rowActions": {
      "viewCase": "የምርመራ ጉዳዩ ተመልከት"
    }
  }
}
```

---

# 11. caseKeys Update

## 11.1 Verify and extend `src/services/query/keys/caseKeys.ts`

Open the existing `caseKeys.ts` file. Verify these sub-resource keys exist. If any are missing, add them:

```typescript
// Add to caseKeys factory if not already present:
charges: (caseId: string) =>
  [...caseKeys.detail(caseId), 'charges'] as const,

courtCase: (caseId: string) =>
  [...caseKeys.detail(caseId), 'courtCase'] as const,
```

These are used by the case overview tab's count cards (already rendered in Phase 3). Every `useCreateCharge` success must invalidate `caseKeys.summary(caseId)` and `caseKeys.charges(caseId)` so the overview tab count refreshes without a page reload.

---

# 12. Route Page — Legal Tab

## 12.1 `src/app/(dashboard)/cases/[caseId]/legal/page.tsx`

Replace the Phase 3 skeleton:

```typescript
import { getTranslations } from 'next-intl/server'
import { LegalTab } from '@features/legal/components/LegalTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return { title: t('pageTitle') }
}

export default function CaseLegalPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <LegalTab caseId={params.caseId} />
}
```

> **Note:** `LegalTab` is not listed in the §3 component tree because it is a thin orchestration wrapper rendered by the page. Create it as `src/features/legal/components/LegalTab.tsx` — a Client Component that composes `CourtCaseCard` and `ChargesTable` together with the drawer states.

---

# 13. Route Page — Court Cases List

## 13.1 `src/app/(dashboard)/legal/court-cases/page.tsx`

Replace the Phase 3 skeleton:

```typescript
import { getTranslations } from 'next-intl/server'
import { CourtCasesList } from '@features/legal/components/CourtCasesList'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return { title: t('courtCasesList.pageTitle') }
}

export default function CourtCasesPage() {
  return <CourtCasesList />
}
```

---

# 14. UI Implementation — LegalTab (Orchestration Wrapper)

## 14.1 `LegalTab.tsx`

Client Component. Manages all drawer open/close states for the legal tab.

### 14.1.1 State

```typescript
const [createCourtCaseOpen, setCreateCourtCaseOpen] = useState(false)
const [updateCourtCaseOpen, setUpdateCourtCaseOpen] = useState(false)
const [addChargeOpen, setAddChargeOpen] = useState(false)
const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null)
const [updateChargeOpen, setUpdateChargeOpen] = useState(false)
const [dropChargeOpen, setDropChargeOpen] = useState(false)
const [viewSentenceOpen, setViewSentenceOpen] = useState(false)
```

### 14.1.2 Data

```typescript
const {
  data: courtCase,
  isLoading,
  isError,
  error,
} = useCourtCaseByCase(caseId)
```

### 14.1.3 Render tree

```
LegalTab
├── [isLoading] → <Skeleton> (full panel skeleton matching card + table dimensions)
├── [isError] → <ErrorState> with retry
├── [courtCase === null] → <CourtCaseEmptyState> (see §15)
└── [courtCase exists]
    ├── <CourtCaseCard courtCase={courtCase} onEdit={() => setUpdateCourtCaseOpen(true)} />
    ├── <ChargesTable
    │     courtCaseId={courtCase.id}
    │     caseId={caseId}
    │     onAddCharge={() => setAddChargeOpen(true)}
    │     onUpdateStatus={(id) => { setSelectedChargeId(id); setUpdateChargeOpen(true) }}
    │     onDropCharge={(id) => { setSelectedChargeId(id); setDropChargeOpen(true) }}
    │     onViewSentence={(id) => { setSelectedChargeId(id); setViewSentenceOpen(true) }}
    │   />
    ├── <CreateCourtCaseDrawer open={createCourtCaseOpen} caseId={caseId} ... />
    ├── <UpdateCourtCaseDrawer open={updateCourtCaseOpen} courtCase={courtCase} caseId={caseId} ... />
    ├── <AddChargeDrawer open={addChargeOpen} courtCaseId={courtCase.id} caseId={caseId} ... />
    ├── <UpdateChargeStatusDrawer open={updateChargeOpen} chargeId={selectedChargeId} ... />
    ├── <DropChargeDialog open={dropChargeOpen} chargeId={selectedChargeId} ... />
    └── <ViewSentenceDrawer open={viewSentenceOpen} chargeId={selectedChargeId} ... />
```

---

# 15. UI Implementation — Court Case Empty State

## 15.1 `CourtCaseEmptyState`

Inline (not a separate file — render within `LegalTab`):

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                    [Scale icon — 48px, muted]                      │
│                                                                    │
│                    No Court Case Linked                            │
│              (muted, base font, centred)                           │
│                                                                    │
│    This investigation case has not yet been linked to a court      │
│    case. A Legal Officer can create and link one.                  │
│              (foreground-muted, sm font, centred)                  │
│                                                                    │
│              [Create Court Case]  ← Primary button                 │
│              (PermissionGuard: legal:manage)                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Use the `EmptyState` shared component from `shared/components/display/EmptyState.tsx`. Pass:
- `icon`: `Scale` (from lucide-react) — the scales of justice icon
- `title`: `t('courtCase.empty.title')`
- `description`: `t('courtCase.empty.description')`
- `action`: a `PermissionGuard`-wrapped `Button` for `legal:manage`

---

# 16. UI Implementation — CourtCaseCard

## 16.1 `CourtCaseCard.tsx`

Client Component. Receives the full `CourtCase` object as a prop.

### 16.1.1 Layout

```
CourtCaseCard
──────────────────────────────────────────────────────────────────────
  Court Case                            [Edit Court Case button — PermissionGuard]
──────────────────────────────────────────────────────────────────────
 ┌── Primary Info (two-column grid) ──────────────────────────────────┐
 │  Court Case No.   CC-2026-0047          Status    [Active badge]   │
 │  Court            Federal High Court    Outcome   —               │
 │  Filed            14 Jan 2026           Charges   3               │
 └─────────────────────────────────────────────────────────────────────┘

 ┌── Key Personnel (three columns) ───────────────────────────────────┐
 │  Presiding Judge     Prosecutor          Defence Counsel           │
 │  Hon. Abebe Tadesse  Ato Daniel Girma    Ato Samuel Haile          │
 └─────────────────────────────────────────────────────────────────────┘

 ┌── Hearing Dates ────────────────────────────────────────────────────┐
 │  <HearingDatesList hearingDates={courtCase.hearingDates} />        │
 └─────────────────────────────────────────────────────────────────────┘

 ┌── Notes ────────────────────────────────────────────────────────────┐
 │  ...notes text if present, muted if absent...                      │
 └─────────────────────────────────────────────────────────────────────┘
```

### 16.1.2 Status badge variant mapping

```typescript
const COURT_CASE_STATUS_VARIANTS: Record<CourtCaseStatus, BadgeVariant> = {
  PENDING:    'muted',       // Slate — not yet active
  ACTIVE:     'warning',     // Amber — proceedings in progress
  CONCLUDED:  'success',     // Green — concluded
  DISMISSED:  'destructive', // Red — dismissed
}
```

### 16.1.3 Edit button

```tsx
<PermissionGuard permission={Permission.LEGAL_MANAGE}>
  <Button variant="outline" size="sm" onClick={onEdit}>
    <Pencil className="mr-2 h-3.5 w-3.5" />
    {t('courtCase.card.editButton')}
  </Button>
</PermissionGuard>
```

`Permission.LEGAL_MANAGE` is the existing permission enum constant from `shared/permissions`. Use the constant — never hardcode the string.

---

# 17. UI Implementation — HearingDatesList

## 17.1 `HearingDatesList.tsx`

Client Component. Renders all hearing dates as a compact chronological list.

### 17.1.1 Layout (each hearing date)

```
┌──────────────────────────────────────────────────────────────┐
│  [Calendar icon]  Preliminary Hearing                         │
│                   14 Mar 2026 — Courtroom 4, Lideta Courts   │
│                   (notes if present, muted)                  │
│                   (outcome if present, amber italic)         │
└──────────────────────────────────────────────────────────────┘
```

Sort hearing dates ascending by `date` (oldest first). If `hearingDates` is empty: render `t('courtCase.card.noNextHearing')` in muted text.

Upcoming hearings (date in the future) render with a subtle `primary` left-border accent. Past hearings render without the accent. Use `date-fns/isFuture` to determine this.

---

# 18. UI Implementation — CreateCourtCaseDrawer

## 18.1 `CreateCourtCaseDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 18.1.1 Layout

```
CreateCourtCaseDrawer (480px)
──────────────────────────────────────────────
  Create Court Case
  Link this investigation case to court proceedings.
──────────────────────────────────────────────
 ┌── Section 1: Court Details ─────────────────┐
 │  Court Name *         [Input]               │
 │  Date Filed *         [DatePicker]          │
 └─────────────────────────────────────────────┘

 ┌── Section 2: Key Personnel ─────────────────┐
 │  Presiding Judge      [Input, optional]     │
 │  Prosecutor           [Input, optional]     │
 │  Defence Counsel      [Input, optional]     │
 └─────────────────────────────────────────────┘

 ┌── Section 3: Hearing Dates ─────────────────┐
 │  [+ Add Hearing Date]                       │
 │                                             │
 │  ┌─ Hearing 1 ──────────────────────────┐  │
 │  │  Date *      [DatePicker]            │  │
 │  │  Type *      [Select]                │  │
 │  │  Location *  [Input]                 │  │
 │  │  Notes       [Input, optional]       │  │
 │  │  [Remove]                            │  │
 │  └──────────────────────────────────────┘  │
 └─────────────────────────────────────────────┘

 ┌── Section 4: Notes ────────────────────────┐
 │  Notes          [Textarea, optional]       │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                  [Create Court Case]
```

### 18.1.2 Hearing Dates — Dynamic Field Array

Use `useFieldArray` from React Hook Form to manage the `hearingDates` array:

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'hearingDates',
})
```

"Add Hearing Date" button appends a blank hearing object. Each hearing entry renders in a card with a remove button. Maximum 20 hearing dates.

### 18.1.3 Submit logic

```typescript
const onSubmit = async (values: CreateCourtCaseValues) => {
  await createCourtCaseMutation.mutateAsync(values)
  onClose()
  form.reset()
}
```

Dirty state guard: if `formState.isDirty` and the officer closes the drawer, show `ConfirmDialog`: "Discard changes? The court case will not be created."

---

# 19. UI Implementation — UpdateCourtCaseDrawer

## 19.1 `UpdateCourtCaseDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

Pre-populate all fields with the current `CourtCase` data using `defaultValues` in `useForm`. The update form mirrors the create form in structure, with two additions:

1. **Status field** — `Select` showing `CourtCaseStatus` values, labelled via `t('courtCase.status.*')`
2. **Outcome field** — `Select` showing `CourtCaseOutcome` values, labelled via `t('courtCase.outcome.*')`. Conditionally required: show a `(Required when Concluded)` hint and validate at schema level.

The Outcome select is always rendered (not conditionally shown), but the Zod schema validation rejects submission when `status === CONCLUDED && !outcome`.

Uses `useUpdateCourtCase(courtCase.id, caseId)`. On success: drawer closes, toast confirms.

---

# 20. UI Implementation — ChargesTable

## 20.1 `ChargesTable.tsx`

Client Component. Manages filter state (URL-driven) and delegates row action events upward to `LegalTab`.

### 20.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  chargeSearch: parseAsString.withDefault(''),
  chargeStatus: parseAsArrayOf(parseAsString).withDefault([]),
  chargePage: parseAsInteger.withDefault(1),
  chargePageSize: parseAsInteger.withDefault(25),
  chargeSortField: parseAsString.withDefault('filedAt'),
  chargeSortDirection: parseAsString.withDefault('desc'),
})
```

> Use a unique URL param prefix (`charge*`) to avoid collisions with any other filter state on the same page.

### 20.1.2 PageHeader

```tsx
<SectionHeader
  title={t('charges.sectionTitle')}
  description={`${data?.total ?? 0} ${t('charges.entityCount', { count: data?.total ?? 0 })}`}
  actions={
    <PermissionGuard permission={Permission.LEGAL_MANAGE}>
      <Button onClick={onAddCharge} size="sm">
        <Plus className="mr-2 h-3.5 w-3.5" />
        {t('charges.addChargeButton')}
      </Button>
    </PermissionGuard>
  }
/>
```

Use `SectionHeader` (not `PageHeader`) — the charges table is a section within the legal tab page, not a top-level page.

### 20.1.3 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `suspect` | `firstName lastName` (plain text) | No | 150px |
| `crimeType` | `crimeType.name` (plain text) | No | 150px |
| `status` | `ChargeStatusBadge` (see §20.1.4) | Yes | 110px |
| `filedAt` | `dd MMM yyyy` | Yes | 100px |
| `sentence` | Sentence indicator chip (see §20.1.5) | No | 100px |
| `actions` | Kebab menu | No | 48px |

**Row click behaviour:** Clicking any row (not the kebab) opens `UpdateChargeStatusDrawer` for non-terminal charges, or `ViewSentenceDrawer` for terminal `CONVICTED` charges.

**Kebab actions** (rendered conditionally per charge state):
- `t('charges.rowActions.updateStatus')` — rendered when charge is NOT terminal (`isChargeTerminal(charge.status) === false`); guarded by `legal:manage`
- `t('charges.rowActions.viewSentence')` — rendered when `charge.status === CONVICTED`; no permission guard (read action)
- Separator (rendered when both above are visible)
- `t('charges.rowActions.dropCharge')` — rendered when charge is NOT terminal; destructive (red label, `Trash2` icon); guarded by `legal:manage`

### 20.1.4 Charge Status Badge Variant

```typescript
const CHARGE_STATUS_VARIANTS: Record<ChargeStatus, BadgeVariant> = {
  FILED:      'primary',       // Blue — filed
  ACTIVE:     'warning',       // Amber — in active proceedings
  CONVICTED:  'destructive',   // Red — convicted
  ACQUITTED:  'success',       // Green — acquitted
  DROPPED:    'muted',         // Slate — dropped
}
```

### 20.1.5 Sentence Indicator Chip

For the `sentence` column:

- `CONVICTED` + `hasSentence === true`: render a small `success` badge — `t('charges.sentenceIndicator.recorded')` with a `CheckCircle2` icon (12px)
- `CONVICTED` + `hasSentence === false`: render a `warning` badge — `t('charges.sentenceIndicator.pending')` with a `Clock` icon (12px)
- All other statuses: render `—` in muted text

### 20.1.6 Empty state

Two variants:
- No charges, no filters active: `EmptyState` with title `t('charges.empty.title')`, description `t('charges.empty.description')`, and a CTA `t('charges.empty.cta')` as a text hint (not a button — the Add Charge button in the header serves as the CTA)
- Filters active but no results: `TableEmptyState` with `t('charges.emptyFiltered')` (no CTA)

---

# 21. UI Implementation — AddChargeDrawer

## 21.1 `AddChargeDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px).

### 21.1.1 Layout

```
AddChargeDrawer (480px)
──────────────────────────────────────────────
  Add Charge
  File a new charge in this court case.
──────────────────────────────────────────────
 ┌── Section 1: Charge Details ───────────────┐
 │  Suspect *        [SearchableSelect]        │
 │  (hint: suspects linked to this case only) │
 │                                            │
 │  Crime Type *     [SearchableSelect]       │
 │                                            │
 │  Notes            [Textarea, optional]     │
 └────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                       [File Charge]
```

### 21.1.2 Suspect SearchableSelect

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

If the case has no suspects, render an inline empty state inside the dropdown: "No suspects are linked to this case. Add suspects from the Personnel module first." — and disable the submit button with a tooltip.

### 21.1.3 Crime Type SearchableSelect

```typescript
const searchCrimeTypes = async (searchTerm: string): Promise<SelectOption[]> => {
  // Use the existing reference data endpoint
  const crimeTypes = await getCrimeTypes({ search: searchTerm })
  return crimeTypes.map((ct) => ({ value: ct.id, label: ct.name }))
}
```

`getCrimeTypes` is already implemented in the admin/reference data service (Phase 1 foundation). Import from `@services/domain/admin.service`.

### 21.1.4 Submit logic

```typescript
const onSubmit = async (values: CreateChargeValues) => {
  await createChargeMutation.mutateAsync(values)
  onClose()
  form.reset()
}
```

On mutation error: drawer stays open; toast shown by hook.

---

# 22. UI Implementation — UpdateChargeStatusDrawer

## 22.1 `UpdateChargeStatusDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). This is the most complex drawer in the legal module.

### 22.1.1 Data fetching

The drawer receives `chargeId`, `courtCaseId`, and `caseId` as props. It fetches the charge detail from the list cache — find by ID from `useChargeList` data already in cache. If the charge needs a dedicated detail endpoint, add `useChargeDetail(chargeId)` fetching from `GET /api/v1/charges/{chargeId}`.

### 22.1.2 Layout — Non-terminal charge

```
UpdateChargeStatusDrawer (480px)
──────────────────────────────────────────────
  Update Charge Status
  Change the status of this charge.
──────────────────────────────────────────────
 ┌── Current Status ───────────────────────────┐
 │  Status: [Filed badge]                      │
 │  Suspect: John Bekele                       │
 │  Crime: Robbery with Violence               │
 └─────────────────────────────────────────────┘

 ┌── Update Status ─────────────────────────────┐
 │  New Status *   [Select — available options] │
 └─────────────────────────────────────────────┘

 ┌── Record Conviction (appears only when CONVICTED is selected) ────┐
 │  [Amber notice bar — see §22.1.3]                                │
 │                                                                  │
 │  Sentence Type *    [Select]                                     │
 │  Duration (months)  [Input, conditional]                         │
 │  Fine Amount (ETB)  [Input, conditional]                         │
 │  Sentence Date *    [DatePicker]                                 │
 │  Issued By Judge    [Input, optional]                            │
 │  Notes              [Textarea, optional]                         │
 └──────────────────────────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]              [Record Conviction & Sentence] or [Update Status]
```

### 22.1.3 Conviction flow inline

The `UpdateChargeStatusDrawer` handles two distinct flows depending on which status is selected:

**Non-CONVICTED selection** (e.g. ACTIVE, ACQUITTED):
- Submit button label: `t('charges.update.submitButton')` ("Update Status")
- On submit: calls `useUpdateCharge` mutation with `{ status }` payload

**CONVICTED selection**:
- The sentencing fields section expands (animate with `max-height` expand, 150ms ease-out)
- Display the amber conviction notice bar:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠  Recording a sentence will permanently set this charge to       │
│     Convicted. This cannot be reversed.                            │
└─────────────────────────────────────────────────────────────────────┘
```

Style: `background: rgba(245, 158, 11, 0.08)`, `border: 1px solid var(--color-warning)`, `border-radius: var(--radius-sm)`, `padding: 8px 12px`. `AlertTriangle` icon (14px, warning colour).

- Submit button label changes to: `t('charges.update.convictButton')` ("Record Conviction & Sentence")
- On submit: calls `useRecordSentence` mutation (NOT `useUpdateCharge`) — `recordSentence` sets the status to CONVICTED and records the sentence in one atomic backend operation
- The `updateChargeStatusSchema` is used for the status field; the `recordSentenceSchema` is used for the sentence fields; combine them using `z.object({}).merge()` or validate conditionally

### 22.1.4 Available status options in the Select

Use `getAvailableChargeStatuses(charge.status)` from `chargeUtils.ts` to populate the options. This function returns `[]` for terminal statuses. Always include `CONVICTED` as a separate option in the UI, below the regular options, separated by a divider — it triggers the sentencing section, not the regular status update flow.

```tsx
// In the Select options:
[
  ...getAvailableChargeStatuses(charge.status).map(status => ({
    value: status,
    label: t(`charges.status.${status}`),
  })),
  { type: 'separator' },
  {
    value: ChargeStatus.CONVICTED,
    label: t(`charges.status.CONVICTED`),
    // Render with a subtle red label to communicate significance
    className: 'text-destructive',
  },
]
```

### 22.1.5 Terminal charge state

If `isChargeTerminal(charge.status) === true`:

```
UpdateChargeStatusDrawer (480px)
──────────────────────────────────────────────
  Update Charge Status
──────────────────────────────────────────────
 ┌── Terminal Notice ───────────────────────────┐
 │  [Lock icon]  This charge has reached a      │
 │  final status and cannot be changed.         │
 │  Status: [CONVICTED badge]                  │
 └─────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Close]
```

No form fields are rendered. The drawer is read-only. The "Update Status" button in the kebab should not open this drawer for terminal charges — instead, for `CONVICTED` it opens `ViewSentenceDrawer`. The `onUpdateStatus` callback in `LegalTab` should guard against terminal statuses before opening this drawer.

---

# 23. UI Implementation — DropChargeDialog

## 23.1 `DropChargeDialog.tsx`

Thin wrapper around the existing `DestructiveConfirmDialog` shared component.

```tsx
<DestructiveConfirmDialog
  open={open}
  onClose={onClose}
  title={t('charges.drop.confirmTitle')}
  description={t('charges.drop.confirmDescription', {
    suspectName: `${charge.suspect.firstName} ${charge.suspect.lastName}`,
    crimeType: charge.crimeType.name,
  })}
  confirmLabel={t('charges.drop.confirmButton')}
  cancelLabel={t('charges.drop.cancelButton')}
  onConfirm={async () => {
    await dropChargeMutation.mutateAsync()
    onClose()
  }}
  isLoading={dropChargeMutation.isPending}
  error={dropChargeMutation.isError ? t('charges.update.errorMessage') : undefined}
/>
```

No confirm phrase required (blueprint pattern: confirm phrase is optional, used for "highest-consequence actions such as case deletion"). Dropping a charge is serious but not as irreversible as case deletion.

---

# 24. UI Implementation — ViewSentenceDrawer

## 24.1 `ViewSentenceDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Read-only.

### 24.1.1 Immutability indicator

Immediately below the drawer title, render the immutability notice bar (same pattern as `InterrogationDetailDrawer`):

```
┌────────────────────────────────────────────────────────────────────┐
│  🔒  This sentence record is permanent and cannot be modified.     │
└────────────────────────────────────────────────────────────────────┘
```

### 24.1.2 Layout

```
ViewSentenceDrawer (480px)
──────────────────────────────────────────────
  Sentence Details               🔒
  [Immutability notice bar]
──────────────────────────────────────────────
 ┌── Charge Context ───────────────────────────┐
 │  Suspect    John Bekele                     │
 │  Charge     Robbery with Violence           │
 │  Status     [Convicted badge]               │
 └─────────────────────────────────────────────┘

 ┌── Sentence Details ─────────────────────────┐
 │  Type        Imprisonment                   │
 │  Duration    5 years (60 months)            │
 │  Fine        —                              │
 │  Sentenced   14 Jun 2026                    │
 │  By Judge    Hon. Abebe Tadesse             │
 └─────────────────────────────────────────────┘

 ┌── Notes ────────────────────────────────────┐
 │  ...sentence notes text...                 │
 └─────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Close]
```

Duration rendering: use `formatDurationMonths(sentence.durationMonths)` from `chargeUtils.ts`. If `durationMonths === null`, render `—`.

Fine rendering: use `formatFineAmount(sentence.fineAmountETB)` from `chargeUtils.ts`. If `fineAmountETB === null`, render `—`.

The `Sentence` object is passed as a prop. If the charge is `CONVICTED` but `sentence === null` (sentence not yet recorded — edge case), show a `warning` state instead: "Sentence details have not been recorded yet."

---

# 25. UI Implementation — Court Cases List Page

## 25.1 `CourtCasesList.tsx`

Client Component. Full list page for `/legal/court-cases`.

### 25.1.1 Filter state

```typescript
const [filters, setFilters] = useQueryStates({
  search: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(25),
  sortField: parseAsString.withDefault('filedAt'),
  sortDirection: parseAsString.withDefault('desc'),
})
```

### 25.1.2 PageHeader

```tsx
<PageHeader
  title={t('courtCasesList.pageTitle')}
  description={`${data?.total ?? 0} ${t('courtCasesList.entityCount', { count: data?.total ?? 0 })}`}
/>
```

No "New Court Case" button — court cases are created from within individual case files (legal tab), not from this global list.

### 25.1.3 DataTable Column Definitions

| Column Key | Renderer | Sortable | Min Width |
|---|---|---|---|
| `courtCaseNumber` | Monospace, `xs` | Yes | 120px |
| `investigationCaseTitle` | Plain text, truncated | No | 200px |
| `court` | Plain text, truncated | No | 160px |
| `status` | `CourtCaseStatusBadge` | Yes | 110px |
| `outcome` | `OutcomeBadge` or `—` | No | 110px |
| `filedAt` | `dd MMM yyyy` | Yes | 100px |
| `nextHearingDate` | `dd MMM yyyy` or `—` | No | 110px |
| `chargeCount` | Number | No | 80px |
| `actions` | Kebab menu | No | 48px |

**Row click behaviour:** Clicking a row navigates to the linked investigation case's legal tab: `router.push(\`/cases/${row.original.investigationCaseId}/legal\`)`.

**Kebab actions:**
- `t('courtCasesList.rowActions.viewCase')` → `router.push(\`/cases/${row.investigationCaseId}/legal\`)`

### 25.1.4 Court Case Status Badge Variant

Same as §16.1.2 (`CourtCaseCard`). Define in `chargeUtils.ts` and import from there.

### 25.1.5 Outcome Badge

When `outcome` is not null, render a `muted` variant badge with the outcome label from `t('courtCase.outcome.*')`. When null, render `—` in muted text.

---

# 26. Role-Based Access

## 26.1 Access control for the Legal Tab

The legal tab is visible but locked for non-legal roles (established in Phase 3's tab navigation). Phase 6 only needs to guard the content within the tab.

At the top of `LegalTab.tsx`, add:

```tsx
return (
  <PermissionGuard
    permission={Permission.LEGAL_READ}
    fallback={
      <ForbiddenState
        message={t('tab.lockedTooltip')}
      />
    }
  >
    {/* rest of the legal tab content */}
  </PermissionGuard>
)
```

## 26.2 Action guards

All mutative actions are guarded with `Permission.LEGAL_MANAGE`. `PermissionGuard` renders `null` (not a disabled button) for non-legal roles — the button is entirely absent, consistent with the blueprint's "Action not permitted by role → Button/menu item hidden entirely" policy.

## 26.3 Court Cases List page guard

The `/legal/court-cases` page route already has a middleware-level role check (legal_officer+) from Phase 1. No additional page-level guard is needed. However, the `PageHeader` should not show a "Create" button at any point on this page — court case creation is intentionally scoped to the case detail legal tab only.

---

# 27. `src/features/legal/index.ts`

Public barrel export:

```typescript
// Types
export * from './types/legal.types'

// Hooks
export {
  useCourtCaseByCase,
  useCourtCaseList,
  useCreateCourtCase,
  useUpdateCourtCase,
  useChargeList,
  useCreateCharge,
  useUpdateCharge,
  useDropCharge,
  useRecordSentence,
} from './hooks'

// Components (export only those consumed outside the module)
export { LegalTab } from './components/LegalTab'
export { CourtCasesList } from './components/CourtCasesList'

// Utils
export {
  CHARGE_STATUS_VARIANTS,
  COURT_CASE_STATUS_VARIANTS,
  isChargeTerminal,
  getAvailableChargeStatuses,
  formatDurationMonths,
  formatFineAmount,
} from './utils/chargeUtils'
```

---

# 28. Testing Requirements

## 28.1 Unit Tests — `chargeUtils.ts`

Create `src/features/legal/utils/chargeUtils.test.ts`:

- `isChargeTerminal('FILED')` → `false`
- `isChargeTerminal('ACTIVE')` → `false`
- `isChargeTerminal('CONVICTED')` → `true`
- `isChargeTerminal('ACQUITTED')` → `true`
- `isChargeTerminal('DROPPED')` → `true`
- `getAvailableChargeStatuses('CONVICTED')` → `[]`
- `getAvailableChargeStatuses('FILED')` → `['ACTIVE', 'ACQUITTED']`
- `getAvailableChargeStatuses('ACTIVE')` → `['ACQUITTED']`
- `formatDurationMonths(6)` → `"6 months"`
- `formatDurationMonths(12)` → `"1 year"`
- `formatDurationMonths(18)` → `"1 year, 6 months"`
- `formatDurationMonths(60)` → `"5 years"`
- `formatFineAmount(5000)` → `"5,000.00 ETB"`

## 28.2 Unit Tests — Zod Schemas

Create `src/features/legal/schemas/legal-schemas.test.ts`:

**`createCourtCaseSchema`:**
- Valid payload → no error
- Missing `court` → validation error on `court`
- Missing `filedAt` → validation error on `filedAt`
- Invalid `hearingDates[0].type` → validation error on `hearingDates[0].type`

**`recordSentenceSchema`:**
- `IMPRISONMENT` + `durationMonths: 60` → valid
- `IMPRISONMENT` + `durationMonths: null` → error on `durationMonths`
- `FINE` + `fineAmountETB: 5000` → valid
- `FINE` + `fineAmountETB: null` → error on `fineAmountETB`
- `DEATH_PENALTY` → valid with no duration or fine
- `LIFE_IMPRISONMENT` → valid with no duration or fine

**`updateCourtCaseSchema`:**
- `status: CONCLUDED` + `outcome: GUILTY` → valid
- `status: CONCLUDED` + `outcome: null` → validation error on `outcome`
- `status: ACTIVE` + no outcome → valid

## 28.3 Component Tests

Create `src/features/legal/components/ChargesTable.test.tsx`:
- Loading state renders skeleton rows
- Empty state renders when no charges and no filters
- Filtered empty state renders when filters active and no results
- "Add Charge" button is visible when `legal:manage` permission is present
- "Add Charge" button is absent when `legal:manage` permission is absent
- Terminal charge row: kebab menu does NOT show "Update Status" or "Drop Charge"
- `CONVICTED` charge row: kebab menu shows "View Sentence"
- Non-terminal charge row: kebab shows "Update Status" and "Drop Charge"

Create `src/features/legal/components/UpdateChargeStatusDrawer.test.tsx`:
- Terminal charge renders the lock/read-only state, not the status select
- Selecting CONVICTED reveals the sentencing fields section
- Selecting ACQUITTED does NOT reveal sentencing fields
- Form does not submit when CONVICTED is selected but sentencing fields are empty
- Submit button label changes to "Record Conviction & Sentence" when CONVICTED is selected

## 28.4 i18n Completeness

Extend the existing i18n completeness test to cover the `legal` namespace. All keys in `en/legal.json` must have corresponding keys in `am/legal.json`. Test runner: `pnpm test`.

---

# 29. Anti-Pattern Reference

The following patterns are strictly forbidden. The agent must not implement any of them.

**Terminal status violations:**
- Rendering "Update Status" in the kebab menu for a `CONVICTED`, `ACQUITTED`, or `DROPPED` charge
- Allowing `UpdateChargeStatusDrawer` to show a status select when `isChargeTerminal(charge.status) === true`
- Creating a mutation that can change a charge FROM `CONVICTED` to any other status
- Calling `useUpdateCharge` for a conviction — conviction is always via `useRecordSentence`
- Adding a delete button to any charge row — charges cannot be deleted from the frontend

**Sentence immutability violations:**
- Adding an edit button to `ViewSentenceDrawer` — sentences are permanent once recorded
- Calling `recordSentence` without the amber conviction notice visible to the officer
- Omitting the immutability notice bar from `ViewSentenceDrawer`

**Court case creation violations:**
- Adding a "Create Court Case" button to the `/legal/court-cases` list page — creation is scoped to the individual case's legal tab
- Showing the "Create Court Case" CTA when `courtCase !== null` — exactly one court case per investigation case
- Allowing `createCourtCase` to be called more than once for the same `caseId` — the backend enforces this, but the frontend must also hide the CTA once the court case is created

**Query invalidation violations:**
- Not invalidating `caseKeys.summary(caseId)` after `useCreateCharge` — the case overview tab charge count card will not update
- Not invalidating `legalKeys.courtCaseByCase(caseId)` after `useCreateCharge` — the `CourtCaseCard`'s charge count will not update
- Not invalidating `legalKeys.chargeList(courtCaseId)` after `useDropCharge` — the charge table will not reflect the dropped status
- Not invalidating `legalKeys.courtCaseByCase(caseId)` after `useUpdateCourtCase` — the `CourtCaseCard` will show stale data

**DataTable violations:**
- Using client-side filtering on the charges table — all filters must translate to API query parameters
- Not syncing filter params to URL — the `useQueryStates` (nuqs) pattern from Phase 4 and 5 must be applied identically. All charge list filters must survive page refresh.
- Using the same URL param names as other filter state on the page — use the `charge*` prefix to namespace charge filter params

**i18n violations:**
- Hardcoding charge status labels (e.g. `"Convicted"`) in components instead of `t('charges.status.CONVICTED')`
- Hardcoding court case status labels instead of `t('courtCase.status.*')`
- Hardcoding sentence type labels instead of `t('charges.sentenceType.*')`

**Optimistic update violations:**
- Adding optimistic updates for charge status changes — the blueprint explicitly prohibits optimistic updates for status transitions with legal significance
- Adding optimistic updates for `useDropCharge` — terminal state changes must be confirmed by the server

**Form field visibility violations:**
- Showing sentencing fields in `UpdateChargeStatusDrawer` when the selected status is NOT `CONVICTED`
- Leaving sentencing field values in the form state when the officer switches from CONVICTED to a different status — clear them on status change: `setValue('durationMonths', null)` etc.

**Sentence type conditional rendering violations:**
- Showing the `durationMonths` field for `FINE` sentence type
- Showing the `fineAmountETB` field for `IMPRISONMENT` sentence type
- Not clearing hidden conditional fields when sentence type changes

**Permission violations:**
- Hardcoding role strings (`'legal_officer'`) in guard components — use `Permission.*` constants only
- Skipping `PermissionGuard` on the "Add Charge" button — this guard is mandatory
- Using `RoleGuard` instead of `PermissionGuard` for the "Add Charge" and "Edit Court Case" actions — permission-based guards are required, not role-based

---

# 30. Final Verification Checklist

## 30.1 Legal Tab — Court Case Panel

- [ ] `/cases/[caseId]/legal` renders the real legal tab for `legal_officer` (not the Phase 3 skeleton)
- [ ] Empty state (no court case) renders with `Scale` icon, title, description, and "Create Court Case" button
- [ ] "Create Court Case" button is absent for roles without `legal:manage`
- [ ] "Create Court Case" button is absent once a court case is linked
- [ ] `CreateCourtCaseDrawer` opens and shows all sections
- [ ] Hearing date can be added and removed via field array in the drawer
- [ ] Submitting with missing required fields (court, filedAt) shows inline validation errors
- [ ] Successful creation: drawer closes, `CourtCaseCard` appears, toast confirms
- [ ] `CourtCaseCard` displays all metadata fields: court case number, court, status badge, outcome, filed date, charge count
- [ ] Status badge colours match `COURT_CASE_STATUS_VARIANTS` mapping
- [ ] `HearingDatesList` renders hearing dates chronologically, oldest first
- [ ] Upcoming hearings have a `primary` left-border accent
- [ ] Past hearings have no accent
- [ ] Empty hearing dates list renders the "No hearing scheduled" fallback
- [ ] "Edit Court Case" button is visible for `legal:manage`
- [ ] "Edit Court Case" button is absent for roles without `legal:manage`
- [ ] `UpdateCourtCaseDrawer` opens pre-populated with current court case data
- [ ] Selecting `CONCLUDED` status without an outcome shows validation error
- [ ] Successful update: drawer closes, `CourtCaseCard` refreshes, toast confirms

## 30.2 Legal Tab — Charges Table

- [ ] `ChargesTable` renders below `CourtCaseCard` when a court case exists
- [ ] Filter bar: search input updates `chargeSearch` URL param and refetches
- [ ] Status filter chips appear and can be dismissed
- [ ] Filter state survives page refresh (URL params persist)
- [ ] "Add Charge" button is visible for `legal:manage`
- [ ] "Add Charge" button is absent for non-`legal:manage` roles
- [ ] Loading skeleton renders on initial load
- [ ] Empty state (no charges, no filters) shows title, description, and text CTA
- [ ] Filtered empty state (no results) shows filtered empty message without CTA
- [ ] Charge rows render: suspect name, crime type, status badge, filed date
- [ ] `FILED` badge: blue (`primary`)
- [ ] `ACTIVE` badge: amber (`warning`)
- [ ] `CONVICTED` badge: red (`destructive`)
- [ ] `ACQUITTED` badge: green (`success`)
- [ ] `DROPPED` badge: slate (`muted`)
- [ ] Non-terminal charge kebab: shows "Update Status" and "Drop Charge"
- [ ] `CONVICTED` charge kebab: shows "View Sentence" only (no "Update Status", no "Drop Charge")
- [ ] `ACQUITTED` charge kebab: no actions (terminal — no update, no drop)
- [ ] `DROPPED` charge kebab: no actions (terminal)
- [ ] Sentence indicator: `CONVICTED` + `hasSentence === true` → green "Recorded" chip
- [ ] Sentence indicator: `CONVICTED` + `hasSentence === false` → amber "Pending" chip
- [ ] Sentence indicator: other statuses → `—`
- [ ] Pagination controls render and function correctly

## 30.3 Add Charge Drawer

- [ ] `AddChargeDrawer` opens and shows suspect and crime type selects
- [ ] Suspect search shows only suspects linked to this case
- [ ] If no suspects exist, dropdown shows the "No suspects" empty state
- [ ] Crime type `SearchableSelect` fetches from reference data endpoint
- [ ] Submitting with no suspect selected shows validation error
- [ ] Submitting with no crime type selected shows validation error
- [ ] On success: drawer closes, charges table refreshes, case overview charge count updates
- [ ] On error: drawer stays open, error toast shown

## 30.4 Update Charge Status Drawer

- [ ] `UpdateChargeStatusDrawer` opens for non-terminal charges showing the current status
- [ ] Status select shows available options based on `getAvailableChargeStatuses()`
- [ ] `CONVICTED` option is always shown, separated by a divider, with red label
- [ ] Selecting `CONVICTED` expands the sentencing fields section with amber notice bar
- [ ] Selecting any other status does NOT show sentencing fields
- [ ] Switching from `CONVICTED` to another status collapses sentencing fields and clears values
- [ ] `IMPRISONMENT` sentence type: `durationMonths` field is required and visible; `fineAmountETB` is hidden
- [ ] `FINE` sentence type: `fineAmountETB` field is required and visible; `durationMonths` is hidden
- [ ] `DEATH_PENALTY` sentence type: neither duration nor fine fields are shown
- [ ] `LIFE_IMPRISONMENT` sentence type: neither duration nor fine fields are shown
- [ ] Submit button label: "Update Status" for non-CONVICTED, "Record Conviction & Sentence" for CONVICTED
- [ ] Submitting CONVICTED without sentencing required fields shows inline errors
- [ ] On non-CONVICTED success: drawer closes, charge status badge updates in the table
- [ ] On CONVICTED success: drawer closes, charge badge becomes red CONVICTED, sentence indicator shows "Pending" (until sentence detail is separately confirmed)
- [ ] Terminal charge opens the drawer in read-only terminal state (no select, lock icon visible)

## 30.5 Drop Charge Dialog

- [ ] `DropChargeDialog` shows the suspect name and crime type in the description
- [ ] Confirm button is labelled "Drop Charge"
- [ ] Confirm button shows loading spinner during mutation
- [ ] On success: dialog closes, charge status badge becomes DROPPED in the table, toast confirms
- [ ] On error: dialog stays open, error shown inline

## 30.6 View Sentence Drawer

- [ ] `ViewSentenceDrawer` opens for CONVICTED charges with `hasSentence === true`
- [ ] Immutability notice bar is visible at the top of the drawer
- [ ] Lock icon is visible in the drawer header with tooltip
- [ ] No edit or delete buttons rendered anywhere in this drawer
- [ ] Duration renders as human-readable: "5 years" / "6 months" / "2 years, 3 months"
- [ ] Duration renders as `—` when `durationMonths === null`
- [ ] Fine amount renders as formatted currency: "5,000.00 ETB"
- [ ] Fine amount renders as `—` when `fineAmountETB === null`
- [ ] Judge name renders or falls back to "Not recorded"

## 30.7 Court Cases List Page

- [ ] `/legal/court-cases` renders the full DataTable (not the Phase 3 skeleton)
- [ ] Filter bar: search, status filter, date range all functional
- [ ] Row click navigates to `/cases/{investigationCaseId}/legal`
- [ ] Kebab "View Investigation Case" also navigates to the legal tab
- [ ] No "Create Court Case" button exists on this page
- [ ] Outcome column renders outcome badge for concluded cases and `—` for others
- [ ] `nextHearingDate` column renders the date or `—`
- [ ] Pagination controls function correctly

## 30.8 Case Overview Tab — Count Card

- [ ] After filing a charge: charge count card on the case overview tab increments
- [ ] After dropping a charge: charge count card reflects the updated total on next render

## 30.9 i18n

- [ ] All legal UI text is retrieved from message files (no hardcoded English)
- [ ] Switching to Amharic updates all text in the legal tab, court case card, all drawers, and the court cases list page
- [ ] i18n completeness test passes with zero missing keys in the `legal` namespace
- [ ] Charge status labels render in the selected locale
- [ ] Court case status and outcome labels render in the selected locale
- [ ] Sentence type labels render in the selected locale
- [ ] Hearing type labels render in the selected locale

## 30.10 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm test` — all legal module tests pass (unit tests for schemas, chargeUtils, component tests)
- [ ] `pnpm build` — production build succeeds without errors

---

*End of CCMS Phase 6 Instruction — Legal Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 7 will implement the Personnel module (person list, person detail, officer list, officer detail, role promotion drawers)*