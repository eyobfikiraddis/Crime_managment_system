# CCMS Frontend — Phase 11: Hardening & Feature Completion
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 10 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all key factories, App Shell, middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail (nine-tab navigation), case overview tab, case timeline tab (full audit with diff viewer, filter bar, custody gap detection, CSV export, print)
- **Evidence Module**: Evidence tab, upload drawer (Cloudinary three-step flow), chain of custody timeline, lightbox viewer
- **Arrests Module**: Arrests tab, create/update drawers
- **Interrogations Module**: Interrogations tab, create/read-only detail drawers
- **Legal Module**: Legal tab (court case panel + charges table), all charge/sentence drawers, court cases list page
- **Personnel Module**: Person list/detail (PII masking, role cards, promotion drawers), officer list/detail (management dialogs), create person/officer drawers
- **Departments & Admin Module**: Department list/detail, all department management drawers, locations/crime types admin pages, system health panel
- **Dashboards & Reports**: All four role-specific dashboards, all six report sub-pages, shared chart components
- **Audit System**: Full audit timeline (case, officer, person, global), diff viewer, custody gap detection, filter bar, CSV export, print view with CCMS letterhead
- **BulkActionBar scaffold**: Phase 1 created a `BulkActionBar` component scaffold in `shared/components/table/BulkActionBar.tsx`. It renders a bar above a DataTable when rows are selected, but no mutation logic is wired to it anywhere. The `DataTable` already has the optional checkbox column prop.
- **i18n completeness**: Passes for all prior namespaces

## 1.2 Phase 11 Objective

Phase 11 is the **Hardening and Feature Completion** phase. It delivers the deferred features referenced throughout Phases 6–10, plus structural improvements that make the system production-ready for a law enforcement operational environment.

**Phase 11 delivers seven sub-systems:**

1. **Bulk Operations** — Wire the existing `BulkActionBar` scaffold into real mutations for three high-value bulk actions: bulk case status update, bulk evidence export, and bulk charge drop. Each implements the required `ConfirmDialog` with affected-row count, role guards, and cache invalidation.

2. **Legal Module Enhancements** — Two deferred legal workflows: (a) Sentence editing — allow `admin+` to amend a recorded sentence before the case is closed; (b) Charge appeal workflow — allow `superadmin` to reverse a `CONVICTED` or `ACQUITTED` charge status via an explicit appeal record.

3. **Personnel Module Enhancements** — Person de-promotion UI — allow `admin+` to remove a `SUSPECT`, `VICTIM`, or `WITNESS` role designation from a person record via a `DestructiveConfirmDialog`. Previously this was backend-only.

4. **Offline Resilience** — Integrate `@tanstack/query-sync-storage-persister` to persist the React Query cache to `localStorage` across page refreshes. Officers using the system in environments with intermittent connectivity see stale data rather than loading states on reload. Strict rules on what data is and is not persisted.

5. **Performance Hardening** — Three targeted improvements: (a) Dynamic imports for heavy feature modules (Recharts charts, Lightbox, evidence gallery); (b) Next.js `<Image>` migration for all `<img>` tags used in evidence photo thumbnails; (c) `next/bundle-analyzer` integration to emit a static report on build.

6. **Accessibility Hardening** — Close the WCAG 2.1 AA gaps identified by the blueprint: skip-to-main link, focus restoration on modal/drawer close, `aria-live` regions for toast notifications, focus-trap verification for all modals, keyboard navigation in the command palette, and high-contrast mode compatibility for all status badges.

7. **Storybook Documentation** — Set up Storybook 8 and document every shared component in `src/shared/components/` with at least one story per component variant. Stories use the CCMS dark theme. No feature module components are documented in Storybook.

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**New packages to install:**

```bash
pnpm add @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
pnpm add @next/bundle-analyzer
pnpm add -D @storybook/nextjs @storybook/addon-essentials @storybook/addon-a11y storybook
```

**Bulk Operations:**
- Wire `BulkActionBar` into the cases DataTable (bulk status update)
- Wire `BulkActionBar` into the evidence DataTable (bulk CSV export of metadata)
- Wire `BulkActionBar` into the charges DataTable on the legal tab (bulk drop)
- New mutations: `useBulkUpdateCaseStatus`, `useBulkExportEvidence`, `useBulkDropCharges`
- New service functions: `bulkUpdateCaseStatus`, `bulkExportEvidence`, `bulkDropCharges`
- i18n keys for bulk actions in existing `cases.json`, `evidence.json`, `legal.json`

**Legal Module Enhancements:**
- `EditSentenceDrawer.tsx` — `SlideOverDrawer` allowing `admin+` to amend an existing sentence
- `AppealChargeDrawer.tsx` — `SlideOverDrawer` allowing `superadmin` to file an appeal record that reverts a terminal charge
- `useEditSentence(chargeId, courtCaseId, caseId)` — mutation
- `useAppealCharge(chargeId, courtCaseId, caseId)` — mutation
- Service functions: `editSentence`, `appealCharge`
- New types: `EditSentencePayload`, `AppealChargePayload`, `AppealRecord`
- i18n keys added to existing `legal.json`

**Personnel Module Enhancements:**
- `DemotePersonRoleDialog.tsx` — `DestructiveConfirmDialog` wrapper for removing a role
- `useDemotePersonRole(personId, role)` — mutation
- Service function: `demotePersonRole`
- i18n keys added to existing `personnel.json`

**Offline Resilience:**
- `src/services/query/persister.ts` — configures `createSyncStoragePersister` with `localStorage`
- Update `src/app/layout.tsx` (or `providers.tsx`) to wrap `QueryClientProvider` with `PersistQueryClientProvider`
- `PERSIST_WHITELIST` — constant array of query key prefixes that ARE persisted
- `PERSIST_BLACKLIST` — constant array of query key prefixes that are NOT persisted

**Performance Hardening:**
- `next.config.ts` — add `@next/bundle-analyzer` integration
- Dynamic imports for: `CcmsLineChart`, `CcmsBarChart`, `CcmsDonutChart`, `EvidenceLightbox`, `EvidenceGallery`
- Migrate all `<img>` tags in evidence thumbnails to `next/image`
- Add `images.remotePatterns` for Cloudinary in `next.config.ts`

**Accessibility Hardening:**
- `src/shared/components/layout/SkipToMain.tsx` — new component
- Add `SkipToMain` to `AppShell`
- Focus restoration utility: `src/shared/utils/focusUtils.ts`
- Apply focus restoration to all `SlideOverDrawer` and `ConfirmDialog` components on close
- Verify `aria-live="polite"` is on the toast notification region
- Add `@storybook/addon-a11y` to Storybook for automated a11y checks

**Storybook:**
- `.storybook/main.ts` — Storybook 8 config for Next.js App Router
- `.storybook/preview.ts` — global decorators (dark theme, i18n, React Query)
- Stories for every component in `src/shared/components/`

## 1.5 What Must NOT Be Implemented

- **Any test files** — No unit tests, no integration tests, no E2E tests, no Storybook interaction tests, no a11y test scripts. Storybook stories are documentation only.
- **Full offline mode / Service Worker** — `query-sync-storage-persister` gives stale-data resilience on reload. A full PWA with background sync is not in scope.
- **Bulk delete of cases, officers, or persons** — Bulk delete is not permitted for any entity in CCMS. Bulk drop charges is the only destructive bulk action.
- **Sentence deletion** — Even `superadmin` cannot delete a sentence record. `EditSentenceDrawer` is an amendment only; the original sentence values are preserved as an audit trail field.
- **Re-promoting a de-promoted person** — After de-promotion, the person can be re-promoted through the existing `PromoteTo*Drawer` flow. `DemotePersonRoleDialog` only handles the removal.
- **Multi-level appeal chains** — Each charge has at most one appeal record. A second appeal on the same charge is not supported in this phase.
- **Bundle-size budget enforcement in CI** — The analyzer report is generated on build; no automated size-budget gate is added.
- **React Server Component (RSC) migration** — All components remain Client Components per the existing architecture. No RSC migration in this phase.
- **MSW mocking** — Still deferred.

## 1.6 Handoff Standard

