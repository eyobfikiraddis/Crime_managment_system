# CCMS Frontend — Agent Task Instruction
> **For AI coding agents only.** Read this file in full before taking any action.

---

## Context

You are working on the **CCMS (Criminal Case Management System)** frontend — a Next.js 14+ / TypeScript / TailwindCSS / shadcn-ui enterprise application for law enforcement. The project is in its late implementation or manual-testing phase, but several pages and components are still holding **Phase 1 placeholders** (stub JSX, TODO comments, empty returns, or skeleton shells that were never completed). Additionally, `pnpm type-check` currently exits with **42 TypeScript errors across 28 files**.

Your job is to do two things **in the order listed**:

1. **Scan the entire codebase** for placeholder content and document every finding.
2. **Fix every TypeScript error** listed in Part B of this instruction.
3. **Delete the existing `Breakdown.md`** (if one exists at the project root or anywhere in the project) and **write a new one** containing your complete findings from step 1.

Do **not** invent UI. Do **not** build anything from scratch during this task. If a placeholder requires real implementation that goes beyond what you can confirm from existing types, schemas, hooks, and sibling components, mark it as `STATUS: Needs Implementation` in the Breakdown.md and move on.

---

## Part A — Placeholder Discovery

### A.1 What to Search For

Run the following grep/search patterns against `src/` (recursively, case-insensitive where noted):

#### Pattern Group 1 — Explicit placeholder text (case-insensitive)
```
"coming soon"
"under construction"
"placeholder"
"not yet implemented"
"TODO:"
"FIXME:"
"HACK:"
"@todo"
"stub"
"lorem ipsum"
```

#### Pattern Group 2 — Structural emptiness indicators
```tsx
// Components that return only a fragment, null, or an empty div with just a heading/string
return null
return <></>
return <div />
return <div></div>
// Page files that contain no data-fetching hooks and render only a static title
```

#### Pattern Group 3 — Common stub patterns in Next.js pages
Search every `page.tsx` file inside `src/app/(dashboard)/` for files whose **total rendered JSX output** is one of:
- A bare `<h1>` or `<p>` with the page name and nothing else
- A div/section containing only a `<PageHeader>` with no DataTable, form, card, or data component beneath it
- A component that renders `<EmptyState>` unconditionally (no loading/error branching — the EmptyState is the only branch)

#### Pattern Group 4 — Hooks that are imported but never used
For each page and feature component, note if it imports a React Query hook (e.g. `useXxxList`, `useXxxDetail`) but the returned `data` is never rendered — this indicates the data layer exists but the UI was never wired up.

#### Pattern Group 5 — Hard-coded static arrays in place of real data
Search for patterns like:
```tsx
const items = [
  { id: 1, ... },
  { id: 2, ... },
]
```
inside component files that are supposed to display server data. These are mock arrays that were never replaced.

---

### A.2 Scope — Files and Directories to Scan

Scan **all** of the following directories:

```
src/app/(dashboard)/
src/features/cases/components/
src/features/evidence/components/
src/features/arrests/components/
src/features/interrogations/components/
src/features/legal/components/
src/features/personnel/components/
src/features/departments/components/
src/features/reports/components/
src/features/audit/components/
src/features/dashboard/components/
src/features/admin/components/
src/features/settings/components/
src/shared/components/
```

Also scan:
```
src/features/*/hooks/
src/features/*/schemas/
```
for any hook file that exports a function whose body is `throw new Error(...)` or returns hardcoded data instead of a real `useQuery` / `useMutation`.

---

### A.3 Cross-Reference With Blueprint

For each of the following pages and components defined in the blueprint, verify whether a real implementation exists. If a file exists but its content is a placeholder or is structurally empty, flag it. If a file does **not exist at all**, flag it as `STATUS: Missing`.

Use this checklist (derived from the blueprint Chapters 8–18 and the route map in Chapter 3):

#### Routes / Pages
| Route | Expected Content | Check |
|---|---|---|
| `/dashboard` | Role-branching dashboard with KPI strip, charts, activity feed, workload table | |
| `/cases` | DataTable with filter bar, pagination, server-side sort | |
| `/cases/new` | Multi-step case creation form | |
| `/cases/[caseId]` (overview tab) | Metadata card, description, summary panels, assigned officers, recent activity | |
| `/cases/[caseId]/evidence` | Evidence DataTable + gallery toggle, upload drawer trigger | |
| `/cases/[caseId]/arrests` | Arrests DataTable, link to arrest detail | |
| `/cases/[caseId]/interrogations` | Interrogations log DataTable, record creation | |
| `/cases/[caseId]/legal` | Court case card, charges table, sentencing panel | |
| `/cases/[caseId]/officers` | Assigned officers table, assign/remove actions | |
| `/cases/[caseId]/timeline` | Polling audit timeline, filter bar, add-note form | |
| `/cases/[caseId]/reports` | Report shortcut cards or embedded report widgets | |
| `/cases/[caseId]/permissions` | Case ACL management table | |
| `/personnel/persons` | Persons DataTable with role/risk filters | |
| `/personnel/persons/[personId]` | Identity card, role cards, associated cases, audit history | |
| `/personnel/officers` | Officers DataTable, status/department filters | |
| `/personnel/officers/[officerId]` | Officer detail card, assigned cases, audit history | |
| `/departments` | Departments DataTable | |
| `/departments/[departmentId]` | Dept metadata card, officers table, active cases count | |
| `/legal/court-cases` | Court cases DataTable | |
| `/reports` | Sub-navigation + report cards for all 6 categories | |
| `/admin/locations` | Locations CRUD DataTable | |
| `/admin/crime-types` | Crime types CRUD DataTable | |
| `/admin/health` | Polling health panel with status indicators | |
| `/settings/profile` | Profile edit form | |
| `/settings/password` | Password change form | |

#### Shared Components
| Component | Expected Behaviour | Check |
|---|---|---|
| `DataTable.tsx` | Server pagination, sort, filter chips, bulk actions, skeleton, empty state, virtualisation at >200 rows, export | |
| `BulkActionBar.tsx` | Appears above table on row selection, shows affected count, confirm dialog | |
| `TableFilterBar.tsx` | Search input, filter dropdowns, active filter chips (removable) | |
| `FormField.tsx` | Label, input, helper text, error message, aria-invalid, aria-describedby | |
| `SearchableSelect.tsx` | Radix Combobox + server-side search query | |
| `DatePicker.tsx` | Calendar with keyboard nav, future/past constraints | |
| `DateRangePicker.tsx` | From/To with preset buttons (Last 7 Days, 30 Days, Quarter, Custom) | |
| `SlideOverDrawer.tsx` | 480px, full-width on mobile, focus trap, Escape closes | |
| `ConfirmDialog.tsx` | Summarises action, entity name, irreversibility warning | |
| `DestructiveConfirmDialog.tsx` | Optional confirmation phrase input for highest-consequence actions | |
| `StatusBadge.tsx` | All statuses from §5.3 of blueprint covered with correct colour variants | |
| `SensitiveField.tsx` | Masked state by default, Reveal button for admin+, client-side audit event on reveal | |
| `PermissionGuard.tsx` | Renders fallback or null based on named permission string | |
| `RoleGuard.tsx` | Renders fallback or null based on role list | |
| `CaseAccessGuard.tsx` | Renders fallback or null based on case-level access record | |
| `AuditTimeline` (features/audit) | Immutable cards, diff viewer, security badge, padlock icon | |
| `CustodyGapBadge.tsx` | Amber dashed line + warning badge for gaps > 24h | |
| `DiffViewer.tsx` | Side-by-side before/after panels in monospace | |
| `KpiCard` (display) | Icon, label, large number, trend indicator | |
| `EmptyState.tsx` | Context-appropriate message + optional CTA | |
| `PageHeader.tsx` | Title row + optional action buttons (right-aligned) | |
| `SectionHeader.tsx` | Section title + optional description | |

---

### A.4 How to Record Findings

For each flagged item, record the following fields:

```
FILE: src/features/legal/components/ChargesTable.tsx
ISSUE: Component exists but `data` variable is used in dependency arrays before declaration
STATUS: Bug — covered in Part B TypeScript fixes
BLUEPRINT REF: Chapter 8.6
PRIORITY: High
```

Valid `STATUS` values:
- `Placeholder — Needs Implementation` (file exists, content is a stub)
- `Missing — Needs Creation` (file does not exist at all)
- `Bug — Covered in Part B` (issue is a TypeScript/logic error, already listed in fixes)
- `Partial — Data layer present, UI incomplete` (hook exists and works, JSX not wired up)
- `Complete` (passes spot-check, no obvious placeholder)

---

## Part B — Fix All TypeScript Errors

Fix every error produced by `pnpm type-check`. The errors and their exact fixes are described below. Apply them in the order listed.

> **Rule:** Never use `as any` to silence an error. Fix the actual type mismatch.

---

### B.1 — `BulkStatusUpdateDialog.tsx` line 44
**Error:** `exactOptionalPropertyTypes` — `reason: string | undefined` not assignable to `string` (optional property).

**Root cause:** With `exactOptionalPropertyTypes: true`, passing `undefined` explicitly for an optional property that types as `string` (not `string | undefined`) is forbidden. The spread-conditional pattern must be used instead.

**Fix:**
```tsx
// Before (line 44)
{ caseIds, status, reason: reason || undefined }

// After
{ caseIds, status, ...(reason ? { reason } : {}) }
```

---