When Phase 11 finishes:
- The cases DataTable has working checkboxes; selecting rows shows `BulkActionBar`; the "Update Status" bulk action opens `BulkStatusUpdateDialog`; confirming sends `PATCH /api/v1/cases/bulk/status` and refreshes the list
- The evidence DataTable bulk export sends `GET /api/v1/cases/{caseId}/evidence/export?ids=...` and downloads a CSV
- The charges DataTable bulk drop opens `BulkDropChargesDialog`; confirming sends `POST /api/v1/charges/bulk/drop` and refreshes
- `EditSentenceDrawer` is accessible to `admin+` on the `ViewSentenceDrawer` via an "Amend Sentence" button; submitting amends the sentence and preserves the original in an audit entry
- `AppealChargeDrawer` is accessible to `superadmin` on the charge row kebab for `CONVICTED`/`ACQUITTED` charges; submitting creates an appeal record and reverts the charge status to `ACTIVE`
- `DemotePersonRoleDialog` is accessible to `admin+` on each role card on the person detail page; confirming removes the role and refreshes the person detail
- Page refresh after navigating to `/cases` shows stale list data immediately (from persisted cache) before the background refetch completes — no blank loading state
- `pnpm build:analyze` generates a bundle report at `.next/analyze/`
- All `<img>` tags in evidence thumbnails are replaced with `next/image`
- Storybook starts with `pnpm storybook`; all shared components have documented stories
- The "Skip to main content" link is visible on keyboard focus at the top of every page
- Modals and drawers return focus to the element that opened them on close
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds

---

# 2. New Dependencies

Install the following:

```bash
# Offline resilience
pnpm add @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

# Bundle analysis (dev dependency)
pnpm add -D @next/bundle-analyzer

# Storybook 8 (dev dependencies)
pnpm add -D storybook @storybook/nextjs @storybook/addon-essentials @storybook/addon-a11y
```

Verify existing dependencies are present:
```bash
pnpm why @tanstack/react-query        # Must be >=5.0.0
pnpm why next                         # Must be 14+
```

---

# 3. File & Directory Structure

```
src/
├── features/
│   ├── cases/
│   │   └── components/
│   │       ├── BulkStatusUpdateDialog.tsx       # New — bulk case status update confirm dialog
│   │       └── CasesList.tsx                    # UPDATE — wire BulkActionBar
│   ├── evidence/
│   │   └── components/
│   │       └── EvidenceTab.tsx                  # UPDATE — wire BulkActionBar (export)
│   └── legal/
│       └── components/
│           ├── EditSentenceDrawer.tsx           # New — amend recorded sentence (admin+)
│           ├── AppealChargeDrawer.tsx           # New — appeal terminal charge (superadmin)
│           ├── BulkDropChargesDialog.tsx        # New — bulk drop charges confirm dialog
│           ├── ChargesTable.tsx                 # UPDATE — wire BulkActionBar
│           └── ViewSentenceDrawer.tsx           # UPDATE — add "Amend Sentence" button
│   └── personnel/
│       └── components/
│           └── persons/
│               ├── DemotePersonRoleDialog.tsx   # New — remove a role from a person (admin+)
│               └── PersonRoleCards.tsx          # UPDATE — add "Remove Role" to each card

├── shared/
│   ├── components/
│   │   └── layout/
│   │       └── SkipToMain.tsx                  # New — skip-to-content link
│   └── utils/
│       └── focusUtils.ts                       # New — focus restoration helpers

├── services/
│   └── domain/
│       ├── cases.service.ts                    # UPDATE — add bulkUpdateCaseStatus
│       ├── evidence.service.ts                 # UPDATE — add bulkExportEvidence
│       └── legal.service.ts                    # UPDATE — add bulkDropCharges, editSentence, appealCharge
│   └── personnel.service.ts                    # UPDATE — add demotePersonRole
│   └── query/
│       └── persister.ts                        # New — query persistence config

├── app/
│   └── layout.tsx                              # UPDATE — wrap with PersistQueryClientProvider, add SkipToMain
└── next.config.ts                              # UPDATE — bundle analyzer + image domains

.storybook/
├── main.ts                                     # New — Storybook config
└── preview.ts                                  # New — global decorators

stories/
└── shared/
    └── (one .stories.tsx per shared component)
```

---

# 4. Bulk Operations

## 4.1 Architecture

The `BulkActionBar` shared component (Phase 1 scaffold at `src/shared/components/table/BulkActionBar.tsx`) renders above the DataTable when one or more rows are selected. It receives:

```typescript
interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  actions: BulkAction[]
}

interface BulkAction {
  label: string
  icon: LucideIcon
  variant?: 'default' | 'destructive'
  onClick: () => void
  requiredPermission?: Permission
  disabled?: boolean
  disabledTooltip?: string
}
```

The DataTable's checkbox column state is managed by the parent page component using `@tanstack/react-table`'s built-in `rowSelection` state. The selected row IDs are passed to the `BulkActionBar` as `selectedCount`, and the full `selectedIds` array is used in the mutation payload.

## 4.2 Bulk Case Status Update

### 4.2.1 New service function — `src/services/domain/cases.service.ts`

Add to the existing cases service:

```typescript
/**
 * PATCH /api/v1/cases/bulk/status
 * Updates the status of multiple cases in a single atomic operation.
 * Backend validates each case's current state machine eligibility.
 * Returns { updated: number, failed: number, errors: string[] }
 */
export async function bulkUpdateCaseStatus(payload: {
  caseIds: string[]
  status: CaseStatus
  reason?: string
}): Promise<BulkOperationResult> {
  const raw = await apiClient.patch('/api/v1/cases/bulk/status', payload)
  return bulkOperationResultSchema.parse(raw)
}
```

New shared type in `src/shared/types/bulk.types.ts`:

```typescript
export interface BulkOperationResult {
  updated: number
  failed: number
  errors: string[]   // Human-readable error messages for each failed item
}
```

New shared Zod schema in `src/shared/schemas/bulk.schema.ts`:

```typescript
import { z } from 'zod'

export const bulkOperationResultSchema = z.object({
  updated: z.number(),
  failed: z.number(),
  errors: z.array(z.string()),
})
```

### 4.2.2 New mutation hook — `useBulkUpdateCaseStatus.ts`

```typescript
// src/features/cases/hooks/useBulkUpdateCaseStatus.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkUpdateCaseStatus } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import type { CaseStatus } from '../types/cases.types'

export function useBulkUpdateCaseStatus() {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('cases')

  return useMutation({
    mutationFn: (payload: { caseIds: string[]; status: CaseStatus; reason?: string }) =>
      bulkUpdateCaseStatus(payload),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      if (result.failed > 0) {
        addToast({
          message: t('bulk.statusUpdate.partialSuccessMessage', {
            updated: result.updated,
            failed: result.failed,
          }),
          variant: 'warning',
        })
      } else {
        addToast({
          message: t('bulk.statusUpdate.successMessage', { count: result.updated }),
          variant: 'success',
        })
      }
    },
    onError: () => {
      addToast({ message: t('bulk.statusUpdate.errorMessage'), variant: 'error' })
    },
  })
}
```

### 4.2.3 `BulkStatusUpdateDialog.tsx`

Client Component. Wraps `ConfirmDialog` (non-destructive — status updates are reversible).

```
BulkStatusUpdateDialog
──────────────────────────────────────────────────────────────
  Update Status for {count} Cases

  New Status *   [Select — available statuses from state machine]

  Reason         [Input, optional]
  (hint: Reason is required when changing to ARCHIVED)

  [Cancel]                              [Update {count} Cases]
──────────────────────────────────────────────────────────────
```

The status select shows all valid `CaseStatus` values. The agent does not need to enforce individual case state machine transitions — the backend validates each case and returns partial errors in `BulkOperationResult.errors`. The UI shows a warning toast when `failed > 0`.

On submit: calls `useBulkUpdateCaseStatus`. On success: clears row selection, closes dialog, refreshes cases list, shows toast.

### 4.2.4 Wire into `CasesList.tsx`

In the cases list page component, enable the DataTable's checkbox column. Track `rowSelection` state. Render `BulkActionBar` when `Object.keys(rowSelection).length > 0`:

```tsx
{Object.keys(rowSelection).length > 0 && (
  <BulkActionBar
    selectedCount={Object.keys(rowSelection).length}
    onClearSelection={() => setRowSelection({})}
    actions={[
      {
        label: t('bulk.statusUpdate.actionLabel'),
        icon: RefreshCw,
        onClick: () => setBulkStatusOpen(true),
        requiredPermission: Permission.CASES_MANAGE,
      },
    ]}
  />
)}
```

## 4.3 Bulk Evidence Export

Evidence bulk export does NOT delete or mutate evidence records. It exports the metadata of selected evidence items as a CSV download. This is a safe read operation — no `ConfirmDialog` required.

### 4.3.1 New service function — `src/services/domain/evidence.service.ts`

```typescript
/**
 * GET /api/v1/cases/{caseId}/evidence/export?ids={id1,id2,...}&format=csv
 * Downloads selected evidence metadata as a CSV file.
 * PII fields are masked for roles below admin.
 */
export async function bulkExportEvidence(
  caseId: string,
  evidenceIds: string[],
): Promise<void> {
  const response = await axiosInstance.get(
    `/api/v1/cases/${caseId}/evidence/export?ids=${evidenceIds.join(',')}&format=csv`,
    { responseType: 'blob' },
  )
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ccms-evidence-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
```

### 4.3.2 New mutation hook — `useBulkExportEvidence.ts`

```typescript
// src/features/evidence/hooks/useBulkExportEvidence.ts
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkExportEvidence } from '@services/domain/evidence.service'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useBulkExportEvidence(caseId: string) {
  const { addToast } = useNotificationStore()
  const t = useTranslations('evidence')

  return useMutation({
    mutationFn: (ids: string[]) => bulkExportEvidence(caseId, ids),
    onSuccess: () => {
      addToast({ message: t('bulk.export.successMessage'), variant: 'success' })
    },
    onError: () => {
      addToast({ message: t('bulk.export.errorMessage'), variant: 'error' })
    },
  })
}
```

### 4.3.3 Wire into `EvidenceTab.tsx`

Enable the DataTable checkbox column in the evidence tab. When rows are selected, render `BulkActionBar` with the export action. The export fires immediately on click (no confirm dialog — it is a read operation):

```tsx
actions={[
  {
    label: t('evidence.bulk.export.actionLabel'),
    icon: Download,
    onClick: () => {
      void exportMutation.mutateAsync(selectedIds)
      setRowSelection({})
    },
    disabled: exportMutation.isPending,
    disabledTooltip: t('evidence.bulk.export.downloading'),
  },
]}
```

## 4.4 Bulk Drop Charges

### 4.4.1 Business rules

- Only non-terminal charges can be bulk-dropped. The selection validation must filter out `CONVICTED`, `ACQUITTED`, and already-`DROPPED` charges.
- If the officer selects a mix of terminal and non-terminal charges, the `BulkDropChargesDialog` shows a warning: "N of your selected charges are already at a final status and will be skipped."
- Bulk drop requires `Permission.LEGAL_MANAGE`.

### 4.4.2 New service function — `src/services/domain/legal.service.ts`

```typescript
/**
 * POST /api/v1/charges/bulk/drop
 * Sets multiple charges to DROPPED status. Skips terminal charges.
 * Returns BulkOperationResult.
 */
export async function bulkDropCharges(payload: {
  chargeIds: string[]
}): Promise<BulkOperationResult> {
  const raw = await apiClient.post('/api/v1/charges/bulk/drop', payload)
  return bulkOperationResultSchema.parse(raw)
}
```

### 4.4.3 New mutation hook — `useBulkDropCharges.ts`

```typescript
// src/features/legal/hooks/useBulkDropCharges.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { bulkDropCharges } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useBulkDropCharges(courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    mutationFn: (chargeIds: string[]) => bulkDropCharges({ chargeIds }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeList(courtCaseId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.courtCaseByCase(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      if (result.failed > 0) {
        addToast({
          message: t('charges.bulkDrop.partialSuccessMessage', {
            updated: result.updated,
            failed: result.failed,
          }),
          variant: 'warning',
        })
      } else {
        addToast({
          message: t('charges.bulkDrop.successMessage', { count: result.updated }),
          variant: 'success',
        })
      }
    },
    onError: () => {
      addToast({ message: t('charges.bulkDrop.errorMessage'), variant: 'error' })
    },
  })
}
```

### 4.4.4 `BulkDropChargesDialog.tsx`

```
BulkDropChargesDialog (DestructiveConfirmDialog)
──────────────────────────────────────────────────────────────
  Drop {droppableCount} Charges?

  [Warning notice if terminalCount > 0]:
  ⚠ {terminalCount} of your selected charges are already at a
     final status (Convicted/Acquitted/Dropped) and will be
     skipped. Only {droppableCount} charge(s) will be affected.

  The following charges will be permanently set to Dropped:
  · {charge.crimeType} — {charge.suspectName}   (× droppableCount)

  This action cannot be undone.

  [Cancel]                              [Drop {droppableCount} Charges]
──────────────────────────────────────────────────────────────
```

Uses `DestructiveConfirmDialog`. No confirm phrase (bulk drop is significant but not as severe as case deletion). The "Drop charges" button is disabled when `droppableCount === 0` (all selected are terminal).

### 4.4.5 Wire into `ChargesTable.tsx`

Enable the DataTable checkbox column. When non-terminal rows are selected, show `BulkActionBar`:

```tsx
const selectedCharges = selectedIds.map(id =>
  data?.data.find(c => c.id === id)
).filter(Boolean)
const terminalSelected = selectedCharges.filter(c => isChargeTerminal(c!.status))
const droppableSelected = selectedCharges.filter(c => !isChargeTerminal(c!.status))

actions={[
  {
    label: t('charges.bulkDrop.actionLabel'),
    icon: Trash2,
    variant: 'destructive',
    onClick: () => setBulkDropOpen(true),
    requiredPermission: Permission.LEGAL_MANAGE,
    disabled: droppableSelected.length === 0,
    disabledTooltip: t('charges.bulkDrop.allTerminalTooltip'),
  },
]}
```

---

# 5. Legal Module Enhancements

## 5.1 New Types — add to `src/features/legal/types/legal.types.ts`

```typescript
// ─── Edit Sentence Payload ────────────────────────────────────────────────────
export interface EditSentencePayload {
  sentenceType: SentenceType
  durationMonths?: number | null
  fineAmountETB?: number | null
  notes?: string | null
  issuedAt: string
  issuedByJudge?: string | null
  // Required for audit trail: reason for amendment
  amendmentReason: string
}

// ─── Appeal Record ────────────────────────────────────────────────────────────
export const AppealOutcome = {
  PENDING:   'PENDING',
  UPHELD:    'UPHELD',
  DISMISSED: 'DISMISSED',
} as const
export type AppealOutcome = (typeof AppealOutcome)[keyof typeof AppealOutcome]

export interface AppealRecord {
  id: string
  chargeId: string
  filedAt: string          // ISO 8601
  filedByOfficerId: string
  outcome: AppealOutcome
  outcomeDate: string | null
  notes: string | null
}

// ─── Appeal Charge Payload ────────────────────────────────────────────────────
export interface AppealChargePayload {
  notes?: string
}
```

## 5.2 New Zod Schemas — add to `src/features/legal/schemas/legal-api.schema.ts`

```typescript
export const appealRecordSchema = z.object({
  id: z.string().uuid(),
  chargeId: z.string().uuid(),
  filedAt: z.string(),
  filedByOfficerId: z.string().uuid(),
  outcome: z.nativeEnum(AppealOutcome),
  outcomeDate: z.string().nullable(),
  notes: z.string().nullable(),
})
```

## 5.3 New Service Functions — `src/services/domain/legal.service.ts`

```typescript
/**
 * PATCH /api/v1/charges/{chargeId}/sentence
 * Amends an existing sentence. Admin+ only.
 * The backend creates an audit entry preserving the original values.
 * Returns the updated Charge (with amended sentence).
 */
export async function editSentence(
  chargeId: string,
  payload: EditSentencePayload,
): Promise<Charge> {
  const raw = await apiClient.patch(
    `/api/v1/charges/${chargeId}/sentence`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}

/**
 * POST /api/v1/charges/{chargeId}/appeal
 * Files an appeal for a CONVICTED or ACQUITTED charge. Superadmin only.
 * Reverts the charge status to ACTIVE. Creates an AppealRecord.
 * Returns the updated Charge.
 */
export async function appealCharge(
  chargeId: string,
  payload: AppealChargePayload,
): Promise<Charge> {
  const raw = await apiClient.post(
    `/api/v1/charges/${chargeId}/appeal`,
    payload,
  )
  return chargeDetailSchema.parse(raw)
}
```

## 5.4 New Mutation Hooks

### 5.4.1 `useEditSentence.ts`

```typescript
// src/features/legal/hooks/useEditSentence.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { editSentence } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { EditSentencePayload } from '../types/legal.types'

export function useEditSentence(chargeId: string, courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    // No optimistic update — sentence amendment is security-sensitive and irreversible
    mutationFn: (payload: EditSentencePayload) => editSentence(chargeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeDetail(chargeId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeList(courtCaseId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.courtCaseByCase(caseId) })
      addToast({ message: t('charges.editSentence.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('charges.editSentence.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

### 5.4.2 `useAppealCharge.ts`

```typescript
// src/features/legal/hooks/useAppealCharge.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { appealCharge } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { caseKeys } from '@services/query/keys/caseKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { AppealChargePayload } from '../types/legal.types'