### B.2 — `AppealChargeDrawer.tsx` lines 76–78
**Error:** Same `exactOptionalPropertyTypes` issue — `notes: string | undefined` not assignable to `AppealChargePayload`.

**Fix:**
```tsx
// Before
await appealMutation.mutateAsync({
  notes: values.notes || undefined,
})

// After
await appealMutation.mutateAsync({
  ...(values.notes ? { notes: values.notes } : {}),
})
```

---

### B.3 — `AppealChargeDrawer.tsx` line 121
**Error:** `variant="warning"` is not a valid variant on the shadcn `Button` component. Valid variants are: `default | destructive | outline | secondary | ghost | link`.

**Correct approach — do not add a `warning` variant to `button.tsx`**. The design system uses `warning` colour tokens semantically, but the Button component variants are structural, not semantic. Use `variant="outline"` with a `className` that applies the warning colour:

**Fix:**
```tsx
// Before
<Button variant="warning" ...>

// After
<Button variant="outline" className="border-warning text-warning hover:bg-warning/10" ...>
```

> If the project already defines a `cn()` utility (likely in `src/shared/utils/`), use it:
> ```tsx
> <Button variant="outline" className={cn("border-warning text-warning hover:bg-warning/10")} ...>
> ```

---

### B.4 — `ChargesTable.tsx` lines 102 and 111
**Error:** Block-scoped variable `data` used before its declaration. Two `useCallback` or `useMemo` hooks reference `data` in their dependency arrays, but `const { data, ... } = useChargeList(...)` is declared on line 141 — after these hooks.

**Fix:** Move the `useChargeList` destructuring to **before** the first hook that references `data`. Find the line:
```tsx
const { data, isLoading, isError, refetch } = useChargeList(...)
```
and hoist it above the earliest hook at line 102. Preserve the variable names exactly — do not rename them.

---

### B.5 — `ViewSentenceDrawer.tsx` line 230
**Error:** `onSuccess` prop does not exist on `EditSentenceDrawerProps`.

Two possible correct fixes — choose based on what `EditSentenceDrawer` actually does internally:

**Option A** — If `EditSentenceDrawer` already handles its own close/success logic internally, simply remove the `onSuccess` prop:
```tsx
// Before
<EditSentenceDrawer
  ...
  onSuccess={() => onOpenChange(false)}
/>

// After
<EditSentenceDrawer
  ...
/>
```

**Option B** — If `EditSentenceDrawer` genuinely needs a success callback (preferred if other callers also need it), add `onSuccess` to its props interface in the file where `EditSentenceDrawerProps` is defined:
```tsx
// In EditSentenceDrawer's types/props
export interface EditSentenceDrawerProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  chargeId: string
  courtCaseId: string
  caseId: string
  sentence: Sentence | null
  onSuccess?: () => void   // ← add this
}
```
Then call `props.onSuccess?.()` at the appropriate point inside the component (e.g., inside the `onSettled` or `onSuccess` of its mutation).

> **Which option to pick:** Read `EditSentenceDrawer`'s implementation. If it already closes or refetches on success without needing a callback, use Option A. If it has no post-success side effect and the drawer needs to close, use Option B.

---

### B.6 — `persister.ts` line 44
**Error:** `Property 'queries' does not exist on type 'PersistedClient'` + implicit `any` on parameter `q`.

**Root cause:** The `PersistedClient` type from `@tanstack/react-query-persist-client` (or the inline persister implementation) does not expose `queries` directly on the client object. The persisted state is accessed via `client.clientState`.

**Fix:**
```ts
// Before (line 44)
queries: client.queries.filter((q) =>

// After
queries: client.clientState.queries.filter((q: PersistedQuery) =>
```

Also add the import for `PersistedQuery` if not already present. Check the package's exported types:
```ts
import type { PersistedClient, PersistedQuery } from '@tanstack/react-query-persist-client'
```
If `PersistedQuery` is not exported by the package in the version installed, use the inline type:
```ts
queries: client.clientState.queries.filter((q: { queryKey: unknown; queryHash: string; state: unknown }) =>
```

> After applying this fix, run `pnpm type-check` again on this file only to confirm the correct property path for the installed package version.

---

### B.7 — All `*.stories.tsx` files (18 files)
**Error:** `Cannot find module '@storybook/react' or its corresponding type declarations.`

These errors affect every Storybook story file under `src/shared/components/`.

**Determine the correct fix by checking `package.json`:**

- If `@storybook/react` is **not listed** in `devDependencies` at all: The Storybook setup was deferred. Do **not** install it now. Instead, exclude story files from the TypeScript compilation by adding the following to `tsconfig.json`:

```json
{
  "exclude": [
    "node_modules",
    "**/*.stories.tsx",
    "**/*.stories.ts"
  ]
}
```