export function useAppealCharge(chargeId: string, courtCaseId: string, caseId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('legal')

  return useMutation({
    // No optimistic update — appeal is a legal reversal; must be server-confirmed
    mutationFn: (payload: AppealChargePayload) => appealCharge(chargeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeDetail(chargeId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.chargeList(courtCaseId) })
      void queryClient.invalidateQueries({ queryKey: legalKeys.courtCaseByCase(caseId) })
      void queryClient.invalidateQueries({ queryKey: caseKeys.summary(caseId) })
      addToast({ message: t('charges.appeal.successMessage'), variant: 'success' })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('charges.appeal.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 5.5 `EditSentenceDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Accessible to `admin+` only.

### 5.5.1 How it opens

In the updated `ViewSentenceDrawer.tsx`, add at the bottom of the drawer (inside `PermissionGuard permission={Permission.ADMIN_MANAGE}`):

```tsx
<div className="border-t border-border pt-4 mt-4">
  <PermissionGuard permission={Permission.ADMIN_MANAGE}>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setEditOpen(true)}
    >
      <Pencil className="mr-2 h-3.5 w-3.5" />
      {t('charges.editSentence.openButton')}
    </Button>
    <p className="text-xs text-foreground-muted mt-1">
      {t('charges.editSentence.openButtonHint')}
    </p>
  </PermissionGuard>
</div>
```

### 5.5.2 Layout

```
EditSentenceDrawer (480px)
──────────────────────────────────────────────────────────────
  Amend Sentence
  Amend the recorded sentence for this conviction.
──────────────────────────────────────────────────────────────
 ┌── Amendment Notice ─────────────────────────────────────────┐
 │  ⚠  Amending this sentence creates a permanent audit entry  │
 │     showing the original and amended values. The original   │
 │     values cannot be deleted.                               │
 └─────────────────────────────────────────────────────────────┘

 ┌── Sentence Details ─────────────────────────────────────────┐
 │  (Pre-populated with current sentence values)               │
 │  Sentence Type *    [Select]                                │
 │  Duration (months)  [Input, conditional]                    │
 │  Fine Amount (ETB)  [Input, conditional]                    │
 │  Sentence Date *    [DatePicker]                            │
 │  Issued By Judge    [Input, optional]                       │
 │  Notes              [Textarea, optional]                    │
 └─────────────────────────────────────────────────────────────┘

 ┌── Amendment Reason ─────────────────────────────────────────┐
 │  Reason for Amendment *  [Textarea, required]               │
 │  (This will appear in the audit trail)                      │
 └─────────────────────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]                    [Save Amendment]
```

Uses `recordSentenceSchema` extended with `amendmentReason`:

```typescript
const editSentenceSchema = recordSentenceSchema.extend({
  amendmentReason: z
    .string()
    .min(10, { message: 'Amendment reason must be at least 10 characters.' })
    .max(1000),
})
```

Dirty state guard: if `formState.isDirty`, prompt "Discard amendment? No changes will be saved."

On success: `EditSentenceDrawer` closes, `ViewSentenceDrawer` closes (the sentence has changed; the parent should re-fetch), `ChargesTable` refreshes.

## 5.6 `AppealChargeDrawer.tsx`

Client Component wrapping `SlideOverDrawer` (480px). Accessible to `superadmin` only.

### 5.6.1 How it opens

In the updated `ChargesTable.tsx`, add to the CONVICTED/ACQUITTED charge row kebab menu (after "View Sentence"):

```tsx
// Only for SUPERADMIN
<PermissionGuard permission={Permission.SUPERADMIN_ONLY}>
  <DropdownMenuSeparator />
  <DropdownMenuItem
    onClick={() => { setSelectedChargeId(charge.id); setAppealOpen(true) }}
    className="text-warning"
  >
    <AlertTriangle className="mr-2 h-4 w-4" />
    {t('charges.appeal.kebabLabel')}
  </DropdownMenuItem>
</PermissionGuard>
```

### 5.6.2 Layout

```
AppealChargeDrawer (480px)
──────────────────────────────────────────────────────────────
  File Appeal
  Reverse this terminal charge via an appeal record.
──────────────────────────────────────────────────────────────
 ┌── Charge Context ────────────────────────────────────────────┐
 │  Suspect    John Bekele                                     │
 │  Charge     Robbery with Violence                           │
 │  Status     [Convicted badge]                               │
 └─────────────────────────────────────────────────────────────┘

 ┌── Appeal Consequences Notice ───────────────────────────────┐
 │  ⚠  Filing this appeal will:                               │
 │     · Revert the charge status from {status} → ACTIVE      │
 │     · Create a permanent appeal record in the audit trail   │
 │     · Remove the existing sentence record (if any)         │
 │                                                             │
 │  This action is logged and cannot be reversed without       │
 │  filing another appeal.                                     │
 └─────────────────────────────────────────────────────────────┘

 ┌── Appeal Details ───────────────────────────────────────────┐
 │  Notes (optional)   [Textarea]                              │
 └─────────────────────────────────────────────────────────────┘

 ────────────────────────────────────────────
 [Cancel]              [Confirm Appeal — Revert to Active]
```

The consequence notice amber bar uses the same styling as the conviction notice bar from Phase 6.

On success: drawer closes, charge status badge in the table reverts to ACTIVE (amber), sentence indicator clears, toast confirms.

---

# 6. Personnel Module Enhancement — Person De-Promotion

## 6.1 Business Rules

- De-promotion removes a specific role (`SUSPECT`, `VICTIM`, or `WITNESS`) from a person.
- A person can be re-promoted to the same role after de-promotion via the existing `PromoteTo*Drawer` flow.
- De-promotion is only available when the person has **no active case associations** in that role, OR the admin explicitly acknowledges the warning. The backend enforces the final check; the frontend shows the warning.
- De-promotion requires `Permission.ADMIN_MANAGE`.
- The padlock icon on the role card in Phase 7 indicated permanence — this is removed in Phase 11 for `admin+` roles who can now see a "Remove Role" button.

## 6.2 New Service Function — `src/services/domain/personnel.service.ts`

```typescript
/**
 * DELETE /api/v1/personnel/persons/{personId}/roles/{role}
 * Removes a specific role designation from a person. Admin+ only.
 * Returns the updated Person.
 */
export async function demotePersonRole(
  personId: string,
  role: PersonRole,
): Promise<Person> {
  const raw = await apiClient.delete(
    `/api/v1/personnel/persons/${personId}/roles/${role}`,
  )
  return personDetailSchema.parse(raw)
}
```

## 6.3 New Mutation Hook — `useDemotePersonRole.ts`

```typescript
// src/features/personnel/hooks/useDemotePersonRole.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { demotePersonRole } from '@services/domain/personnel.service'
import { personnelKeys } from '@services/query/keys/personnelKeys'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { PersonRole } from '../types/personnel.types'

export function useDemotePersonRole(personId: string) {
  const queryClient = useQueryClient()
  const { addToast } = useNotificationStore()
  const t = useTranslations('personnel')

  return useMutation({
    // No optimistic update — role removal affects active case associations server-side
    mutationFn: (role: PersonRole) => demotePersonRole(personId, role),
    onSuccess: (_, role) => {
      void queryClient.invalidateQueries({ queryKey: personnelKeys.person(personId) })
      void queryClient.invalidateQueries({ queryKey: personnelKeys.personList() })
      addToast({
        message: t('persons.demoteRole.successMessage', { role }),
        variant: 'success',
      })
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError ? err.message : t('persons.demoteRole.errorMessage')
      addToast({ message, variant: 'error' })
    },
  })
}
```

## 6.4 `DemotePersonRoleDialog.tsx`

Wraps `DestructiveConfirmDialog`.

```typescript
interface DemotePersonRoleDialogProps {
  open: boolean
  onClose: () => void
  personId: string
  personName: string
  role: PersonRole
  activeCaseCount: number   // Number of active cases this person has in this role
}
```

```
DemotePersonRoleDialog
──────────────────────────────────────────────────────────────
  Remove {roleName} designation from {personName}?

  [If activeCaseCount > 0]:
  ⚠ This person is linked to {activeCaseCount} active case(s)
     as {roleName}. Removing this role does not unlink them
     from those cases. Contact the case lead to update case
     records manually.

  This person will no longer appear as {roleName} in new
  case assignments. This action is logged.

  [Cancel]                     [Remove {roleName} Designation]
──────────────────────────────────────────────────────────────
```

Uses `DestructiveConfirmDialog`. No confirm phrase — de-promotion is less severe than case deletion.

## 6.5 Update `PersonRoleCards.tsx`

For `admin+`, each role card gains a "Remove Role" button in its footer:

```tsx
// At the bottom of each rendered role card, inside PermissionGuard ADMIN_MANAGE:
<PermissionGuard permission={Permission.ADMIN_MANAGE}>
  <div className="mt-3 pt-3 border-t border-border">
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
      onClick={() => {
        setDemoteRole(PersonRole.SUSPECT)  // or VICTIM / WITNESS
        setDemoteOpen(true)
      }}
    >
      <Trash2 className="mr-1.5 h-3 w-3" />
      {t('persons.demoteRole.buttonLabel')}
    </Button>
  </div>
</PermissionGuard>
```

The "Remove Role" button is absent for roles without `ADMIN_MANAGE`. For such roles, the role card remains read-only with no footer.

Mount `DemotePersonRoleDialog` at the bottom of `PersonDetail.tsx` alongside the promotion drawers.

---

# 7. Offline Resilience

## 7.1 What is Persisted

Only stable, non-sensitive reference data is persisted. Security-sensitive and PII-bearing data is never persisted in `localStorage`.

```typescript
// src/services/query/persister.ts

// Query key prefixes whose data IS persisted across page reloads.
// The persister uses partial-key matching — any query key starting with one of these
// prefix arrays will be included.
export const PERSIST_WHITELIST = [
  // Reference data (changes rarely)
  ['departments'],
  ['crimeTypes'],
  ['locations'],
  // Case lists (gives immediate stale list before refetch)
  ['cases', 'list'],
  // Court case lists
  ['courtCases', 'list'],
] as const

// Query key prefixes that MUST NOT be persisted.
// These take precedence over PERSIST_WHITELIST (deny wins).
export const PERSIST_BLACKLIST = [
  // PII-bearing data
  ['persons'],                    // Contains masked PII; masking is server-side per role
  ['officers'],                   // Contains last activity timestamps; live only
  // Security-sensitive
  ['audit'],                      // Audit entries must always come from the server
  // High-frequency polling data
  ['dashboard'],                  // Dashboard data is role-scoped and time-sensitive
  ['health'],                     // System health must be live
  // Case detail (too large and stale-sensitive)
  ['cases', 'detail'],
] as const
```

## 7.2 Persister Configuration — `src/services/query/persister.ts`

```typescript
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PERSIST_WHITELIST, PERSIST_BLACKLIST } from './persister'

// Check if a given query key should be persisted.
// Deny-wins: if ANY blacklist prefix matches, do not persist.
// Then: if ANY whitelist prefix matches, persist.
function shouldPersist(queryKey: readonly unknown[]): boolean {
  const keyAsStrings = queryKey.map(String)

  // Check blacklist first (deny-wins)
  for (const blacklistKey of PERSIST_BLACKLIST) {
    const matches = blacklistKey.every((part, i) => keyAsStrings[i] === String(part))
    if (matches) return false
  }

  // Check whitelist
  for (const whitelistKey of PERSIST_WHITELIST) {
    const matches = whitelistKey.every((part, i) => keyAsStrings[i] === String(part))
    if (matches) return true
  }

  return false
}

export const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'ccms-query-cache',
  // Only serialise queries that pass the whitelist/blacklist check
  serialize: (client) => {
    const filtered = {
      ...client,
      queries: client.queries.filter((q) =>
        shouldPersist(q.queryKey as readonly unknown[]),
      ),
      mutations: [],   // Never persist mutations
    }
    return JSON.stringify(filtered)
  },
})
```

## 7.3 Update `src/app/layout.tsx` (or `src/shared/providers/QueryProvider.tsx`)

Replace `QueryClientProvider` with `PersistQueryClientProvider`:

```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { localStoragePersister } from '@services/query/persister'
import { queryClient } from '@services/query/queryClient'

// In the providers component:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000,     // 24 hours max cache age
    buster: process.env.NEXT_PUBLIC_BUILD_ID ?? '',  // Cache-bust on new deployments
  }}
>
  {children}
</PersistQueryClientProvider>
```

### 7.3.1 Build ID for cache busting

In `next.config.ts`, expose the build ID:

```typescript
const config: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString(),
  },
  // ... rest of config
}
```

This ensures that when a new deployment is made, the persisted cache is invalidated (old data structure may not match new types).

## 7.4 Critical constraints

- The `authStore` (Zustand with `sessionStorage`) is NOT affected by this change. Auth state management is unchanged.
- The `uiStore` (Zustand with `localStorage`) is NOT affected.
- The `PersistQueryClientProvider` must be the outermost React Query wrapper, inside the auth provider.
- On logout, call `queryClient.clear()` to remove all in-memory AND persisted cache entries:

```typescript
// In the logout handler (auth.service.ts or auth hook):
import { queryClient } from '@services/query/queryClient'

async function handleLogout() {
  await logoutUser()
  queryClient.clear()                              // Clears in-memory cache
  localStorage.removeItem('ccms-query-cache')      // Clears persisted cache
  router.push('/login')
}
```

---

# 8. Performance Hardening

## 8.1 Bundle Analyzer Integration

### 8.1.1 `next.config.ts` update

```typescript
import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
  analyzerMode: 'static',
  reportFilename: '../analyze/report.html',
})

const nextConfig: NextConfig = {
  // ... existing config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/ccms-evidence/**',   // Scope to the CCMS Cloudinary folder
      },
    ],
  },
}

export default withAnalyzer(nextConfig)
```

### 8.1.2 Add npm script to `package.json`

```json
{
  "scripts": {
    "build:analyze": "ANALYZE=true pnpm build"
  }
}
```

Running `pnpm build:analyze` generates a static HTML report at `.next/analyze/report.html`.

## 8.2 Dynamic Imports for Heavy Components

Heavy components that are not needed on initial page load must be dynamically imported with `next/dynamic`. This reduces the initial bundle size and defers JavaScript parsing for components that are only shown on user interaction.

### 8.2.1 Chart components

In `src/shared/components/charts/`, create lazy-loaded wrappers:

```typescript
// src/shared/components/charts/LazyCharts.ts
import dynamic from 'next/dynamic'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export const LazyCcmsLineChart = dynamic(
  () => import('./CcmsLineChart').then((m) => ({ default: m.CcmsLineChart })),
  {
    loading: () => <Skeleton className="w-full h-[280px]" />,
    ssr: false,   // Recharts uses window; disable SSR
  },
)

export const LazyCcmsBarChart = dynamic(
  () => import('./CcmsBarChart').then((m) => ({ default: m.CcmsBarChart })),
  {
    loading: () => <Skeleton className="w-full h-[280px]" />,
    ssr: false,
  },
)

export const LazyCcmsDonutChart = dynamic(
  () => import('./CcmsDonutChart').then((m) => ({ default: m.CcmsDonutChart })),
  {
    loading: () => <Skeleton className="w-full h-[240px]" />,
    ssr: false,
  },
)
```

Replace all direct imports of `CcmsLineChart`, `CcmsBarChart`, `CcmsDonutChart` in dashboard widgets and report pages with their lazy equivalents.

### 8.2.2 Evidence Lightbox

```typescript
// src/features/evidence/components/LazyLightbox.ts
import dynamic from 'next/dynamic'
import { Skeleton } from '@shared/components/feedback/Skeleton'

export const LazyLightbox = dynamic(
  () => import('./EvidenceLightbox').then((m) => ({ default: m.EvidenceLightbox })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
        <Skeleton className="w-[600px] h-[400px]" />
      </div>
    ),
    ssr: false,
  },
)
```

### 8.2.3 Evidence Gallery (grid view)

```typescript
export const LazyEvidenceGallery = dynamic(
  () => import('./EvidenceGallery').then((m) => ({ default: m.EvidenceGallery })),
  {
    loading: () => <Skeleton className="w-full h-[300px]" />,
    ssr: false,
  },
)
```

## 8.3 Next.js Image Migration

Every `<img>` tag used in the evidence module must be replaced with `next/image`. The primary usage points are:

### 8.3.1 Evidence thumbnail in DataTable cell

```tsx
// BEFORE (Phase 5 implementation):
<img
  src={evidence.thumbnailUrl}
  alt={evidence.description}
  className="h-10 w-10 rounded object-cover"
/>

// AFTER:
import Image from 'next/image'

<Image
  src={evidence.thumbnailUrl}
  alt={evidence.description}
  width={40}
  height={40}
  className="rounded object-cover"
  unoptimized={false}    // Allow Next.js to optimise via Cloudinary remote pattern
/>
```

### 8.3.2 Evidence gallery card thumbnail

```tsx
// BEFORE:
<img src={evidence.imageUrl} alt={evidence.description} />

// AFTER:
<Image
  src={evidence.imageUrl}
  alt={evidence.description}
  width={240}
  height={160}
  className="rounded-t-lg object-cover w-full"
  sizes="(max-width: 768px) 100vw, 240px"
/>
```

### 8.3.3 Evidence lightbox full-resolution image

The lightbox renders the full-resolution Cloudinary image. Use `fill` layout with a constrained container:

```tsx
<div className="relative w-full h-full max-w-4xl max-h-[80vh]">
  <Image
    src={evidence.fullImageUrl}
    alt={evidence.description}
    fill
    className="object-contain"
    priority    // Lightbox images are above-the-fold after user interaction
    sizes="(max-width: 1200px) 90vw, 960px"
  />
</div>
```

---

# 9. Accessibility Hardening

## 9.1 Skip-to-Main Link

### 9.1.1 `src/shared/components/layout/SkipToMain.tsx`

```typescript
'use client'

import { useTranslations } from 'next-intl'

export function SkipToMain() {
  const t = useTranslations('accessibility')

  return (
    <a
      href="#main-content"
      className={[
        'absolute top-0 left-0 z-[9999] px-4 py-2',
        'bg-primary text-white text-sm font-medium rounded-br-md',
        // Visually hidden until focused
        'sr-only focus:not-sr-only focus:outline-none',
        'transition-transform focus:translate-x-0 -translate-x-full',
        'print:hidden',
      ].join(' ')}
    >
      {t('skipToMain')}
    </a>
  )
}
```

### 9.1.2 Mount in `AppShell`

In `src/shared/layouts/AppShell.tsx`, add `<SkipToMain />` as the very first child of the root element, before the sidebar:

```tsx
<div className="flex h-screen overflow-hidden">
  <SkipToMain />
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar />
    <main id="main-content" className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

The `id="main-content"` on the `<main>` element is what the skip link targets.

## 9.2 Focus Restoration on Modal/Drawer Close

When a modal or drawer closes, focus should return to the element that triggered it. Currently, Radix Dialog/Sheet manages the focus trap but does not always restore focus correctly when the trigger is in a complex component tree.

### 9.2.1 `src/shared/utils/focusUtils.ts`

```typescript
/**
 * Returns a focus restoration handler.
 * Call getFocusRestorer() BEFORE opening a modal.
 * Call the returned restorer() AFTER the modal closes.
 *
 * Usage:
 *   const restoreFocus = getFocusRestorer()
 *   openModal()
 *   // ... when modal closes:
 *   restoreFocus()
 */
export function getFocusRestorer(): () => void {
  const activeElement = document.activeElement as HTMLElement | null
  return () => {
    if (activeElement && typeof activeElement.focus === 'function') {
      // Use requestAnimationFrame to ensure the DOM has settled after modal unmount
      requestAnimationFrame(() => {
        activeElement.focus({ preventScroll: true })
      })
    }
  }
}

/**
 * React hook that wraps getFocusRestorer().
 * Call openWithFocusRestore(stateSetter) instead of stateSetter(true).
 * The returned value is a handler that restores focus when called.
 */
export function useFocusRestore() {
  let restorer: (() => void) | null = null

  function openWithFocusRestore(open: () => void): void {
    restorer = getFocusRestorer()
    open()
  }

  function restoreFocusOnClose(): void {
    restorer?.()
    restorer = null
  }

  return { openWithFocusRestore, restoreFocusOnClose }
}
```

### 9.2.2 Apply focus restoration to all drawers and dialogs

In every component that opens a `SlideOverDrawer` or `ConfirmDialog`, wrap the `onClose` callback:

```typescript
// Before: just close
const handleClose = () => setOpen(false)

// After: close + restore focus
const { openWithFocusRestore, restoreFocusOnClose } = useFocusRestore()

const handleOpen = () => openWithFocusRestore(() => setOpen(true))
const handleClose = () => {
  setOpen(false)
  restoreFocusOnClose()
}
```

Apply this pattern to all drawer/dialog triggers in:
- `LegalTab.tsx`
- `OfficerDetail.tsx`
- `PersonDetail.tsx`
- `CasesList.tsx`
- `EvidenceTab.tsx`
- `ChargesTable.tsx`
- All drawer components that contain "Cancel" buttons

## 9.3 Toast Notification ARIA Region

Verify the toast container in `src/shared/providers/ToastProvider.tsx` (or equivalent) has the correct ARIA attributes. If not present, add them:

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="false"
  aria-label={t('accessibility.toastRegion')}
  className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
>
  {toasts.map((toast) => (
    <ToastItem key={toast.id} toast={toast} />
  ))}
</div>
```

- `role="status"` + `aria-live="polite"` — screen readers announce new toasts after completing the current announcement.
- `aria-atomic="false"` — each toast is announced individually, not as a combined region update.

## 9.4 Status Badge High-Contrast Compatibility

The CCMS design uses colour exclusively for semantic meaning (green=success, red=danger). This violates WCAG 1.4.1 (Use of Color). Add a text label alongside the colour for all `StatusBadge` variants:

Update `src/shared/components/display/StatusBadge.tsx` to always include the text label (already the case for most usages). Verify that no badge renders with colour as the ONLY differentiator — every badge must have a visible text label.

For status badges used in DataTable cells (where space is constrained), ensure the full status label is available via `aria-label`:

```tsx
<StatusBadge
  variant="success"
  aria-label={`Status: ${t('officers.officerStatus.ACTIVE')}`}
>
  {t('officers.officerStatus.ACTIVE')}
</StatusBadge>
```

---

# 10. Storybook Documentation

## 10.1 Storybook 8 Configuration

### 10.1.1 `.storybook/main.ts`

```typescript
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  docs: {
    autodocs: 'tag',
  },
}

export default config
```

### 10.1.2 `.storybook/preview.ts`

```typescript
import type { Preview } from '@storybook/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import '../src/app/globals.css'
import '../src/shared/styles/print.css'
import enMessages from '../messages/en/common.json'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'CCMS Dark',
      values: [
        { name: 'CCMS Dark', value: '#0F172A' },
        { name: 'CCMS Card', value: '#1E293B' },
      ],
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'focus-trap', enabled: true },
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={{ common: enMessages }}>
          <div className="bg-background text-foreground p-4 min-h-screen">
            <Story />
          </div>
        </NextIntlClientProvider>
      </QueryClientProvider>
    ),
  ],
}

export default preview
```

### 10.1.3 Add script to `package.json`

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 10.2 Stories to Create

Create one `.stories.tsx` file per shared component. Each story file must include:
- A `Default` story showing the component in its primary state
- Variant stories for each meaningful configuration
- The `autodocs` tag for auto-generated documentation pages

**Required story files:**

```
stories/shared/
├── display/
│   ├── StatusBadge.stories.tsx       # All badge variants (primary, warning, destructive, success, muted, accent)
│   ├── KpiCard.stories.tsx           # Loading, with/without trend, linkTo, changeIsPositiveWhenUp
│   ├── MetadataCard.stories.tsx      # Populated, sparse data
│   ├── SensitiveField.stories.tsx    # Masked, revealed, no reveal permission
│   ├── PageHeader.stories.tsx        # With/without description, with/without actions
│   ├── SectionHeader.stories.tsx     # With/without actions
│   └── EmptyState.stories.tsx        # With/without action, different icons
├── feedback/
│   ├── Skeleton.stories.tsx          # Various dimensions
│   ├── ErrorState.stories.tsx        # With/without retry
│   └── ForbiddenState.stories.tsx
├── table/
│   ├── DataTable.stories.tsx         # Populated, empty, loading, with pagination, with bulk selection
│   ├── TableEmptyState.stories.tsx
│   └── BulkActionBar.stories.tsx     # With one action, with multiple actions, destructive action
├── forms/
│   ├── FormField.stories.tsx         # Default, error, helper text
│   ├── DatePicker.stories.tsx        # Default, with min/max, disabled
│   ├── DateRangePicker.stories.tsx   # All presets, custom range
│   └── SearchableSelect.stories.tsx  # Loading options, selected value, empty options
├── modals/
│   ├── ConfirmDialog.stories.tsx
│   ├── DestructiveConfirmDialog.stories.tsx  # Without/with error, loading state
│   └── SlideOverDrawer.stories.tsx   # Empty content, form content, 640px width variant
├── timeline/
│   ├── AuditTimeline.stories.tsx     # Loading, empty, with entries, with custody gap
│   ├── TimelineEntry.stories.tsx     # All event categories, with diff, with note, security HIGH
│   ├── DiffViewer.stories.tsx        # 3 fields, 8 fields (collapsed), null before/after
│   ├── CustodyGapBadge.stories.tsx
│   └── AddCaseNoteForm.stories.tsx
├── charts/
│   ├── CcmsLineChart.stories.tsx     # Single series, multi-series, empty data
│   ├── CcmsBarChart.stories.tsx      # Horizontal, vertical, with per-bar colours
│   └── CcmsDonutChart.stories.tsx    # With centre label, without, empty data
└── layout/
    └── SkipToMain.stories.tsx        # Shows the link on focus (keyboard interaction)
```

### 10.2.1 Example story — `StatusBadge.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs'
import { StatusBadge } from '@shared/components/display/StatusBadge'

const meta = {
  title: 'Shared/Display/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Open' },
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'Under Investigation' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Convicted' },
}

export const Success: Story = {
  args: { variant: 'success', children: 'Active' },
}

export const Muted: Story = {
  args: { variant: 'muted', children: 'Archived' },
}

export const Accent: Story = {
  args: { variant: 'accent', children: 'Protected' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge variant="primary">Open</StatusBadge>
      <StatusBadge variant="warning">Under Investigation</StatusBadge>
      <StatusBadge variant="destructive">Convicted</StatusBadge>
      <StatusBadge variant="success">Active</StatusBadge>
      <StatusBadge variant="muted">Archived</StatusBadge>
      <StatusBadge variant="accent">Protected</StatusBadge>
    </div>
  ),
}
```

All story files must follow this pattern: `Meta` with `tags: ['autodocs']`, individual variant stories, and an `AllVariants` / `AllStates` composite story.

---

# 11. i18n Updates

Phase 11 adds keys to existing message files. Do not create new namespace files. Add the following keys to their respective existing files:

## 11.1 Additions to `messages/en/cases.json`

```json
{
  "bulk": {
    "statusUpdate": {
      "actionLabel": "Update Status",
      "dialogTitle": "Update Status for {count} Case(s)",
      "newStatusLabel": "New Status",
      "reasonLabel": "Reason (optional)",
      "reasonPlaceholder": "Reason for status change...",
      "submitButton": "Update {count} Cases",
      "successMessage": "{count} case(s) updated successfully.",
      "partialSuccessMessage": "{updated} case(s) updated. {failed} could not be updated.",
      "errorMessage": "Failed to update case statuses. Please try again.",
      "clearSelection": "Clear selection"
    }
  }
}
```

## 11.2 Additions to `messages/en/evidence.json`

```json
{
  "bulk": {
    "export": {
      "actionLabel": "Export Selected",
      "successMessage": "Evidence export downloaded.",
      "errorMessage": "Failed to export evidence. Please try again.",
      "downloading": "Downloading..."
    }
  }
}
```

## 11.3 Additions to `messages/en/legal.json`

```json
{
  "charges": {
    "bulkDrop": {
      "actionLabel": "Drop Selected",
      "dialogTitle": "Drop {droppableCount} Charge(s)?",
      "terminalWarning": "{terminalCount} of your selected charges are already at a final status and will be skipped.",
      "submitButton": "Drop {count} Charges",
      "allTerminalTooltip": "All selected charges are at a final status. No action available.",
      "successMessage": "{count} charge(s) dropped successfully.",
      "partialSuccessMessage": "{updated} charge(s) dropped. {failed} could not be updated.",
      "errorMessage": "Failed to drop charges. Please try again."
    },
    "editSentence": {
      "openButton": "Amend Sentence",
      "openButtonHint": "Amendments are logged in the audit trail with the original values preserved.",
      "drawerTitle": "Amend Sentence",
      "drawerDescription": "Amend the recorded sentence for this conviction.",
      "amendmentNotice": "Amending this sentence creates a permanent audit entry showing the original and amended values. The original values cannot be deleted.",
      "amendmentReasonLabel": "Reason for Amendment",
      "amendmentReasonPlaceholder": "Explain the reason for amending this sentence...",
      "submitButton": "Save Amendment",
      "cancelButton": "Cancel",
      "successMessage": "Sentence amended successfully. The audit trail has been updated.",
      "errorMessage": "Failed to amend sentence. Please try again."
    },
    "appeal": {
      "kebabLabel": "File Appeal",
      "drawerTitle": "File Appeal",
      "drawerDescription": "Reverse this terminal charge via an appeal record.",
      "consequencesNotice": "Filing this appeal will revert the charge status to Active, create a permanent appeal record, and remove the existing sentence record (if any). This action is logged.",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Grounds for the appeal...",
      "submitButton": "Confirm Appeal — Revert to Active",
      "cancelButton": "Cancel",
      "successMessage": "Appeal filed. Charge status reverted to Active.",
      "errorMessage": "Failed to file appeal. Please try again."
    }
  }
}
```

## 11.4 Additions to `messages/en/personnel.json`

```json
{
  "persons": {
    "demoteRole": {
      "buttonLabel": "Remove Role",
      "dialogTitle": "Remove {roleName} Designation?",
      "dialogDescription": "{personName} will no longer be designated as {roleName} in this system. This action is logged.",
      "activeCasesWarning": "This person is linked to {count} active case(s) as {roleName}. Removing this role does not unlink them from those cases. Contact the case lead to update case records manually.",
      "confirmButton": "Remove {roleName} Designation",
      "cancelButton": "Cancel",
      "successMessage": "{roleName} designation removed from {personName}.",
      "errorMessage": "Failed to remove role designation. Please try again."
    }
  }
}
```

## 11.5 Additions to `messages/en/common.json` (or `accessibility.json` if it exists)

```json
{
  "accessibility": {
    "skipToMain": "Skip to main content",
    "toastRegion": "Notifications"
  }
}
```

Add corresponding Amharic translations to all `messages/am/*.json` files for every English key added above.

---

# 12. `src/features/legal/index.ts` — Barrel Export Updates

Add the new hooks and components to the legal module barrel:

```typescript
// Add to existing exports:
export { useEditSentence } from './hooks/useEditSentence'
export { useAppealCharge } from './hooks/useAppealCharge'
export { useBulkDropCharges } from './hooks/useBulkDropCharges'

export { EditSentenceDrawer } from './components/EditSentenceDrawer'
export { AppealChargeDrawer } from './components/AppealChargeDrawer'
export { BulkDropChargesDialog } from './components/BulkDropChargesDialog'

// New types:
export type { EditSentencePayload, AppealChargePayload, AppealRecord, AppealOutcome } from './types/legal.types'
```

---

# 13. `src/features/personnel/index.ts` — Barrel Export Updates

```typescript
// Add to existing exports:
export { useDemotePersonRole } from './hooks/useDemotePersonRole'
export { DemotePersonRoleDialog } from './components/persons/DemotePersonRoleDialog'
```

---

# 14. Anti-Pattern Reference

The following patterns are strictly forbidden in Phase 11.

**Bulk operation violations:**
- Implementing a bulk delete action for any entity — cases, officers, persons, and evidence items cannot be bulk-deleted from the UI in this phase.
- Firing the bulk mutation without a `ConfirmDialog` for destructive bulk actions — bulk case status update and bulk charge drop both require confirmation with the affected count displayed.
- Firing the bulk evidence export without a `BulkActionBar` — users must explicitly select rows before the export action is available; no "export all" button.
- Allowing terminal charges to be included in the bulk drop mutation payload — filter them out client-side before building the `chargeIds` array, and warn the officer in the dialog.
- Not clearing `rowSelection` after a successful bulk mutation — stale selections must be cleared so the `BulkActionBar` disappears.

**Legal enhancement violations:**
- Allowing `EditSentenceDrawer` to be opened by roles below `admin` — the "Amend Sentence" button must be inside `PermissionGuard permission={Permission.ADMIN_MANAGE}`.
- Allowing `AppealChargeDrawer` to be opened by roles below `superadmin` — appeals are a superadmin-only action; use `Permission.SUPERADMIN_ONLY`.
- Omitting the `amendmentReason` field from `EditSentenceDrawer` — this field is required for the audit trail and cannot be optional.
- Displaying `AppealChargeDrawer` for `FILED`, `ACTIVE`, or `DROPPED` charges — the appeal flow is only for `CONVICTED` and `ACQUITTED` terminal statuses.
- Using `DELETE` HTTP method for appeal (the appeal files a new record and reverts the status; it does not delete the charge).

**Person de-promotion violations:**
- Showing the "Remove Role" button on role cards for roles that the person does not currently have — only show "Remove Role" for roles that exist in `person.roles`.
- Calling `demotePersonRole` without confirming via `DemotePersonRoleDialog` — the `DestructiveConfirmDialog` is mandatory for all de-promotion actions.
- Omitting the `activeCaseCount` warning in `DemotePersonRoleDialog` when the count is greater than zero — this warning is mandatory when the person has active case links.

**Offline resilience violations:**
- Persisting PII-bearing query data to `localStorage` — any query key matching `['persons']`, `['officers']`, or any other PII-containing key must be on the PERSIST_BLACKLIST.
- Persisting the `authStore` through React Query — auth state is managed by Zustand with sessionStorage. Do not mix these systems.
- Not calling `queryClient.clear()` on logout — persisted stale data from one officer must not be accessible to another officer who logs in on the same device.
- Setting `maxAge` higher than 24 hours — persisted cache older than 24 hours should be invalidated to avoid serving very stale operational data.
- Not adding the `buster` option tied to the build ID — without cache-busting, officers on old deployments may have incompatible persisted data structures.

**Performance violations:**
- Importing `CcmsLineChart`, `CcmsBarChart`, or `CcmsDonutChart` directly (not the lazy-loaded `Lazy*` variants) in dashboard widgets or report pages — all chart components must be dynamically imported.
- Using `<img>` tags for evidence thumbnails after Phase 11 — all evidence image renders must use `next/image`.
- Not setting `ssr: false` on dynamic chart imports — Recharts accesses `window` and will fail on SSR without this flag.
- Specifying an overly broad Cloudinary `remotePatterns` path (e.g., `/**`) — scope the `pathname` to `/ccms-evidence/**` to prevent the Next.js image optimizer from being used as an open proxy.

**Accessibility violations:**
- Rendering `<SkipToMain />` inside the Sidebar or TopBar — it must be the first child of the root element in `AppShell`, before all navigation chrome.
- Using `aria-live="assertive"` for toast notifications — error toasts are loud but not urgent enough to interrupt screen reader flow; use `polite` for all toasts.
- Not applying `suppressHydrationWarning` on timestamp `<time>` elements — timestamps formatted with `date-fns` use the local timezone and will hydration-mismatch without this attribute.

**Storybook violations:**
- Adding stories for feature-specific domain components (e.g., `CourtCaseCard`, `EvidenceLightbox`, `ChargesTable`) — Storybook in Phase 11 documents only `src/shared/components/` components.
- Importing real API services or making network requests in stories — all stories must use mock data passed as args. Use the `@tanstack/react-query` mock client configured in `preview.ts`.
- Not including `tags: ['autodocs']` in the story meta — without this, the automatic documentation page is not generated.

**Module boundary violations:**
- Importing the lazy-loaded chart wrappers from `@features/dashboard/` or `@features/reports/` — they must be imported from `@shared/components/charts/LazyCharts`.
- Placing the persister configuration inside a feature module — `src/services/query/persister.ts` is a service-layer concern, not a feature concern.

---

# 15. Final Verification Checklist

## 15.1 Bulk Operations

- [ ] Cases DataTable shows checkbox column; selecting rows reveals `BulkActionBar`
- [ ] `BulkActionBar` shows selected count and "Clear selection" link
- [ ] "Update Status" bulk action is hidden for roles without `CASES_MANAGE`
- [ ] `BulkStatusUpdateDialog` opens with status select and optional reason field
- [ ] Submitting updates cases, shows success toast, clears row selection, refreshes list
- [ ] Partial success (some failed): warning toast with updated/failed counts
- [ ] Evidence DataTable shows checkbox column; selecting rows reveals `BulkActionBar`
- [ ] "Export Selected" fires immediately (no confirm dialog) and downloads CSV
- [ ] Export button shows loading state during download; row selection clears after success
- [ ] Charges DataTable shows checkbox column; selecting rows reveals `BulkActionBar`
- [ ] "Drop Selected" is disabled when all selected charges are terminal
- [ ] `BulkDropChargesDialog` shows terminal charges warning when applicable
- [ ] Droppable charge list is shown in the dialog before confirmation
- [ ] Confirming drops charges, refreshes charges table and case overview count
- [ ] Partial success: warning toast with updated/failed counts

## 15.2 Legal Module Enhancements

- [ ] `ViewSentenceDrawer` shows "Amend Sentence" button for `admin+` only
- [ ] "Amend Sentence" button is absent for roles below `admin`
- [ ] `EditSentenceDrawer` opens pre-populated with current sentence values
- [ ] Amendment reason field is required; submitting without it shows validation error
- [ ] Amendment notice bar is visible (amber styling)
- [ ] Successful amendment: drawer closes, sentence values update, audit entry created
- [ ] `AppealChargeDrawer` is accessible from the charge row kebab for `CONVICTED`/`ACQUITTED` charges (superadmin only)
- [ ] Appeal consequences notice bar lists all three effects (status revert, appeal record, sentence removal)
- [ ] Confirming appeal: charge status reverts to ACTIVE badge (amber), sentence indicator clears, appeal toast confirms
- [ ] `AppealChargeDrawer` kebab item is absent for roles below `superadmin`
- [ ] `AppealChargeDrawer` kebab item is absent for `FILED`, `ACTIVE`, `DROPPED` charges

## 15.3 Personnel Module Enhancements

- [ ] Each role card on person detail shows "Remove Role" button for `admin+`
- [ ] "Remove Role" button is absent for roles without `ADMIN_MANAGE`
- [ ] `DemotePersonRoleDialog` opens with the person name and role name in the title
- [ ] `DemotePersonRoleDialog` shows the active-cases warning when `activeCaseCount > 0`
- [ ] Confirming de-promotion: role card disappears from person detail, person list roles column updates, toast confirms
- [ ] After de-promotion, the "Promote to" dropdown shows the removed role again (re-promotion is possible)

## 15.4 Offline Resilience

- [ ] Navigating to `/cases` after a page reload shows stale list data immediately (not a blank loading state)
- [ ] Reference data (departments, crime types) loads instantly on subsequent page loads from persisted cache
- [ ] Logging out clears both the in-memory and persisted cache (`localStorage.getItem('ccms-query-cache')` returns null after logout)
- [ ] Logging in as a different officer on the same device shows no data from the previous officer's session
- [ ] `localStorage` does NOT contain any `['persons']` or `['officers']` query data
- [ ] `localStorage` does NOT contain any `['audit']` query data
- [ ] Deploying a new build invalidates the persisted cache (buster mismatch)
- [ ] `PersistQueryClientProvider` wraps the app without breaking any existing query behaviour

## 15.5 Performance Hardening

- [ ] `pnpm build:analyze` runs without error and produces `.next/analyze/report.html`
- [ ] No `<img>` tags remain in evidence thumbnail, gallery card, or lightbox components
- [ ] `next/image` renders evidence thumbnails with correct `width` and `height`
- [ ] Cloudinary images load correctly via `next/image` optimisation
- [ ] `next.config.ts` has `images.remotePatterns` scoped to `res.cloudinary.com/ccms-evidence/**`
- [ ] Dashboard widget charts use `LazyCcmsLineChart`, `LazyCcmsBarChart`, `LazyCcmsDonutChart`
- [ ] Report page charts use the lazy chart variants
- [ ] Chart skeleton placeholders display while the chart bundle loads
- [ ] `EvidenceLightbox` is dynamically imported — no Lightbox code in the initial bundle

## 15.6 Accessibility Hardening

- [ ] Tab-press when the page loads reveals the "Skip to main content" link at the top-left
- [ ] Clicking "Skip to main content" moves focus to `id="main-content"` and scrolls to it
- [ ] Opening and closing any `SlideOverDrawer` returns focus to the element that triggered it
- [ ] Opening and closing any `ConfirmDialog`/`DestructiveConfirmDialog` returns focus to the trigger
- [ ] Toast notifications are announced by screen readers (verify `role="status"` + `aria-live="polite"` is present)
- [ ] All `StatusBadge` components have text labels (no colour-only differentiation)
- [ ] `StatusBadge` components have `aria-label` when used in icon-only contexts

## 15.7 Storybook

- [ ] `pnpm storybook` starts without error on port 6006
- [ ] Dark background (`#0F172A`) is the default Storybook background
- [ ] All 29 story files are present and load without import errors
- [ ] Each story file has a `Default` story and variant stories
- [ ] Each story file has `tags: ['autodocs']` in the meta
- [ ] The a11y addon tab shows zero violations for `StatusBadge`, `KpiCard`, `DataTable`, and `SkipToMain`
- [ ] `pnpm build-storybook` completes without error

## 15.8 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm lint` exits with zero warnings
- [ ] `pnpm build` — production build succeeds without errors
- [ ] `pnpm build:analyze` — bundle analyzer builds and produces report HTML
- [ ] `pnpm storybook` — Storybook dev server starts on port 6006

---

*End of CCMS Phase 11 Instruction — Hardening & Feature Completion*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*