- If `@storybook/react` **is** listed in `devDependencies` but `node_modules/@storybook/react` is missing: Run `pnpm install` first, then re-check. If it still fails, apply the `tsconfig.json` exclude above and log it in Breakdown.md as `STATUS: Storybook not installed — type-check exclusion applied`.

Additionally, fix the **implicit `any` errors** inside the story files themselves only if Storybook is installed and the stories will be type-checked. If stories are excluded via `tsconfig.json`, these are moot. For reference, the affected parameters are:

| File | Parameter | Fix |
|---|---|---|
| `KpiCard.stories.tsx:41` | `(v)` in `valueFormatter` | `(v: number) =>` |
| `DatePicker.stories.tsx:17,24` | `(d)` | `(d: Date \| undefined) =>` |
| `DateRangePicker.stories.tsx:30` | `(from, to, preset)` | Match the `DateRangePicker` onChange signature |
| `SearchableSelect.stories.tsx:25` | `(val)` | `(val: string) =>` |
| `ConfirmDialog.stories.tsx:21` | `(o)` | `(o: boolean) =>` |
| `DestructiveConfirmDialog.stories.tsx:21,36` | `(o)` | `(o: boolean) =>` |
| `SlideOverDrawer.stories.tsx:27` | `(o)` | `(o: boolean) =>` |

---

### B.8 — `DataTable.tsx` line 73
**Error:** `rowSelection: RowSelectionState | undefined` is not assignable to `RowSelectionState` with `exactOptionalPropertyTypes: true`.

**Fix:** Use the spread-conditional pattern to only include `rowSelection` in the state object when it is defined:

```tsx
// Before (lines 73–77 approximately)
state: {
  sorting,
  pagination,
  rowSelection: rowSelection,
},

// After
state: {
  sorting,
  pagination,
  ...(rowSelection !== undefined ? { rowSelection } : {}),
},
```

---

## Part C — Write the New Breakdown.md

After completing Parts A and B:

1. **Find and delete** any existing file named `Breakdown.md` anywhere in the repository (check root, `docs/`, `src/`).

2. **Create a new file** at the project root: `Breakdown.md`

3. The new file must contain **all of the following sections**, populated with your actual findings:

```markdown
# CCMS Frontend — Codebase Breakdown

> Generated by agent scan. Last updated: [date of scan]
> Run after: pnpm type-check (42 errors across 28 files — see Section 3)

---

## 1. Executive Summary

[2–3 sentences: total files scanned, number of placeholders found, number of missing files,
number of partial implementations, TypeScript error status after fixes applied]

---

## 2. Placeholder & Missing Component Findings

### 2.1 Pages (src/app/(dashboard)/)
[Table: Route | File Path | Status | Issue Description | Blueprint Ref | Priority]

### 2.2 Feature Components (src/features/)
[Table: Component | File Path | Status | Issue Description | Blueprint Ref | Priority]

### 2.3 Shared Components (src/shared/components/)
[Table: Component | File Path | Status | Issue Description | Blueprint Ref | Priority]

### 2.4 Hooks & Services
[Table: Hook/Service | File Path | Status | Issue Description | Priority]

---

## 3. TypeScript Error Resolution Log

For each error group from Part B, record:
- Error location
- Root cause (one line)
- Fix applied
- Verification: RESOLVED / STILL FAILING (with reason if still failing)

---

## 4. Storybook Status

State whether @storybook/react was installed, and what action was taken
(installed / excluded from tsconfig / stories fixed inline).

---

## 5. Implementation Priority Queue

List all items with STATUS ≠ Complete, ordered by priority:
1. [Highest priority — e.g., missing core page]
2. ...

---

## 6. Notes & Observations

Any structural issues, import boundary violations, or architectural deviations from the
blueprint discovered during the scan (do not fix these — document only).
```

---

## Execution Order

```
1. pnpm type-check  → capture current error list (confirm it matches this instruction)
2. Run all grep/search patterns from Part A across src/
3. Open and inspect every flagged file
4. Cross-reference against blueprint checklist (A.3)
5. Apply TypeScript fixes from Part B (one file at a time)
6. After each fix, confirm the specific error is gone (targeted re-check if possible)
7. Run full pnpm type-check — confirm 0 errors (excluding stories if excluded via tsconfig)
8. Delete existing Breakdown.md
9. Write new Breakdown.md with all findings from steps 2–4 and fix log from step 5–7
```

---

## Constraints

- **Do not modify any API service files** (`src/services/domain/`) during this task — only fix types.
- **Do not install new npm packages** except `@storybook/react` devDependency if Storybook is already partially configured.
- **Do not refactor** working code that has no TypeScript errors.
- **Do not implement** placeholder pages — document them only.
- **Do not rename** any exported components, hooks, or types.
- If a fix requires understanding a type from a file you haven't read yet, read that file first before applying the fix.