# CCMS Frontend — Phase 9: Dashboards & Reports Module
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Current Project State

Phases 1 through 8 are complete. The following is fully operational:

- **Foundation & Infrastructure**: Project scaffold, design tokens, Tailwind v4, all three Zustand stores, Axios client with 401 refresh queue, React Query with all key factories, App Shell (Sidebar, TopBar, Breadcrumb), middleware, all shared components, i18n (EN + AM)
- **Auth Module**: Login, logout, forgot-password, reset-password, idle session timeout, silent token refresh
- **Cases Module**: Cases list, multi-step case creation wizard, case detail layout (header card, interactive status badge, nine-tab navigation), case overview tab, case timeline tab, status transition drawer
- **Evidence Module**: Evidence tab, upload drawer (Cloudinary three-step flow), chain of custody timeline, lightbox viewer
- **Arrests Module**: Arrests tab (DataTable + filter bar), create arrest drawer, arrest detail drawer, update detention/bail status drawer
- **Interrogations Module**: Interrogations tab (DataTable + filter bar), create interrogation drawer, read-only interrogation detail drawer
- **Legal Module**: Legal tab (court case panel + charges table), create/update court case drawers, add/update/drop charge drawers, record/view sentence drawers, court cases list page
- **Personnel Module**: Person list page (PII masking), person detail page (role cards, PII reveal), role promotion drawers (Suspect, Victim, Witness), officer list page, officer detail page, officer management dialogs, create person drawer, create officer drawer
- **Departments & Admin Module**: Department list page, department detail page (single-column), all department management drawers/dialogs (Create, Update, Delete, AssignHead, RemoveHead), Locations admin page, Crime Types admin page, System Health panel (15s polling), `DepartmentSelect` shared component
- **Route coverage**: `/departments`, `/departments/[departmentId]`, `/admin/locations`, `/admin/crime-types`, `/admin/health` are fully operational; `/dashboard` and `/reports` skeletons are in place
- **i18n completeness**: Passes for `common`, `auth`, `navigation`, `errors`, `accessibility`, `cases`, `evidence`, `arrests`, `interrogations`, `legal`, `personnel`, `departments`, and `admin` namespaces

## 1.2 Phase 9 Objective

Phase 9 delivers two modules:

1. **Dashboards Module** — The operational home screen for every role. Rather than a generic landing page, the dashboard renders role-appropriate KPI widgets, data tables, and chart visualisations derived from each officer's operational context. Investigators see their caseload. Department heads see unit performance. Administrators see system-wide metrics. Legal officers see upcoming court obligations.

2. **Reports Module** — A read-only analytical layer over aggregated system data. Reports are filterable by date range and department scope, rendered with Recharts visualisations, and exportable to CSV for court documentation and administrative review.

**Phase 9 delivers eight sub-systems:**

1. **Dashboard Role Router** — Replaces the Phase 1 skeleton at `/dashboard`. Detects the authenticated officer's role and renders the correct dashboard variant.
2. **Investigator Dashboard** — KPI strip (open cases, under-investigation, referred to court, overdue actions), assigned cases table, recent evidence log, pending actions widget.
3. **Department Head Dashboard** — KPI strip (active cases, resolution rate, average case age, open arrests), case status donut chart, workload-by-officer horizontal bar chart, department activity feed, reports quick-links.
4. **Admin Dashboard** — KPI strip (total cases, total officers, total evidence, system health indicator), 30-day case volume trend line chart, security events alert panel, department overview table, pending admin tasks widget.
5. **Legal Officer Dashboard** — KPI strip (open court cases, charges filed this month, upcoming hearings, conviction rate), upcoming hearings list, recent charges table.
6. **Reports Shell** — Replaces the Phase 1 skeleton at `/reports`. Left sub-navigation panel (within the main content area), shared date-range filter bar with presets, department scope selector. Filter state is URL-driven.
7. **Six Report Sub-Pages** — `/reports/cases`, `/reports/evidence`, `/reports/arrests`, `/reports/officers`, `/reports/legal`, `/reports/departments`. Each contains multiple chart and table visualisations with CSV export.
8. **Shared Chart & KPI Components** — `KpiCard`, `CcmsLineChart`, `CcmsBarChart`, `CcmsDonutChart`, `DateRangePicker` — consumed across both modules.

**Also in scope:**

- `dashboard` feature module: full type definitions, Zod schemas, service implementation (4 aggregate endpoints), React Query hooks
- `reports` feature module: full type definitions, Zod schemas, service implementation (15 endpoints + CSV export utility), React Query hooks
- `dashboardKeys` query key factory at `src/services/query/keys/dashboardKeys.ts`
- `reportKeys` query key factory at `src/services/query/keys/reportKeys.ts`
- `dashboard.service.ts` with 4 role-scoped aggregate dashboard endpoints
- `reports.service.ts` with all 15 reporting endpoints and `downloadReportCsv` utility
- New shared components: `KpiCard` (`src/shared/components/display/KpiCard.tsx`), `CcmsLineChart`, `CcmsBarChart`, `CcmsDonutChart` (`src/shared/components/charts/`), `DateRangePicker` (`src/shared/components/forms/DateRangePicker.tsx`)
- Chart colour constant file: `src/shared/constants/chartColors.ts`
- Full population of `messages/en/dashboard.json`, `messages/am/dashboard.json`, `messages/en/reports.json`, `messages/am/reports.json`
- New nested layout `src/app/(dashboard)/reports/layout.tsx`
- New route pages for all six report sub-pages

## 1.3 Package Manager

All commands use **pnpm**. No npm or yarn.

## 1.4 What Must Be Completed

**Dashboard service (`src/services/domain/dashboard.service.ts`):**
- 4 role-scoped aggregate GET endpoints (see §10)
- Response validation via Zod `.parse()` on every response
- No `any` types

**Reports service (`src/services/domain/reports.service.ts`):**
- All 15 reporting endpoints (see §11)
- `downloadReportCsv` utility using `axiosInstance` with `responseType: 'blob'`
- All responses validated via Zod `.parse()`
- No `any` types

**Dashboard types and schemas:**
- `InvestigatorDashboardData`, `DeptHeadDashboardData`, `AdminDashboardData`, `LegalDashboardData`
- Nested KPI, widget, and activity types
- All API response Zod schemas

**Reports types and schemas:**
- `ReportFilters`, `DatePreset`
- 15 report response types (see §5)
- All API response Zod schemas

**React Query hooks — Dashboard:**
- `useInvestigatorDashboard()` — 60s poll
- `useDeptHeadDashboard()` — 60s poll
- `useAdminDashboard()` — 60s poll
- `useLegalDashboard()` — 60s poll

**React Query hooks — Reports:**
- `useCaseStatusSummary(filters)` — Case status breakdown
- `useCaseVolumeTrend(filters)` — Daily new-case time series
- `useCaseResolutionReport(filters)` — Resolution rate + average age
- `useEvidenceTypeBreakdown(filters)` — Evidence count by type
- `useEvidenceVolumeTrend(filters)` — Evidence added over time
- `useUnreviewedEvidenceReport(filters)` — Unreviewed evidence items
- `useArrestSummary(filters)` — Arrest totals + change
- `useArrestMonthlyTrend(filters)` — Monthly arrest time series
- `useOfficerWorkloadReport(filters)` — Cases per officer
- `useOfficerActivityReport(filters)` — Activity metrics per officer
- `useChargeOutcomeReport(filters)` — Charge outcome breakdown
- `useConvictionRateTrend(filters)` — Conviction rate over time
- `useUpcomingHearingsReport(filters)` — Hearings in date range
- `useDepartmentComparisonReport(filters)` — Cross-department stats (admin+)
- `useDepartmentCaseDistribution(filters)` — Case load by department (admin+)

**Shared components:**
- `KpiCard` at `src/shared/components/display/KpiCard.tsx`
- `CcmsLineChart` at `src/shared/components/charts/CcmsLineChart.tsx`
- `CcmsBarChart` at `src/shared/components/charts/CcmsBarChart.tsx`
- `CcmsDonutChart` at `src/shared/components/charts/CcmsDonutChart.tsx`
- `DateRangePicker` at `src/shared/components/forms/DateRangePicker.tsx`
- `src/shared/constants/chartColors.ts`

**i18n messages:**
- Fully populate `messages/en/dashboard.json`
- Fully populate `messages/am/dashboard.json`
- Fully populate `messages/en/reports.json`
- Fully populate `messages/am/reports.json`

## 1.5 What Must NOT Be Implemented

- **Interactive charts** — Recharts tooltips are the only interactive element. No click-to-drill-down, no zoom, no lasso-select. These are Phase 11.
- **Dashboard customisation** — No drag-to-reorder widgets, no widget toggle, no pin/unpin. Fixed layouts per role only.
- **Saved report filters** — Users cannot save a named filter preset. The URL captures the state; bookmarking is the persistence mechanism.
- **Scheduled reports / report subscriptions** — Not in scope.
- **Print view for reports** — Deferred to Phase 12 hardening.
- **Dashboard date range filter** — The dashboard always shows current operational data (live/near-live). It is NOT filterable by date range. Date range filtering is a Reports concern only.
- **Superadmin-specific dashboard variant** — `SUPERADMIN` renders the Admin dashboard. No separate variant.
- **FORENSIC-specific dashboard variant** — `FORENSIC` renders the Investigator dashboard. No separate variant.
- **Historical health charts on Admin dashboard** — The system health KPI on the Admin dashboard is a single current-status indicator (green/amber/red). Full health history is a Phase 11 concern. Do not embed the `SystemHealthPanel` inside the Admin dashboard. Call the health endpoint directly and show one status indicator only.
- **MSW mocking** — Still deferred.

## 1.6 Dashboard Role Mapping

The `DashboardPage` component reads the officer's role from `authStore` and renders the correct variant. The mapping is:

| Role(s) | Dashboard Variant |
|---|---|
| `INVESTIGATOR`, `FORENSIC` | `InvestigatorDashboard` |
| `LEGAL_OFFICER` | `LegalDashboard` |
| `DEPT_HEAD` | `DeptHeadDashboard` |
| `ADMIN`, `SUPERADMIN` | `AdminDashboard` |

If the role does not match any known variant (e.g., future roles), render a fallback `EmptyState` with message "Dashboard not configured for your role."

## 1.7 Handoff Standard

When Phase 9 finishes:
- Navigating to `/dashboard` renders the correct role-specific dashboard (not the skeleton)
- All four KPI strips render with real data and loading skeletons during fetch
- Dashboard charts render correctly against the CCMS dark theme (dark grid lines, muted axis labels, token-coloured series)
- Dashboard widgets show inline error states on fetch failure (not full-page errors)
- Dashboard widgets do NOT show the skeleton loading state on 60-second background refetches — existing data stays visible
- Navigating to `/reports` redirects to `/reports/cases`
- The reports left sub-navigation is visible and highlights the active sub-page
- All six report sub-pages render with filter-driven data
- Date range presets (Last 7 Days, Last 30 Days, Last Quarter, Custom) work correctly
- Changing the date range updates all report visualisations on the current sub-page
- Department filter is visible and functional for `ADMIN` and `SUPERADMIN`; absent (backend auto-scopes) for `DEPT_HEAD`
- CSV export button on each report triggers a file download named `ccms-{report-type}-{date}.csv`
- `/reports/departments` shows `ForbiddenState` for roles below `ADMIN`
- Recharts tooltips display full numeric values in the CCMS card/border colour scheme
- `pnpm type-check` — zero errors
- `pnpm lint` — zero warnings
- `pnpm build` — production build succeeds
- i18n completeness test passes for `dashboard` and `reports` namespaces in both EN and AM

---

# 2. Dependencies

No new packages are required. All dependencies from prior phases are already installed:

```bash
pnpm why recharts
pnpm why date-fns
pnpm why nuqs
pnpm why @tanstack/react-query
pnpm why lucide-react
pnpm why zod
```

Recharts is used exclusively for charts. Import only the components required per chart type. Do not install `chart.js`, `victory`, `d3`, or any other charting library.

---

# 3. File & Directory Structure

```
src/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardPage.tsx                   # Role router — renders correct variant
│   │   │   ├── investigator/
│   │   │   │   ├── InvestigatorDashboard.tsx        # Orchestration wrapper
│   │   │   │   ├── MyCasesKpiStrip.tsx              # 4-card KPI row
│   │   │   │   ├── AssignedCasesWidget.tsx          # Compact DataTable
│   │   │   │   ├── RecentEvidenceWidget.tsx         # Last 5 evidence items
│   │   │   │   └── PendingActionsWidget.tsx         # Evidence/case action counts
│   │   │   ├── dept-head/
│   │   │   │   ├── DeptHeadDashboard.tsx
│   │   │   │   ├── DepartmentKpiStrip.tsx
│   │   │   │   ├── CaseStatusChartWidget.tsx        # Donut chart
│   │   │   │   ├── WorkloadByOfficerWidget.tsx      # Horizontal bar chart
│   │   │   │   ├── DepartmentActivityWidget.tsx     # Activity feed list
│   │   │   │   └── ReportsQuickLinksWidget.tsx      # Shortcut cards
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── SystemKpiStrip.tsx
│   │   │   │   ├── CaseVolumeTrendWidget.tsx        # Line chart (30 days)
│   │   │   │   ├── SecurityEventsWidget.tsx         # Alert panel
│   │   │   │   ├── DepartmentOverviewWidget.tsx     # Mini-table
│   │   │   │   └── PendingAdminTasksWidget.tsx      # Counts + links
│   │   │   └── legal/
│   │   │       ├── LegalDashboard.tsx
│   │   │       ├── LegalKpiStrip.tsx
│   │   │       ├── UpcomingHearingsWidget.tsx       # Chronological list
│   │   │       └── RecentChargesWidget.tsx          # Compact table
│   │   ├── hooks/
│   │   │   ├── useInvestigatorDashboard.ts
│   │   │   ├── useDeptHeadDashboard.ts
│   │   │   ├── useAdminDashboard.ts
│   │   │   ├── useLegalDashboard.ts
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   └── dashboard-api.schema.ts
│   │   ├── types/
│   │   │   ├── dashboard.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── reports/
│       ├── components/
│       │   ├── ReportsShell.tsx                     # Left sub-nav + content outlet
│       │   ├── ReportsFilterBar.tsx                 # Date range + department filter
│       │   ├── ReportsNavItem.tsx                   # Sub-nav item component
│       │   ├── cases/
│       │   │   └── CaseReports.tsx
│       │   ├── evidence/
│       │   │   └── EvidenceReports.tsx
│       │   ├── arrests/
│       │   │   └── ArrestReports.tsx
│       │   ├── officers/
│       │   │   └── OfficerWorkloadReports.tsx
│       │   ├── legal/
│       │   │   └── LegalReports.tsx
│       │   └── departments/
│       │       └── DepartmentReports.tsx
│       ├── hooks/
│       │   ├── useCaseStatusSummary.ts
│       │   ├── useCaseVolumeTrend.ts
│       │   ├── useCaseResolutionReport.ts
│       │   ├── useEvidenceTypeBreakdown.ts
│       │   ├── useEvidenceVolumeTrend.ts
│       │   ├── useUnreviewedEvidenceReport.ts
│       │   ├── useArrestSummary.ts
│       │   ├── useArrestMonthlyTrend.ts
│       │   ├── useOfficerWorkloadReport.ts
│       │   ├── useOfficerActivityReport.ts
│       │   ├── useChargeOutcomeReport.ts
│       │   ├── useConvictionRateTrend.ts
│       │   ├── useUpcomingHearingsReport.ts
│       │   ├── useDepartmentComparisonReport.ts
│       │   ├── useDepartmentCaseDistribution.ts
│       │   └── index.ts
│       ├── schemas/
│       │   └── reports-api.schema.ts
│       ├── types/
│       │   ├── reports.types.ts
│       │   └── index.ts
│       ├── utils/
│       │   └── reportUtils.ts
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── display/
│   │   │   └── KpiCard.tsx                          # New shared component
│   │   └── charts/
│   │       ├── CcmsLineChart.tsx                    # New — CCMS-themed Recharts line chart
│   │       ├── CcmsBarChart.tsx                     # New — CCMS-themed Recharts bar chart
│   │       └── CcmsDonutChart.tsx                   # New — CCMS-themed Recharts donut chart
│   │   └── forms/
│   │       └── DateRangePicker.tsx                  # New shared component
│   └── constants/
│       └── chartColors.ts                           # New — chart hex colours

├── services/
│   ├── domain/
│   │   ├── dashboard.service.ts                     # New
│   │   └── reports.service.ts                       # New
│   └── query/
│       └── keys/
│           ├── dashboardKeys.ts                     # New
│           └── reportKeys.ts                        # New

└── app/
    └── (dashboard)/
        ├── dashboard/
        │   └── page.tsx                             # Replaces Phase 1 skeleton
        └── reports/
            ├── layout.tsx                           # New — reports shell layout
            ├── page.tsx                             # Redirects to /reports/cases
            ├── cases/
            │   └── page.tsx
            ├── evidence/
            │   └── page.tsx
            ├── arrests/
            │   └── page.tsx
            ├── officers/
            │   └── page.tsx
            ├── legal/
            │   └── page.tsx
            └── departments/
                └── page.tsx

messages/
├── en/
│   ├── dashboard.json                               # Full EN population
│   └── reports.json                                 # Full EN population
└── am/
    ├── dashboard.json                               # Full AM population
    └── reports.json                                 # Full AM population
```

---

# 4. TypeScript Types — Dashboard

## 4.1 `src/features/dashboard/types/dashboard.types.ts`

```typescript
// ─── Shared mini-types used across dashboard variants ────────────────────────

export interface DashboardKpiItem {
  value: number | string
  changePercent: number | null   // positive = improvement, negative = decline; null = N/A
}

export interface DashboardActivityEntry {
  actorName: string
  action: string                 // Human-readable description from server
  timestamp: string              // ISO 8601
}

// ─── Investigator Dashboard ───────────────────────────────────────────────────

export interface InvestigatorKpis {
  openCaseCount: number
  underInvestigationCount: number
  referredToCourtCount: number
  overdueActionCount: number
}

export interface InvestigatorPendingActions {
  evidenceMissingCustodyCount: number
  casesWithoutRecentUpdateCount: number  // Cases open >30 days without a timeline event
}

export interface InvestigatorCaseSummary {
  id: string
  caseNumber: string
  title: string
  status: string                 // CaseStatus string value
  crimeTypeName: string | null
  lastUpdatedAt: string
}

export interface InvestigatorDashboardData {
  kpis: InvestigatorKpis
  recentCases: InvestigatorCaseSummary[]      // Last 10 cases assigned to this officer
  pendingActions: InvestigatorPendingActions
}

// ─── Department Head Dashboard ────────────────────────────────────────────────

export interface DeptHeadKpis {
  totalActiveCaseCount: number
  resolutionRatePercent: number | null
  averageCaseAgeDays: number | null
  openArrestCount: number
}

export interface CaseStatusDataPoint {
  status: string
  count: number
  percentage: number
}

export interface OfficerWorkloadDataPoint {
  officerId: string
  fullName: string               // "firstName lastName"
  badgeNumber: string
  activeCaseCount: number
}

export interface DeptHeadDashboardData {
  kpis: DeptHeadKpis
  casesByStatus: CaseStatusDataPoint[]
  workloadByOfficer: OfficerWorkloadDataPoint[]  // Up to 10 officers, sorted by activeCaseCount desc
  recentActivity: DashboardActivityEntry[]        // Last 15 events in the department
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface AdminKpis {
  totalCaseCount: number
  totalOfficerCount: number
  totalEvidenceCount: number
  systemHealthStatus: string     // 'healthy' | 'degraded' | 'down'
}

export interface CaseVolumeTrendDataPoint {
  date: string                   // 'YYYY-MM-DD'
  count: number
}

export interface SecurityEventSeverity {
  low: 'low'
  medium: 'medium'
  high: 'high'
}

export interface SecurityEvent {
  id: string
  type: string                   // 'login_failure' | 'permission_change' | 'role_change' | 'forced_logout'
  actorName: string
  actorBadgeNumber: string
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

export interface DepartmentOverviewItem {
  departmentId: string
  departmentName: string
  activeCaseCount: number
  officerCount: number
}

export interface AdminPendingTasks {
  officersAwaitingActivationCount: number
  departmentsWithoutHeadCount: number
}

export interface AdminDashboardData {
  kpis: AdminKpis
  caseVolumeTrend: CaseVolumeTrendDataPoint[]    // Last 30 calendar days
  securityEvents: SecurityEvent[]                // Last 20 security events
  departmentOverview: DepartmentOverviewItem[]
  pendingTasks: AdminPendingTasks
}

// ─── Legal Dashboard ──────────────────────────────────────────────────────────

export interface LegalKpis {
  openCourtCaseCount: number
  chargesFiledThisMonthCount: number
  upcomingHearingCount: number       // Hearings in the next 30 days
  convictionRatePercent: number | null
}

export interface UpcomingHearingItem {
  courtCaseId: string
  caseNumber: string
  caseTitle: string
  hearingDate: string            // ISO 8601
  courtName: string
  hearingType: string            // Free text from backend
}

export interface RecentChargeDashboardItem {
  id: string
  crimeTypeName: string
  crimeTypeCode: string
  suspectName: string            // Person's full name
  status: string                 // ChargeStatus string value
  filedAt: string
}

export interface LegalDashboardData {
  kpis: LegalKpis
  upcomingHearings: UpcomingHearingItem[]    // Next 10 hearings sorted by date asc
  recentCharges: RecentChargeDashboardItem[] // Last 10 charges filed
}
```

## 4.2 `src/features/dashboard/types/index.ts`

```typescript
export * from './dashboard.types'
```

---

# 5. TypeScript Types — Reports

## 5.1 `src/features/reports/types/reports.types.ts`

```typescript
// ─── Shared filter type ───────────────────────────────────────────────────────

export interface ReportFilters {
  dateFrom: string               // 'YYYY-MM-DD'
  dateTo: string                 // 'YYYY-MM-DD'
  departmentId?: string          // Admin+ only; omitted = all departments (admin) or own dept (dept head)
}

export const DatePreset = {
  LAST_7_DAYS:   'last7days',
  LAST_30_DAYS:  'last30days',
  LAST_QUARTER:  'lastQuarter',
  CUSTOM:        'custom',
} as const
export type DatePreset = (typeof DatePreset)[keyof typeof DatePreset]

// ─── Case reports ──────────────────────────────────────────────────────────────

export interface CaseStatusBreakdownItem {
  status: string                 // CaseStatus string value
  count: number
  percentage: number
}

export interface CaseStatusSummary {
  total: number
  byStatus: CaseStatusBreakdownItem[]
  periodStart: string
  periodEnd: string
}

export interface CaseVolumeTrendPoint {
  date: string                   // 'YYYY-MM-DD'
  count: number
}

export interface CaseVolumeTrend {
  dataPoints: CaseVolumeTrendPoint[]
  totalInPeriod: number
  periodStart: string
  periodEnd: string
}

export interface CaseResolutionReport {
  totalClosed: number
  resolutionRatePercent: number | null
  averageAgeDays: number | null
  medianAgeDays: number | null
  periodStart: string
  periodEnd: string
}

// ─── Evidence reports ─────────────────────────────────────────────────────────

export interface EvidenceTypeBreakdownItem {
  type: string
  count: number
  percentage: number
}

export interface EvidenceTypeBreakdown {
  total: number
  byType: EvidenceTypeBreakdownItem[]
  periodStart: string
  periodEnd: string
}

export interface EvidenceVolumeTrendPoint {
  date: string                   // 'YYYY-MM-DD'
  count: number
}

export interface EvidenceVolumeTrend {
  dataPoints: EvidenceVolumeTrendPoint[]
  totalInPeriod: number
  periodStart: string
  periodEnd: string
}

export interface UnreviewedEvidenceItem {
  id: string
  caseNumber: string
  caseTitle: string
  type: string
  collectedAt: string
  daysUnreviewed: number
}

export interface UnreviewedEvidenceReport {
  count: number
  items: UnreviewedEvidenceItem[]
  periodStart: string
  periodEnd: string
}

// ─── Arrest reports ───────────────────────────────────────────────────────────

export interface ArrestSummary {
  totalInPeriod: number
  changePercent: number | null   // vs. previous equivalent period; null if no prior data
  periodStart: string
  periodEnd: string
}

export interface ArrestMonthlyTrendPoint {
  month: string                  // 'YYYY-MM'
  count: number
}

export interface ArrestMonthlyTrend {
  dataPoints: ArrestMonthlyTrendPoint[]
  periodStart: string
  periodEnd: string
}

// ─── Officer reports ──────────────────────────────────────────────────────────

export interface OfficerWorkloadItem {
  officerId: string
  firstName: string
  lastName: string
  badgeNumber: string
  activeCaseCount: number
  totalCasesInPeriod: number
  closedCasesInPeriod: number
}

export interface OfficerWorkloadReport {
  officers: OfficerWorkloadItem[]
  periodStart: string
  periodEnd: string
}

export interface OfficerActivityItem {
  officerId: string
  firstName: string
  lastName: string
  badgeNumber: string
  evidenceItemsLogged: number
  interrogationsConducted: number
  arrestsRecorded: number
}

export interface OfficerActivityReport {
  officers: OfficerActivityItem[]
  periodStart: string
  periodEnd: string
}

// ─── Legal reports ────────────────────────────────────────────────────────────

export interface ChargeOutcomeBreakdownItem {
  outcome: string                // 'convicted' | 'acquitted' | 'dropped' | 'pending'
  count: number
  percentage: number
}

export interface ChargeOutcomeReport {
  total: number
  byOutcome: ChargeOutcomeBreakdownItem[]
  periodStart: string
  periodEnd: string
}

export interface ConvictionRateTrendPoint {
  month: string                  // 'YYYY-MM'
  ratePercent: number
  totalCharges: number
  convictions: number
}

export interface ConvictionRateTrend {
  overallRatePercent: number | null
  dataPoints: ConvictionRateTrendPoint[]
  periodStart: string
  periodEnd: string
}

export interface UpcomingHearingReportItem {
  courtCaseId: string
  caseNumber: string
  caseTitle: string
  courtName: string
  hearingDate: string
  hearingType: string
  assignedOfficerName: string | null
}

export interface UpcomingHearingsReport {
  hearings: UpcomingHearingReportItem[]
  total: number
  periodStart: string
  periodEnd: string
}

// ─── Department reports (admin+) ──────────────────────────────────────────────

export interface DepartmentComparisonItem {
  departmentId: string
  departmentName: string
  activeCaseCount: number
  closedCaseCount: number
  officerCount: number
  resolutionRatePercent: number | null
  averageCaseAgeDays: number | null
}

export interface DepartmentComparisonReport {
  departments: DepartmentComparisonItem[]
  periodStart: string
  periodEnd: string
}

export interface DepartmentCaseDistributionItem {
  departmentId: string
  departmentName: string
  count: number
  percentage: number
}

export interface DepartmentCaseDistribution {
  total: number
  byDepartment: DepartmentCaseDistributionItem[]
  periodStart: string
  periodEnd: string
}
```

## 5.2 `src/features/reports/types/index.ts`

```typescript
export * from './reports.types'
```

---

# 6. Zod Schemas — Dashboard

## 6.1 `src/features/dashboard/schemas/dashboard-api.schema.ts`

```typescript
import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────
const activityEntrySchema = z.object({
  actorName: z.string(),
  action: z.string(),
  timestamp: z.string(),
})

// ─── Investigator Dashboard ───────────────────────────────────────────────────
export const investigatorDashboardSchema = z.object({
  kpis: z.object({
    openCaseCount: z.number(),
    underInvestigationCount: z.number(),
    referredToCourtCount: z.number(),
    overdueActionCount: z.number(),
  }),
  recentCases: z.array(z.object({
    id: z.string().uuid(),
    caseNumber: z.string(),
    title: z.string(),
    status: z.string(),
    crimeTypeName: z.string().nullable(),
    lastUpdatedAt: z.string(),
  })),
  pendingActions: z.object({
    evidenceMissingCustodyCount: z.number(),
    casesWithoutRecentUpdateCount: z.number(),
  }),
})

// ─── Department Head Dashboard ────────────────────────────────────────────────
export const deptHeadDashboardSchema = z.object({
  kpis: z.object({
    totalActiveCaseCount: z.number(),
    resolutionRatePercent: z.number().nullable(),
    averageCaseAgeDays: z.number().nullable(),
    openArrestCount: z.number(),
  }),
  casesByStatus: z.array(z.object({
    status: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  workloadByOfficer: z.array(z.object({
    officerId: z.string().uuid(),
    fullName: z.string(),
    badgeNumber: z.string(),
    activeCaseCount: z.number(),
  })),
  recentActivity: z.array(activityEntrySchema),
})

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export const adminDashboardSchema = z.object({
  kpis: z.object({
    totalCaseCount: z.number(),
    totalOfficerCount: z.number(),
    totalEvidenceCount: z.number(),
    systemHealthStatus: z.enum(['healthy', 'degraded', 'down']),
  }),
  caseVolumeTrend: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  securityEvents: z.array(z.object({
    id: z.string(),
    type: z.string(),
    actorName: z.string(),
    actorBadgeNumber: z.string(),
    description: z.string(),
    timestamp: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  departmentOverview: z.array(z.object({
    departmentId: z.string().uuid(),
    departmentName: z.string(),
    activeCaseCount: z.number(),
    officerCount: z.number(),
  })),
  pendingTasks: z.object({
    officersAwaitingActivationCount: z.number(),
    departmentsWithoutHeadCount: z.number(),
  }),
})

// ─── Legal Dashboard ──────────────────────────────────────────────────────────
export const legalDashboardSchema = z.object({
  kpis: z.object({
    openCourtCaseCount: z.number(),
    chargesFiledThisMonthCount: z.number(),
    upcomingHearingCount: z.number(),
    convictionRatePercent: z.number().nullable(),
  }),
  upcomingHearings: z.array(z.object({
    courtCaseId: z.string().uuid(),
    caseNumber: z.string(),
    caseTitle: z.string(),
    hearingDate: z.string(),
    courtName: z.string(),
    hearingType: z.string(),
  })),
  recentCharges: z.array(z.object({
    id: z.string().uuid(),
    crimeTypeName: z.string(),
    crimeTypeCode: z.string(),
    suspectName: z.string(),
    status: z.string(),
    filedAt: z.string(),
  })),
})
```

---

# 7. Zod Schemas — Reports

## 7.1 `src/features/reports/schemas/reports-api.schema.ts`

```typescript
import { z } from 'zod'

// ─── Case report schemas ───────────────────────────────────────────────────────
export const caseStatusSummarySchema = z.object({
  total: z.number(),
  byStatus: z.array(z.object({
    status: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const caseVolumeTrendSchema = z.object({
  dataPoints: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  totalInPeriod: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const caseResolutionReportSchema = z.object({
  totalClosed: z.number(),
  resolutionRatePercent: z.number().nullable(),
  averageAgeDays: z.number().nullable(),
  medianAgeDays: z.number().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

// ─── Evidence report schemas ───────────────────────────────────────────────────
export const evidenceTypeBreakdownSchema = z.object({
  total: z.number(),
  byType: z.array(z.object({
    type: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const evidenceVolumeTrendSchema = z.object({
  dataPoints: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  totalInPeriod: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const unreviewedEvidenceReportSchema = z.object({
  count: z.number(),
  items: z.array(z.object({
    id: z.string().uuid(),
    caseNumber: z.string(),
    caseTitle: z.string(),
    type: z.string(),
    collectedAt: z.string(),
    daysUnreviewed: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

// ─── Arrest report schemas ─────────────────────────────────────────────────────
export const arrestSummarySchema = z.object({
  totalInPeriod: z.number(),
  changePercent: z.number().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const arrestMonthlyTrendSchema = z.object({
  dataPoints: z.array(z.object({
    month: z.string(),
    count: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

// ─── Officer report schemas ────────────────────────────────────────────────────
export const officerWorkloadReportSchema = z.object({
  officers: z.array(z.object({
    officerId: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    badgeNumber: z.string(),
    activeCaseCount: z.number(),
    totalCasesInPeriod: z.number(),
    closedCasesInPeriod: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const officerActivityReportSchema = z.object({
  officers: z.array(z.object({
    officerId: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    badgeNumber: z.string(),
    evidenceItemsLogged: z.number(),
    interrogationsConducted: z.number(),
    arrestsRecorded: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

// ─── Legal report schemas ──────────────────────────────────────────────────────
export const chargeOutcomeReportSchema = z.object({
  total: z.number(),
  byOutcome: z.array(z.object({
    outcome: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const convictionRateTrendSchema = z.object({
  overallRatePercent: z.number().nullable(),
  dataPoints: z.array(z.object({
    month: z.string(),
    ratePercent: z.number(),
    totalCharges: z.number(),
    convictions: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const upcomingHearingsReportSchema = z.object({
  hearings: z.array(z.object({
    courtCaseId: z.string().uuid(),
    caseNumber: z.string(),
    caseTitle: z.string(),
    courtName: z.string(),
    hearingDate: z.string(),
    hearingType: z.string(),
    assignedOfficerName: z.string().nullable(),
  })),
  total: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

// ─── Department report schemas (admin+) ───────────────────────────────────────
export const departmentComparisonReportSchema = z.object({
  departments: z.array(z.object({
    departmentId: z.string().uuid(),
    departmentName: z.string(),
    activeCaseCount: z.number(),
    closedCaseCount: z.number(),
    officerCount: z.number(),
    resolutionRatePercent: z.number().nullable(),
    averageCaseAgeDays: z.number().nullable(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const departmentCaseDistributionSchema = z.object({
  total: z.number(),
  byDepartment: z.array(z.object({
    departmentId: z.string().uuid(),
    departmentName: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  periodStart: z.string(),
  periodEnd: z.string(),
})
```

---

# 8. Utils

## 8.1 `src/features/reports/utils/reportUtils.ts`

```typescript
import { format, subDays, subMonths, startOfQuarter, endOfQuarter } from 'date-fns'
import { DatePreset } from '../types/reports.types'

// ─── Date preset resolver ─────────────────────────────────────────────────────
// Returns [dateFrom, dateTo] as 'YYYY-MM-DD' strings for a given preset.
export function resolveDatePreset(preset: DatePreset): {
  dateFrom: string
  dateTo: string
} {
  const today = new Date()
  switch (preset) {
    case DatePreset.LAST_7_DAYS:
      return {
        dateFrom: format(subDays(today, 6), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
    case DatePreset.LAST_30_DAYS:
      return {
        dateFrom: format(subDays(today, 29), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
    case DatePreset.LAST_QUARTER: {
      const lastQuarterEnd = subDays(startOfQuarter(today), 1)
      return {
        dateFrom: format(startOfQuarter(lastQuarterEnd), 'yyyy-MM-dd'),
        dateTo: format(endOfQuarter(lastQuarterEnd), 'yyyy-MM-dd'),
      }
    }
    case DatePreset.CUSTOM:
      // Custom range: caller provides dateFrom/dateTo directly
      return {
        dateFrom: format(subDays(today, 29), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      }
  }
}

// ─── Default filter (Last 30 Days) ───────────────────────────────────────────
export function getDefaultReportFilters() {
  return resolveDatePreset(DatePreset.LAST_30_DAYS)
}

// ─── Build report URL params ──────────────────────────────────────────────────
export function buildReportParams(
  filters: { dateFrom: string; dateTo: string; departmentId?: string },
): string {
  const p = new URLSearchParams()
  p.set('dateFrom', filters.dateFrom)
  p.set('dateTo', filters.dateTo)
  if (filters.departmentId) p.set('departmentId', filters.departmentId)
  return p.toString()
}

// ─── Format percentage for display ───────────────────────────────────────────
export function formatPercent(value: number | null, fallback = '—'): string {
  if (value === null) return fallback
  return `${value.toFixed(1)}%`
}

// ─── Format change indicator ──────────────────────────────────────────────────
// Returns "+12.3%" or "-4.5%" or "—"
export function formatChange(changePercent: number | null): string {
  if (changePercent === null) return '—'
  const sign = changePercent >= 0 ? '+' : ''
  return `${sign}${changePercent.toFixed(1)}%`
}

// ─── Change direction ─────────────────────────────────────────────────────────
export function getChangeDirection(
  changePercent: number | null,
): 'up' | 'down' | 'neutral' {
  if (changePercent === null || changePercent === 0) return 'neutral'
  return changePercent > 0 ? 'up' : 'down'
}

// ─── CSV filename ─────────────────────────────────────────────────────────────
export function buildCsvFilename(reportType: string): string {
  return `ccms-${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
}
```

## 8.2 `src/shared/constants/chartColors.ts`

```typescript
// ─── CCMS Chart Colour Constants ─────────────────────────────────────────────
// Recharts requires hex colours — CSS variables are not supported.
// These values correspond exactly to the CCMS dark-mode design tokens.

export const CHART_COLORS = {
  primary:     '#3B82F6',    // --color-primary (blue)
  success:     '#22C55E',    // --color-success (green)
  warning:     '#F59E0B',    // --color-warning (amber)
  destructive: '#EF4444',    // --color-destructive (red)
  accent:      '#6366F1',    // --color-accent (indigo)
  muted:       '#64748B',    // --color-muted (slate)
  pink:        '#EC4899',
  teal:        '#14B8A6',
  orange:      '#F97316',
  violet:      '#8B5CF6',

  // Axis, grid, and tooltip chrome (dark theme)
  axisLabel:       '#94A3B8',    // --color-foreground-muted
  gridLine:        '#334155',    // --color-border
  tooltipBg:       '#1E293B',    // --color-card
  tooltipBorder:   '#334155',    // --color-border
  tooltipText:     '#F1F5F9',    // --color-foreground

  // Ordered palette for multi-series charts (use series[index % series.length])
  series: [
    '#3B82F6',  // primary blue
    '#22C55E',  // success green
    '#F59E0B',  // warning amber
    '#6366F1',  // accent indigo
    '#EF4444',  // destructive red
    '#EC4899',  // pink
    '#14B8A6',  // teal
    '#F97316',  // orange
  ] as const,
} as const
```

---

# 9. Query Key Factories

## 9.1 `src/services/query/keys/dashboardKeys.ts`

```typescript
export const dashboardKeys = {
  all: () => ['dashboard'] as const,
  investigator: () => [...dashboardKeys.all(), 'investigator'] as const,
  deptHead:     () => [...dashboardKeys.all(), 'dept-head'] as const,
  admin:        () => [...dashboardKeys.all(), 'admin'] as const,
  legal:        () => [...dashboardKeys.all(), 'legal'] as const,
} as const
```

## 9.2 `src/services/query/keys/reportKeys.ts`

```typescript
export const reportKeys = {
  all: () => ['reports'] as const,

  // ── Case reports ─────────────────────────────────────────────────────────
  cases: () => [...reportKeys.all(), 'cases'] as const,
  caseStatusSummary:  (filters: Record<string, unknown>) =>
    [...reportKeys.cases(), 'status-summary', filters] as const,
  caseVolumeTrend:    (filters: Record<string, unknown>) =>
    [...reportKeys.cases(), 'volume-trend', filters] as const,
  caseResolution:     (filters: Record<string, unknown>) =>
    [...reportKeys.cases(), 'resolution', filters] as const,

  // ── Evidence reports ──────────────────────────────────────────────────────
  evidence: () => [...reportKeys.all(), 'evidence'] as const,
  evidenceTypeBreakdown: (filters: Record<string, unknown>) =>
    [...reportKeys.evidence(), 'type-breakdown', filters] as const,
  evidenceVolumeTrend:   (filters: Record<string, unknown>) =>
    [...reportKeys.evidence(), 'volume-trend', filters] as const,
  unreviewedEvidence:    (filters: Record<string, unknown>) =>
    [...reportKeys.evidence(), 'unreviewed', filters] as const,

  // ── Arrest reports ────────────────────────────────────────────────────────
  arrests: () => [...reportKeys.all(), 'arrests'] as const,
  arrestSummary:       (filters: Record<string, unknown>) =>
    [...reportKeys.arrests(), 'summary', filters] as const,
  arrestMonthlyTrend:  (filters: Record<string, unknown>) =>
    [...reportKeys.arrests(), 'monthly-trend', filters] as const,

  // ── Officer reports ───────────────────────────────────────────────────────
  officers: () => [...reportKeys.all(), 'officers'] as const,
  officerWorkload:  (filters: Record<string, unknown>) =>
    [...reportKeys.officers(), 'workload', filters] as const,
  officerActivity:  (filters: Record<string, unknown>) =>
    [...reportKeys.officers(), 'activity', filters] as const,

  // ── Legal reports ─────────────────────────────────────────────────────────
  legal: () => [...reportKeys.all(), 'legal'] as const,
  chargeOutcomes:      (filters: Record<string, unknown>) =>
    [...reportKeys.legal(), 'charge-outcomes', filters] as const,
  convictionRateTrend: (filters: Record<string, unknown>) =>
    [...reportKeys.legal(), 'conviction-rate-trend', filters] as const,
  upcomingHearings:    (filters: Record<string, unknown>) =>
    [...reportKeys.legal(), 'upcoming-hearings', filters] as const,

  // ── Department reports (admin+) ───────────────────────────────────────────
  departments: () => [...reportKeys.all(), 'departments'] as const,
  deptComparison:      (filters: Record<string, unknown>) =>
    [...reportKeys.departments(), 'comparison', filters] as const,
  deptCaseDistribution:(filters: Record<string, unknown>) =>
    [...reportKeys.departments(), 'case-distribution', filters] as const,
} as const
```

---

# 10. Service Layer — Dashboard

## 10.1 `src/services/domain/dashboard.service.ts`

```typescript
import { apiClient } from '@services/api/client'
import {
  investigatorDashboardSchema,
  deptHeadDashboardSchema,
  adminDashboardSchema,
  legalDashboardSchema,
} from '@features/dashboard/schemas/dashboard-api.schema'
import type {
  InvestigatorDashboardData,
  DeptHeadDashboardData,
  AdminDashboardData,
  LegalDashboardData,
} from '@features/dashboard/types/dashboard.types'

/**
 * GET /api/v1/dashboard/investigator
 * Returns aggregate operational data for the currently authenticated investigator.
 * Backend scopes all data to the calling officer (no officerId param needed).
 */
export async function getInvestigatorDashboard(): Promise<InvestigatorDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/investigator')
  return investigatorDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/dept-head
 * Returns department-scoped aggregate data for the authenticated department head.
 * Backend automatically scopes to the caller's department.
 */
export async function getDeptHeadDashboard(): Promise<DeptHeadDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/dept-head')
  return deptHeadDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/admin
 * Returns system-wide aggregate data for admin/superadmin roles.
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/admin')
  return adminDashboardSchema.parse(raw)
}

/**
 * GET /api/v1/dashboard/legal
 * Returns court-and-charges aggregate data for the authenticated legal officer.
 */
export async function getLegalDashboard(): Promise<LegalDashboardData> {
  const raw = await apiClient.get('/api/v1/dashboard/legal')
  return legalDashboardSchema.parse(raw)
}
```

---

# 11. Service Layer — Reports

## 11.1 `src/services/domain/reports.service.ts`

```typescript
import { apiClient } from '@services/api/client'
// Import axiosInstance (the underlying Axios instance) for blob downloads.
// Ensure @services/api/client exports `axiosInstance` alongside `apiClient`.
import { axiosInstance } from '@services/api/client'
import {
  caseStatusSummarySchema,
  caseVolumeTrendSchema,
  caseResolutionReportSchema,
  evidenceTypeBreakdownSchema,
  evidenceVolumeTrendSchema,
  unreviewedEvidenceReportSchema,
  arrestSummarySchema,
  arrestMonthlyTrendSchema,
  officerWorkloadReportSchema,
  officerActivityReportSchema,
  chargeOutcomeReportSchema,
  convictionRateTrendSchema,
  upcomingHearingsReportSchema,
  departmentComparisonReportSchema,
  departmentCaseDistributionSchema,
} from '@features/reports/schemas/reports-api.schema'
import { buildReportParams, buildCsvFilename } from '@features/reports/utils/reportUtils'
import type {
  ReportFilters,
  CaseStatusSummary,
  CaseVolumeTrend,
  CaseResolutionReport,
  EvidenceTypeBreakdown,
  EvidenceVolumeTrend,
  UnreviewedEvidenceReport,
  ArrestSummary,
  ArrestMonthlyTrend,
  OfficerWorkloadReport,
  OfficerActivityReport,
  ChargeOutcomeReport,
  ConvictionRateTrend,
  UpcomingHearingsReport,
  DepartmentComparisonReport,
  DepartmentCaseDistribution,
} from '@features/reports/types/reports.types'

// ═══════════════════════════════════════════════════════════════════════════════
// CASE REPORTS (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/cases/status-summary */
export async function getCaseStatusSummary(
  filters: ReportFilters,
): Promise<CaseStatusSummary> {
  const raw = await apiClient.get(
    `/api/v1/reports/cases/status-summary?${buildReportParams(filters)}`,
  )
  return caseStatusSummarySchema.parse(raw)
}

/** GET /api/v1/reports/cases/volume-trend */
export async function getCaseVolumeTrend(
  filters: ReportFilters,
): Promise<CaseVolumeTrend> {
  const raw = await apiClient.get(
    `/api/v1/reports/cases/volume-trend?${buildReportParams(filters)}`,
  )
  return caseVolumeTrendSchema.parse(raw)
}

/** GET /api/v1/reports/cases/resolution */
export async function getCaseResolutionReport(
  filters: ReportFilters,
): Promise<CaseResolutionReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/cases/resolution?${buildReportParams(filters)}`,
  )
  return caseResolutionReportSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVIDENCE REPORTS (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/evidence/type-breakdown */
export async function getEvidenceTypeBreakdown(
  filters: ReportFilters,
): Promise<EvidenceTypeBreakdown> {
  const raw = await apiClient.get(
    `/api/v1/reports/evidence/type-breakdown?${buildReportParams(filters)}`,
  )
  return evidenceTypeBreakdownSchema.parse(raw)
}

/** GET /api/v1/reports/evidence/volume-trend */
export async function getEvidenceVolumeTrend(
  filters: ReportFilters,
): Promise<EvidenceVolumeTrend> {
  const raw = await apiClient.get(
    `/api/v1/reports/evidence/volume-trend?${buildReportParams(filters)}`,
  )
  return evidenceVolumeTrendSchema.parse(raw)
}

/** GET /api/v1/reports/evidence/unreviewed */
export async function getUnreviewedEvidenceReport(
  filters: ReportFilters,
): Promise<UnreviewedEvidenceReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/evidence/unreviewed?${buildReportParams(filters)}`,
  )
  return unreviewedEvidenceReportSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARREST REPORTS (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/arrests/summary */
export async function getArrestSummary(
  filters: ReportFilters,
): Promise<ArrestSummary> {
  const raw = await apiClient.get(
    `/api/v1/reports/arrests/summary?${buildReportParams(filters)}`,
  )
  return arrestSummarySchema.parse(raw)
}

/** GET /api/v1/reports/arrests/monthly-trend */
export async function getArrestMonthlyTrend(
  filters: ReportFilters,
): Promise<ArrestMonthlyTrend> {
  const raw = await apiClient.get(
    `/api/v1/reports/arrests/monthly-trend?${buildReportParams(filters)}`,
  )
  return arrestMonthlyTrendSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFICER REPORTS (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/officers/workload */
export async function getOfficerWorkloadReport(
  filters: ReportFilters,
): Promise<OfficerWorkloadReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/officers/workload?${buildReportParams(filters)}`,
  )
  return officerWorkloadReportSchema.parse(raw)
}

/** GET /api/v1/reports/officers/activity */
export async function getOfficerActivityReport(
  filters: ReportFilters,
): Promise<OfficerActivityReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/officers/activity?${buildReportParams(filters)}`,
  )
  return officerActivityReportSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL REPORTS (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/legal/charge-outcomes */
export async function getChargeOutcomeReport(
  filters: ReportFilters,
): Promise<ChargeOutcomeReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/legal/charge-outcomes?${buildReportParams(filters)}`,
  )
  return chargeOutcomeReportSchema.parse(raw)
}

/** GET /api/v1/reports/legal/conviction-rate-trend */
export async function getConvictionRateTrend(
  filters: ReportFilters,
): Promise<ConvictionRateTrend> {
  const raw = await apiClient.get(
    `/api/v1/reports/legal/conviction-rate-trend?${buildReportParams(filters)}`,
  )
  return convictionRateTrendSchema.parse(raw)
}

/** GET /api/v1/reports/legal/upcoming-hearings */
export async function getUpcomingHearingsReport(
  filters: ReportFilters,
): Promise<UpcomingHearingsReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/legal/upcoming-hearings?${buildReportParams(filters)}`,
  )
  return upcomingHearingsReportSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENT REPORTS — admin+ only (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/reports/departments/comparison */
export async function getDepartmentComparisonReport(
  filters: ReportFilters,
): Promise<DepartmentComparisonReport> {
  const raw = await apiClient.get(
    `/api/v1/reports/departments/comparison?${buildReportParams(filters)}`,
  )
  return departmentComparisonReportSchema.parse(raw)
}

/** GET /api/v1/reports/departments/case-distribution */
export async function getDepartmentCaseDistribution(
  filters: ReportFilters,
): Promise<DepartmentCaseDistribution> {
  const raw = await apiClient.get(
    `/api/v1/reports/departments/case-distribution?${buildReportParams(filters)}`,
  )
  return departmentCaseDistributionSchema.parse(raw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Downloads a CSV export for the given report path.
 * Uses the raw axiosInstance (not apiClient wrapper) to support blob responseType.
 * The backend returns CSV when `?format=csv` is appended.
 *
 * IMPORTANT: Verify that `axiosInstance` is exported from `@services/api/client`.
 * If only `apiClient` is exported, add:
 *   export { axiosInstance } from './client'
 * to the client module.
 */
export async function downloadReportCsv(
  reportPath: string,       // e.g. 'cases/status-summary'
  filters: ReportFilters,
): Promise<void> {
  const params = buildReportParams(filters)
  const response = await axiosInstance.get(
    `/api/v1/reports/${reportPath}?${params}&format=csv`,
    { responseType: 'blob' },
  )
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = buildCsvFilename(reportPath.replace('/', '-'))
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
```

---

# 12. React Query Hooks — Dashboard

Create all hooks in `src/features/dashboard/hooks/`.

## 12.1 `useInvestigatorDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getInvestigatorDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useInvestigatorDashboard() {
  return useQuery({
    queryKey: dashboardKeys.investigator(),
    queryFn: getInvestigatorDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
```

## 12.2 `useDeptHeadDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getDeptHeadDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useDeptHeadDashboard() {
  return useQuery({
    queryKey: dashboardKeys.deptHead(),
    queryFn: getDeptHeadDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
```

## 12.3 `useAdminDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: getAdminDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
```

## 12.4 `useLegalDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getLegalDashboard } from '@services/domain/dashboard.service'
import { dashboardKeys } from '@services/query/keys/dashboardKeys'

export function useLegalDashboard() {
  return useQuery({
    queryKey: dashboardKeys.legal(),
    queryFn: getLegalDashboard,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
```

## 12.5 `src/features/dashboard/hooks/index.ts`

```typescript
export { useInvestigatorDashboard } from './useInvestigatorDashboard'
export { useDeptHeadDashboard } from './useDeptHeadDashboard'
export { useAdminDashboard } from './useAdminDashboard'
export { useLegalDashboard } from './useLegalDashboard'
```

---

# 13. React Query Hooks — Reports

All report hooks follow the same pattern. Create each in `src/features/reports/hooks/`.

The shared pattern is:

```typescript
import { useQuery } from '@tanstack/react-query'
import { get{DataType} } from '@services/domain/reports.service'
import { reportKeys } from '@services/query/keys/reportKeys'
import type { ReportFilters } from '../types/reports.types'

export function use{DataType}(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.{keyMethod}(filters as Record<string, unknown>),
    queryFn: () => get{DataType}(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(filters.dateFrom && filters.dateTo),
  })
}
```

Implement all 15 hooks using this pattern. Specific configurations:

| Hook | Query key method | Service function | Notes |
|---|---|---|---|
| `useCaseStatusSummary` | `reportKeys.caseStatusSummary` | `getCaseStatusSummary` | — |
| `useCaseVolumeTrend` | `reportKeys.caseVolumeTrend` | `getCaseVolumeTrend` | — |
| `useCaseResolutionReport` | `reportKeys.caseResolution` | `getCaseResolutionReport` | — |
| `useEvidenceTypeBreakdown` | `reportKeys.evidenceTypeBreakdown` | `getEvidenceTypeBreakdown` | — |
| `useEvidenceVolumeTrend` | `reportKeys.evidenceVolumeTrend` | `getEvidenceVolumeTrend` | — |
| `useUnreviewedEvidenceReport` | `reportKeys.unreviewedEvidence` | `getUnreviewedEvidenceReport` | — |
| `useArrestSummary` | `reportKeys.arrestSummary` | `getArrestSummary` | — |
| `useArrestMonthlyTrend` | `reportKeys.arrestMonthlyTrend` | `getArrestMonthlyTrend` | — |
| `useOfficerWorkloadReport` | `reportKeys.officerWorkload` | `getOfficerWorkloadReport` | — |
| `useOfficerActivityReport` | `reportKeys.officerActivity` | `getOfficerActivityReport` | — |
| `useChargeOutcomeReport` | `reportKeys.chargeOutcomes` | `getChargeOutcomeReport` | — |
| `useConvictionRateTrend` | `reportKeys.convictionRateTrend` | `getConvictionRateTrend` | — |
| `useUpcomingHearingsReport` | `reportKeys.upcomingHearings` | `getUpcomingHearingsReport` | — |
| `useDepartmentComparisonReport` | `reportKeys.deptComparison` | `getDepartmentComparisonReport` | admin+ only — add `enabled: Boolean(filters.dateFrom && filters.dateTo) && isAdmin` where `isAdmin` is passed as a second arg |
| `useDepartmentCaseDistribution` | `reportKeys.deptCaseDistribution` | `getDepartmentCaseDistribution` | admin+ only — same enabled condition |

For the two admin-only hooks, add a second parameter `enabled: boolean` and `AND` it into the `enabled` option so they do not fire for lower roles.

## 13.1 `src/features/reports/hooks/index.ts`

```typescript
export { useCaseStatusSummary } from './useCaseStatusSummary'
export { useCaseVolumeTrend } from './useCaseVolumeTrend'
export { useCaseResolutionReport } from './useCaseResolutionReport'
export { useEvidenceTypeBreakdown } from './useEvidenceTypeBreakdown'
export { useEvidenceVolumeTrend } from './useEvidenceVolumeTrend'
export { useUnreviewedEvidenceReport } from './useUnreviewedEvidenceReport'
export { useArrestSummary } from './useArrestSummary'
export { useArrestMonthlyTrend } from './useArrestMonthlyTrend'
export { useOfficerWorkloadReport } from './useOfficerWorkloadReport'
export { useOfficerActivityReport } from './useOfficerActivityReport'
export { useChargeOutcomeReport } from './useChargeOutcomeReport'
export { useConvictionRateTrend } from './useConvictionRateTrend'
export { useUpcomingHearingsReport } from './useUpcomingHearingsReport'
export { useDepartmentComparisonReport } from './useDepartmentComparisonReport'
export { useDepartmentCaseDistribution } from './useDepartmentCaseDistribution'
```

---

# 14. Shared Chart Components

## 14.1 `src/shared/constants/chartColors.ts`

Already defined in §8.2.

## 14.2 `src/shared/components/charts/CcmsLineChart.tsx`

Client Component. Thin wrapper around Recharts `LineChart` with CCMS token colours applied consistently. This component is the only way charts are rendered in the project — no raw Recharts usage in feature components.

```typescript
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'

export interface CcmsLineChartDataPoint {
  [key: string]: string | number
}

export interface CcmsLineSeries {
  dataKey: string
  label: string
  color?: string         // Defaults to CHART_COLORS.series[index]
  strokeWidth?: number   // Defaults to 2
}

interface CcmsLineChartProps {
  data: CcmsLineChartDataPoint[]
  series: CcmsLineSeries[]
  xAxisKey: string
  xAxisTickFormatter?: (value: string) => string
  yAxisTickFormatter?: (value: number) => string
  height?: number         // Defaults to 280
  showLegend?: boolean
  tooltipLabelFormatter?: (label: string) => string
}

export function CcmsLineChart({
  data,
  series,
  xAxisKey,
  xAxisTickFormatter,
  yAxisTickFormatter,
  height = 280,
  showLegend = false,
  tooltipLabelFormatter,
}: CcmsLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.gridLine}
          vertical={false}
        />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={xAxisTickFormatter}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={yAxisTickFormatter}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          labelFormatter={tooltipLabelFormatter}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }}
          />
        )}
        {series.map((s, idx) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color ?? CHART_COLORS.series[idx % CHART_COLORS.series.length]}
            strokeWidth={s.strokeWidth ?? 2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## 14.3 `src/shared/components/charts/CcmsBarChart.tsx`

```typescript
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'

export interface CcmsBarSeries {
  dataKey: string
  label: string
  color?: string
}

interface CcmsBarChartProps {
  data: Record<string, string | number>[]
  series: CcmsBarSeries[]
  xAxisKey: string
  layout?: 'horizontal' | 'vertical'   // Defaults to 'horizontal'
  xAxisTickFormatter?: (value: string) => string
  yAxisTickFormatter?: (value: number | string) => string
  height?: number
  showLegend?: boolean
  // For single-series charts where each bar is a different colour (e.g. status breakdown)
  useSeriesColorsPerBar?: boolean
}

export function CcmsBarChart({
  data,
  series,
  xAxisKey,
  layout = 'horizontal',
  xAxisTickFormatter,
  yAxisTickFormatter,
  height = 280,
  showLegend = false,
  useSeriesColorsPerBar = false,
}: CcmsBarChartProps) {
  const isVertical = layout === 'vertical'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 4, right: 16, left: isVertical ? 80 : 0, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.gridLine}
          horizontal={!isVertical}
          vertical={isVertical}
        />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisTickFormatter as (v: number) => string}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={xAxisTickFormatter}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={xAxisTickFormatter}
            />
            <YAxis
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisTickFormatter as (v: number) => string}
              width={40}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        {showLegend && (
          <Legend wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }} />
        )}
        {series.map((s, idx) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color ?? CHART_COLORS.series[idx % CHART_COLORS.series.length]}
            radius={[3, 3, 0, 0]}
          >
            {useSeriesColorsPerBar &&
              data.map((_, cellIdx) => (
                <Cell
                  key={`cell-${cellIdx}`}
                  fill={CHART_COLORS.series[cellIdx % CHART_COLORS.series.length]}
                />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
```

## 14.4 `src/shared/components/charts/CcmsDonutChart.tsx`

```typescript
'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_COLORS } from '@shared/constants/chartColors'

export interface CcmsDonutDataPoint {
  name: string
  value: number
  color?: string
}

interface CcmsDonutChartProps {
  data: CcmsDonutDataPoint[]
  innerRadius?: number    // Defaults to 55 (donut hole)
  outerRadius?: number    // Defaults to 85
  height?: number
  showLegend?: boolean
  // Optional centre label rendered via SVG text
  centreLabel?: string
  centreValue?: string | number
}

export function CcmsDonutChart({
  data,
  innerRadius = 55,
  outerRadius = 85,
  height = 240,
  showLegend = true,
  centreLabel,
  centreValue,
}: CcmsDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, idx) => (
            <Cell
              key={`cell-${idx}`}
              fill={
                entry.color ??
                CHART_COLORS.series[idx % CHART_COLORS.series.length]
              }
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltipBg,
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: '6px',
            color: CHART_COLORS.tooltipText,
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            value.toLocaleString(),
            name,
          ]}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: CHART_COLORS.axisLabel, fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {/* Centre label rendered as SVG */}
        {centreValue !== undefined && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan
              x="50%"
              dy="-0.2em"
              fontSize="22"
              fontWeight="600"
              fill={CHART_COLORS.tooltipText}
            >
              {centreValue}
            </tspan>
            {centreLabel && (
              <tspan
                x="50%"
                dy="1.4em"
                fontSize="11"
                fill={CHART_COLORS.axisLabel}
              >
                {centreLabel}
              </tspan>
            )}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
```

---

# 15. Shared Components — `KpiCard` and `DateRangePicker`

## 15.1 `src/shared/components/display/KpiCard.tsx`

```typescript
'use client'

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@shared/components/feedback/Skeleton'
import { cn } from '@shared/utils/cn'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: number | string | null
  valueFormatter?: (v: number | string) => string
  changePercent?: number | null          // Positive = improvement; negative = decline; null = N/A
  changeIsPositiveWhenUp?: boolean       // true = ↑ is green; false = ↑ is red (e.g. overdue count)
  isLoading?: boolean
  linkTo?: string                        // Wraps the entire card in a Link if provided
  className?: string
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  valueFormatter,
  changePercent,
  changeIsPositiveWhenUp = true,
  isLoading = false,
  linkTo,
  className,
}: KpiCardProps) {
  const formattedValue =
    value === null
      ? '—'
      : valueFormatter
      ? valueFormatter(value)
      : typeof value === 'number'
      ? value.toLocaleString()
      : value

  const trendElement = (() => {
    if (changePercent === null || changePercent === undefined) return null
    const isUp = changePercent >= 0
    const isPositive = changeIsPositiveWhenUp ? isUp : !isUp
    const TrendIcon = changePercent === 0 ? Minus : isUp ? TrendingUp : TrendingDown
    const sign = changePercent > 0 ? '+' : ''
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          changePercent === 0
            ? 'text-muted'
            : isPositive
            ? 'text-success'
            : 'text-destructive',
        )}
      >
        <TrendIcon className="h-3 w-3" />
        {sign}{changePercent.toFixed(1)}%
      </span>
    )
  })()

  const inner = (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 flex flex-col gap-3',
        linkTo && 'cursor-pointer hover:bg-card-hover transition-colors duration-120',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </>
      ) : (
        <>
          <span className="text-3xl font-semibold text-foreground leading-none">
            {formattedValue}
          </span>
          {trendElement}
        </>
      )}
    </div>
  )

  if (linkTo) {
    return <Link href={linkTo}>{inner}</Link>
  }
  return inner
}
```

## 15.2 `src/shared/components/forms/DateRangePicker.tsx`

Client Component. Combines two `DatePicker` instances with preset buttons. Used exclusively in the reports filter bar.

```typescript
'use client'

import { useState } from 'react'
import { format, isAfter, isBefore, isValid, parseISO } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from './DatePicker'
import { Button } from '@shared/components/ui/Button'
import { cn } from '@shared/utils/cn'
import { DatePreset } from '@features/reports/types/reports.types'
import { resolveDatePreset } from '@features/reports/utils/reportUtils'

// Note on module boundary:
// DateRangePicker is a shared form component that imports DatePreset type and
// resolveDatePreset utility from @features/reports. This is an intentional
// boundary exception: DateRangePicker is tightly coupled to the reports module
// and will only ever be used there. If it were needed in other modules, the
// preset logic should be inlined or moved to shared/utils.

interface DateRangePickerProps {
  dateFrom: string                // 'YYYY-MM-DD'
  dateTo: string                  // 'YYYY-MM-DD'
  activePreset: DatePreset | null
  onChange: (from: string, to: string, preset: DatePreset | null) => void
  labels: {
    from: string
    to: string
    last7Days: string
    last30Days: string
    lastQuarter: string
    custom: string
  }
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  activePreset,
  onChange,
  labels,
}: DateRangePickerProps) {
  const presets: { preset: DatePreset; label: string }[] = [
    { preset: DatePreset.LAST_7_DAYS,   label: labels.last7Days },
    { preset: DatePreset.LAST_30_DAYS,  label: labels.last30Days },
    { preset: DatePreset.LAST_QUARTER,  label: labels.lastQuarter },
  ]

  function handlePreset(preset: DatePreset) {
    const { dateFrom: from, dateTo: to } = resolveDatePreset(preset)
    onChange(from, to, preset)
  }

  function handleFromChange(date: Date | undefined) {
    if (!date) return
    const from = format(date, 'yyyy-MM-dd')
    onChange(from, dateTo, DatePreset.CUSTOM)
  }

  function handleToChange(date: Date | undefined) {
    if (!date) return
    const to = format(date, 'yyyy-MM-dd')
    onChange(dateFrom, to, DatePreset.CUSTOM)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      {presets.map(({ preset, label }) => (
        <Button
          key={preset}
          variant={activePreset === preset ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset(preset)}
          className="h-8 text-xs"
        >
          {label}
        </Button>
      ))}

      {/* Custom range pickers */}
      <div className="flex items-center gap-1">
        <CalendarIcon className="h-3.5 w-3.5 text-muted" />
        <DatePicker
          value={dateFrom ? parseISO(dateFrom) : undefined}
          onChange={handleFromChange}
          placeholder={labels.from}
          maxDate={dateTo ? parseISO(dateTo) : undefined}
        />
        <span className="text-muted text-xs">–</span>
        <DatePicker
          value={dateTo ? parseISO(dateTo) : undefined}
          onChange={handleToChange}
          placeholder={labels.to}
          minDate={dateFrom ? parseISO(dateFrom) : undefined}
        />
      </div>
    </div>
  )
}
```

---

# 16. i18n Messages

## 16.1 `messages/en/dashboard.json` — Full Population

```json
{
  "pageTitle": "Dashboard",

  "investigator": {
    "welcome": "Welcome back",
    "kpis": {
      "openCases": "Open Cases",
      "underInvestigation": "Under Investigation",
      "referredToCourt": "Referred to Court",
      "overdueActions": "Overdue Actions"
    },
    "recentCasesWidget": {
      "title": "My Recent Cases",
      "viewAll": "View all my cases →",
      "empty": "You have no recently updated cases.",
      "loading": "Loading cases...",
      "columns": {
        "caseNumber": "Case #",
        "title": "Title",
        "status": "Status",
        "crimeType": "Crime Type",
        "lastUpdated": "Last Updated"
      }
    },
    "evidenceWidget": {
      "title": "Recent Evidence Logged",
      "viewAll": "View all evidence →",
      "empty": "No evidence items logged recently.",
      "loading": "Loading evidence...",
      "columns": {
        "case": "Case",
        "type": "Type",
        "collectedAt": "Collected"
      }
    },
    "pendingActionsWidget": {
      "title": "Pending Actions",
      "evidenceMissingCustody": "Evidence items missing custody events",
      "casesWithoutUpdate": "Cases open >30 days without update",
      "allClear": "No pending actions. You're up to date.",
      "viewEvidence": "Review evidence →",
      "viewCases": "Review cases →"
    }
  },

  "deptHead": {
    "kpis": {
      "activeCases": "Active Cases",
      "resolutionRate": "Resolution Rate",
      "avgCaseAge": "Avg Case Age",
      "avgCaseAgeSuffix": "days",
      "openArrests": "Open Arrests"
    },
    "caseStatusWidget": {
      "title": "Cases by Status",
      "total": "Total",
      "loading": "Loading chart...",
      "empty": "No case data available."
    },
    "workloadWidget": {
      "title": "Officer Workload",
      "subtitle": "Active cases per officer",
      "loading": "Loading workload data...",
      "empty": "No officers found in this department.",
      "activeCasesLabel": "Active Cases"
    },
    "activityWidget": {
      "title": "Recent Department Activity",
      "viewTimeline": "View full timeline →",
      "loading": "Loading activity...",
      "empty": "No recent activity in this department."
    },
    "quickLinksWidget": {
      "title": "Reports",
      "caseReport": "Case Reports",
      "officerReport": "Officer Workload",
      "legalReport": "Legal Reports",
      "viewAll": "All Reports →"
    }
  },

  "admin": {
    "kpis": {
      "totalCases": "Total Cases",
      "totalOfficers": "Total Officers",
      "totalEvidence": "Evidence Items",
      "systemHealth": "System Health"
    },
    "healthStatus": {
      "healthy": "Healthy",
      "degraded": "Degraded",
      "down": "Down"
    },
    "trendWidget": {
      "title": "Case Volume — Last 30 Days",
      "yAxisLabel": "Cases",
      "loading": "Loading trend...",
      "empty": "No case volume data available."
    },
    "securityWidget": {
      "title": "Security Events",
      "viewAll": "View audit log →",
      "loading": "Loading events...",
      "empty": "No recent security events.",
      "severity": {
        "low": "Low",
        "medium": "Medium",
        "high": "High"
      }
    },
    "deptOverviewWidget": {
      "title": "Department Overview",
      "loading": "Loading departments...",
      "empty": "No departments found.",
      "columns": {
        "department": "Department",
        "activeCases": "Active Cases",
        "officers": "Officers"
      },
      "viewAll": "View all departments →"
    },
    "pendingTasksWidget": {
      "title": "Pending Tasks",
      "officersAwaitingActivation": "Officer(s) awaiting activation",
      "departmentsWithoutHead": "Department(s) without a head officer",
      "allClear": "No pending administrative tasks.",
      "viewOfficers": "Review officers →",
      "viewDepartments": "Review departments →"
    }
  },

  "legal": {
    "kpis": {
      "openCourtCases": "Open Court Cases",
      "chargesThisMonth": "Charges Filed (Month)",
      "upcomingHearings": "Upcoming Hearings",
      "convictionRate": "Conviction Rate"
    },
    "hearingsWidget": {
      "title": "Upcoming Hearings",
      "viewAll": "View all hearings →",
      "loading": "Loading hearings...",
      "empty": "No upcoming hearings in the next 30 days.",
      "columns": {
        "case": "Case",
        "court": "Court",
        "hearingDate": "Date",
        "type": "Type"
      }
    },
    "chargesWidget": {
      "title": "Recent Charges",
      "viewAll": "View all court cases →",
      "loading": "Loading charges...",
      "empty": "No recent charges filed.",
      "columns": {
        "crimeType": "Crime Type",
        "suspect": "Suspect",
        "status": "Status",
        "filedAt": "Filed"
      }
    }
  },

  "widgetError": "Unable to load this widget. {retryLink}",
  "retryLink": "Retry",
  "fallback": {
    "title": "Dashboard Unavailable",
    "description": "Your role does not have a configured dashboard."
  }
}
```

## 16.2 `messages/am/dashboard.json` — Full Amharic Equivalent

```json
{
  "pageTitle": "ዳሽቦርድ",

  "investigator": {
    "welcome": "እንኳን ደህና መጡ",
    "kpis": {
      "openCases": "ክፍት ጉዳዮች",
      "underInvestigation": "በምርመራ ላይ",
      "referredToCourt": "ለፍርድ ቤት ተጠቁሟል",
      "overdueActions": "ዘገዩ ድርጊቶች"
    },
    "recentCasesWidget": {
      "title": "የቅርብ ጉዳዮቼ",
      "viewAll": "ሁሉም ጉዳዮቼ ተመልከት →",
      "empty": "ቅርብ ጊዜ የተዘመኑ ጉዳዮች የሉዎትም።",
      "loading": "ጉዳዮችን እየጫነ ነው...",
      "columns": {
        "caseNumber": "ጉዳይ #",
        "title": "ርዕስ",
        "status": "ሁኔታ",
        "crimeType": "የወንጀል ዓይነት",
        "lastUpdated": "መጨረሻ ዝማኔ"
      }
    },
    "evidenceWidget": {
      "title": "የቅርብ ጊዜ ማስረጃ",
      "viewAll": "ሁሉም ማስረጃ ተመልከት →",
      "empty": "ቅርብ ጊዜ የተመዘገበ ማስረጃ የለም።",
      "loading": "ማስረጃ እየጫነ ነው...",
      "columns": {
        "case": "ጉዳይ",
        "type": "ዓይነት",
        "collectedAt": "የተሰበሰበበት"
      }
    },
    "pendingActionsWidget": {
      "title": "በመጠባበቅ ላይ ያሉ ድርጊቶች",
      "evidenceMissingCustody": "የቁጥጥር ክስተቶች የጎደሏቸው ማስረጃዎች",
      "casesWithoutUpdate": "ዝማኔ ሳይኖር ከ30 ቀናት በላይ ክፍት ጉዳዮች",
      "allClear": "ምንም ጊዜ ያለፈ ድርጊት የለም። ወቅቱ ደርሰዋል።",
      "viewEvidence": "ማስረጃ ተገምግም →",
      "viewCases": "ጉዳዮች ተገምግም →"
    }
  },

  "deptHead": {
    "kpis": {
      "activeCases": "ንቁ ጉዳዮች",
      "resolutionRate": "የመፍቻ ፍጥነት",
      "avgCaseAge": "አማካይ የጉዳይ ዕድሜ",
      "avgCaseAgeSuffix": "ቀናት",
      "openArrests": "ክፍት ቁያዎች"
    },
    "caseStatusWidget": {
      "title": "ጉዳዮች በሁኔታ",
      "total": "ጠቅላላ",
      "loading": "ቻርት እየጫነ ነው...",
      "empty": "የጉዳይ ዳታ የለም።"
    },
    "workloadWidget": {
      "title": "የፖሊስ ሥራ ጫና",
      "subtitle": "ንቁ ጉዳዮች በፖሊስ",
      "loading": "የሥራ ጫና ዳታ እየጫነ ነው...",
      "empty": "በዚህ ክፍል ምንም ፖሊሶች አልተገኙም።",
      "activeCasesLabel": "ንቁ ጉዳዮች"
    },
    "activityWidget": {
      "title": "የቅርብ ጊዜ የክፍል ተግባር",
      "viewTimeline": "ሙሉ የጊዜ ሰሌዳ ተመልከት →",
      "loading": "ተግባር እየጫነ ነው...",
      "empty": "በዚህ ክፍል ቅርብ ጊዜ ምንም ተግባር የለም።"
    },
    "quickLinksWidget": {
      "title": "ሪፖርቶች",
      "caseReport": "የጉዳይ ሪፖርቶች",
      "officerReport": "የፖሊስ ሥራ ጫና",
      "legalReport": "የሕጋዊ ሪፖርቶች",
      "viewAll": "ሁሉም ሪፖርቶች →"
    }
  },

  "admin": {
    "kpis": {
      "totalCases": "ጠቅላላ ጉዳዮች",
      "totalOfficers": "ጠቅላላ ፖሊሶች",
      "totalEvidence": "የማስረጃ ዕቃዎች",
      "systemHealth": "የስርዓት ጤና"
    },
    "healthStatus": {
      "healthy": "ጤናማ",
      "degraded": "ደካማ",
      "down": "ወድቋል"
    },
    "trendWidget": {
      "title": "የጉዳይ መጠን — መጨረሻ 30 ቀናት",
      "yAxisLabel": "ጉዳዮች",
      "loading": "አዝማሚያ እየጫነ ነው...",
      "empty": "የጉዳይ መጠን ዳታ የለም።"
    },
    "securityWidget": {
      "title": "የጸጥታ ክስተቶች",
      "viewAll": "የኦዲት ምዝገባ ተመልከት →",
      "loading": "ክስተቶች እየጫነ ነው...",
      "empty": "ቅርብ ጊዜ የጸጥታ ክስተቶች የሉም።",
      "severity": {
        "low": "ዝቅተኛ",
        "medium": "መካከለኛ",
        "high": "ከፍተኛ"
      }
    },
    "deptOverviewWidget": {
      "title": "የክፍሎች አጠቃላይ ዕይታ",
      "loading": "ክፍሎችን እየጫነ ነው...",
      "empty": "ምንም ክፍሎች አልተገኙም።",
      "columns": {
        "department": "ክፍል",
        "activeCases": "ንቁ ጉዳዮች",
        "officers": "ፖሊሶች"
      },
      "viewAll": "ሁሉም ክፍሎች ተመልከት →"
    },
    "pendingTasksWidget": {
      "title": "ጊዜ ያለፈ ሥራዎች",
      "officersAwaitingActivation": "ፖሊስ(ዎች) ማንቃት በመጠበቅ",
      "departmentsWithoutHead": "ያለ ኃላፊ ክፍል(ዎች)",
      "allClear": "ምንም ጊዜ ያለፈ አስተዳደር ሥራዎች የሉም።",
      "viewOfficers": "ፖሊሶች ተገምግም →",
      "viewDepartments": "ክፍሎች ተገምግም →"
    }
  },

  "legal": {
    "kpis": {
      "openCourtCases": "ክፍት የፍርድ ቤት ጉዳዮች",
      "chargesThisMonth": "በወር የቀረቡ ክሶች",
      "upcomingHearings": "ቀጣይ ችሎቶች",
      "convictionRate": "የጥፋተኝነት ፍጥነት"
    },
    "hearingsWidget": {
      "title": "ቀጣይ ችሎቶች",
      "viewAll": "ሁሉም ችሎቶች ተመልከት →",
      "loading": "ችሎቶችን እየጫነ ነው...",
      "empty": "በቀጣዮቹ 30 ቀናት ምንም ቀጣይ ችሎቶች የሉም።",
      "columns": {
        "case": "ጉዳይ",
        "court": "ፍርድ ቤት",
        "hearingDate": "ቀን",
        "type": "ዓይነት"
      }
    },
    "chargesWidget": {
      "title": "የቅርብ ጊዜ ክሶች",
      "viewAll": "ሁሉም የፍርድ ቤት ጉዳዮች ተመልከት →",
      "loading": "ክሶችን እየጫነ ነው...",
      "empty": "ቅርብ ጊዜ የቀረቡ ክሶች የሉም።",
      "columns": {
        "crimeType": "የወንጀል ዓይነት",
        "suspect": "ተጠርጣሪ",
        "status": "ሁኔታ",
        "filedAt": "ቀን"
      }
    }
  },

  "widgetError": "ይህን ዊጀት ለመጫን አልተሳካም። {retryLink}",
  "retryLink": "እንደገና ሞክር",
  "fallback": {
    "title": "ዳሽቦርድ አይገኝም",
    "description": "ለሚናዎ ምንም ዳሽቦርድ አልተዋቀረም።"
  }
}
```

## 16.3 `messages/en/reports.json` — Full Population

```json
{
  "pageTitle": "Reports",
  "nav": {
    "cases": "Case Reports",
    "evidence": "Evidence Reports",
    "arrests": "Arrest Reports",
    "officers": "Officer Workload",
    "legal": "Legal Reports",
    "departments": "Department Reports"
  },
  "filters": {
    "dateRangeLabel": "Date Range",
    "fromLabel": "From",
    "toLabel": "To",
    "presets": {
      "last7Days": "Last 7 Days",
      "last30Days": "Last 30 Days",
      "lastQuarter": "Last Quarter",
      "custom": "Custom"
    },
    "departmentLabel": "Department",
    "departmentAll": "All Departments",
    "departmentPlaceholder": "Filter by department..."
  },
  "export": {
    "button": "Export CSV",
    "downloading": "Downloading...",
    "successMessage": "Report downloaded.",
    "errorMessage": "Failed to download report. Please try again."
  },
  "periodLabel": "Period: {dateFrom} – {dateTo}",
  "noData": "No data available for the selected filters.",
  "loading": "Loading report...",
  "error": "Failed to load report data.",
  "retryButton": "Retry",

  "cases": {
    "pageTitle": "Case Reports",
    "statusSummary": {
      "title": "Case Status Distribution",
      "description": "Breakdown of all cases by current status within the selected period.",
      "totalLabel": "Total Cases"
    },
    "volumeTrend": {
      "title": "New Cases Over Time",
      "description": "Daily count of new cases opened within the selected period.",
      "yAxisLabel": "New Cases",
      "totalLabel": "Total Opened"
    },
    "resolution": {
      "title": "Case Resolution Metrics",
      "description": "Closed case count, resolution rate, and average case age within the selected period.",
      "totalClosed": "Cases Closed",
      "resolutionRate": "Resolution Rate",
      "avgAge": "Average Case Age",
      "medianAge": "Median Case Age",
      "ageSuffix": "days",
      "noRate": "—"
    }
  },

  "evidence": {
    "pageTitle": "Evidence Reports",
    "typeBreakdown": {
      "title": "Evidence by Type",
      "description": "Distribution of evidence items logged by type within the selected period.",
      "totalLabel": "Total Items"
    },
    "volumeTrend": {
      "title": "Evidence Volume Over Time",
      "description": "Daily count of evidence items logged within the selected period.",
      "yAxisLabel": "Items Logged",
      "totalLabel": "Total Logged"
    },
    "unreviewed": {
      "title": "Unreviewed Evidence",
      "description": "Evidence items collected within the period that have not yet been reviewed.",
      "countLabel": "{count} item(s) require review",
      "allReviewed": "All evidence within the period has been reviewed.",
      "columns": {
        "case": "Case",
        "type": "Type",
        "collectedAt": "Collected",
        "daysUnreviewed": "Days Unreviewed"
      }
    }
  },

  "arrests": {
    "pageTitle": "Arrest Reports",
    "summary": {
      "title": "Arrest Summary",
      "totalLabel": "Arrests in Period",
      "changeLabel": "vs. previous period",
      "noComparison": "No comparison data"
    },
    "monthlyTrend": {
      "title": "Monthly Arrest Trend",
      "description": "Arrest count aggregated by month within the selected period.",
      "yAxisLabel": "Arrests",
      "monthAxisLabel": "Month"
    }
  },

  "officers": {
    "pageTitle": "Officer Workload Reports",
    "workload": {
      "title": "Active Case Load",
      "description": "Current active case count per officer, plus cases opened and closed within the period.",
      "columns": {
        "officer": "Officer",
        "badge": "Badge",
        "activeCases": "Active Cases",
        "totalInPeriod": "Opened",
        "closedInPeriod": "Closed"
      }
    },
    "activity": {
      "title": "Officer Activity Metrics",
      "description": "Evidence logged, interrogations conducted, and arrests recorded per officer within the period.",
      "columns": {
        "officer": "Officer",
        "badge": "Badge",
        "evidenceLogged": "Evidence Logged",
        "interrogations": "Interrogations",
        "arrests": "Arrests"
      }
    }
  },

  "legal": {
    "pageTitle": "Legal Reports",
    "chargeOutcomes": {
      "title": "Charge Outcomes",
      "description": "Breakdown of charge outcomes (conviction, acquittal, dropped, pending) within the period.",
      "totalLabel": "Total Charges",
      "outcomes": {
        "convicted": "Convicted",
        "acquitted": "Acquitted",
        "dropped": "Dropped",
        "pending": "Pending"
      }
    },
    "convictionTrend": {
      "title": "Conviction Rate Trend",
      "description": "Monthly conviction rate percentage within the selected period.",
      "yAxisLabel": "Rate (%)",
      "overallRate": "Overall Rate",
      "noRate": "Insufficient data"
    },
    "upcomingHearings": {
      "title": "Upcoming Hearings",
      "description": "Scheduled court hearings within the selected date range.",
      "totalLabel": "{count} hearing(s) scheduled",
      "empty": "No hearings scheduled in the selected period.",
      "columns": {
        "case": "Case",
        "court": "Court",
        "hearingDate": "Hearing Date",
        "type": "Type",
        "officer": "Assigned Officer"
      }
    }
  },

  "departments": {
    "pageTitle": "Department Reports",
    "accessDenied": "Department reports are available to administrators only.",
    "comparison": {
      "title": "Department Comparison",
      "description": "Side-by-side performance metrics for all departments within the selected period.",
      "columns": {
        "department": "Department",
        "activeCases": "Active Cases",
        "closedCases": "Closed",
        "officers": "Officers",
        "resolutionRate": "Resolution Rate",
        "avgAge": "Avg Case Age"
      },
      "noRate": "—",
      "ageSuffix": "d"
    },
    "caseDistribution": {
      "title": "Case Distribution by Department",
      "description": "Proportion of total cases assigned to each department within the period.",
      "totalLabel": "Total Cases"
    }
  }
}
```

## 16.4 `messages/am/reports.json` — Full Amharic Equivalent

```json
{
  "pageTitle": "ሪፖርቶች",
  "nav": {
    "cases": "የጉዳይ ሪፖርቶች",
    "evidence": "የማስረጃ ሪፖርቶች",
    "arrests": "የቁያ ሪፖርቶች",
    "officers": "የፖሊስ ሥራ ጫና",
    "legal": "የሕጋዊ ሪፖርቶች",
    "departments": "የክፍሎች ሪፖርቶች"
  },
  "filters": {
    "dateRangeLabel": "የቀን ክልል",
    "fromLabel": "ከ",
    "toLabel": "እስከ",
    "presets": {
      "last7Days": "መጨረሻ 7 ቀናት",
      "last30Days": "መጨረሻ 30 ቀናት",
      "lastQuarter": "ያለፈ ሩብ ዓመት",
      "custom": "ብጁ"
    },
    "departmentLabel": "ክፍል",
    "departmentAll": "ሁሉም ክፍሎች",
    "departmentPlaceholder": "በክፍል አጣራ..."
  },
  "export": {
    "button": "CSV ወርዶ አውርድ",
    "downloading": "እያወረደ ነው...",
    "successMessage": "ሪፖርቱ ወርዶ ተጫነ።",
    "errorMessage": "ሪፖርቱን ለማውረድ አልተሳካም። እንደገና ይሞክሩ።"
  },
  "periodLabel": "ጊዜ: {dateFrom} – {dateTo}",
  "noData": "ለተመረጡ ማጣሪያዎች ምንም ዳታ የለም።",
  "loading": "ሪፖርት እየጫነ ነው...",
  "error": "የሪፖርት ዳታ ለመጫን አልተሳካም።",
  "retryButton": "እንደገና ሞክር",

  "cases": {
    "pageTitle": "የጉዳይ ሪፖርቶች",
    "statusSummary": {
      "title": "የጉዳይ ሁኔታ ክፍፍል",
      "description": "በተመረጠ ጊዜ ውስጥ ሁሉም ጉዳዮች በሁኔታ።",
      "totalLabel": "ጠቅላላ ጉዳዮች"
    },
    "volumeTrend": {
      "title": "አዳዲስ ጉዳዮች ለጊዜ",
      "description": "በተመረጠ ጊዜ ውስጥ የተከፈቱ ጉዳዮች ዕለታዊ ቁጥር።",
      "yAxisLabel": "አዳዲስ ጉዳዮች",
      "totalLabel": "ጠቅላላ የተከፈቱ"
    },
    "resolution": {
      "title": "የጉዳይ መፍቻ መለኪያዎች",
      "description": "የተዘጉ ጉዳዮች፣ የመፍቻ ፍጥነት፣ አማካይ ዕድሜ።",
      "totalClosed": "የተዘጉ ጉዳዮች",
      "resolutionRate": "የመፍቻ ፍጥነት",
      "avgAge": "አማካይ የጉዳይ ዕድሜ",
      "medianAge": "መካከለኛ ዕድሜ",
      "ageSuffix": "ቀናት",
      "noRate": "—"
    }
  },

  "evidence": {
    "pageTitle": "የማስረጃ ሪፖርቶች",
    "typeBreakdown": {
      "title": "ማስረጃ በዓይነት",
      "description": "በተመረጠ ጊዜ በዓይነት የተከፋፈሉ ማስረጃዎች።",
      "totalLabel": "ጠቅላላ ዕቃዎች"
    },
    "volumeTrend": {
      "title": "የማስረጃ መጠን ለጊዜ",
      "description": "ዕለታዊ ቁጥር ማስረጃ ዕቃዎች።",
      "yAxisLabel": "የተመዘገቡ ዕቃዎች",
      "totalLabel": "ጠቅላላ"
    },
    "unreviewed": {
      "title": "ያልተገመገሙ ማስረጃዎች",
      "description": "በጊዜ ውስጥ የተሰበሰቡ ያልተገመገሙ ዕቃዎች።",
      "countLabel": "{count} ዕቃ(ዎች) ግምገማ ይፈልጋሉ",
      "allReviewed": "ሁሉም ማስረጃዎች ተገምግመዋል።",
      "columns": {
        "case": "ጉዳይ",
        "type": "ዓይነት",
        "collectedAt": "የተሰበሰበበት",
        "daysUnreviewed": "ያልተገመገሙ ቀናት"
      }
    }
  },

  "arrests": {
    "pageTitle": "የቁያ ሪፖርቶች",
    "summary": {
      "title": "የቁያ ማጠቃለያ",
      "totalLabel": "ቁያዎች በጊዜ ውስጥ",
      "changeLabel": "ያለፈ ጊዜ ጋር ሲነፃፀር",
      "noComparison": "ምንም ማነፃፀሪያ ዳታ የለም"
    },
    "monthlyTrend": {
      "title": "ወርሃዊ የቁያ አዝማሚያ",
      "description": "ወርሃዊ ቁያዎች ቁጥር።",
      "yAxisLabel": "ቁያዎች",
      "monthAxisLabel": "ወር"
    }
  },

  "officers": {
    "pageTitle": "የፖሊስ ሥራ ጫና ሪፖርቶች",
    "workload": {
      "title": "ንቁ ጉዳዮች ጫና",
      "description": "በፖሊስ ንቁ ጉዳዮች ቁጥር።",
      "columns": {
        "officer": "ፖሊስ",
        "badge": "ባጅ",
        "activeCases": "ንቁ ጉዳዮች",
        "totalInPeriod": "የተከፈቱ",
        "closedInPeriod": "የተዘጉ"
      }
    },
    "activity": {
      "title": "የፖሊስ ተግባር መለኪያዎች",
      "description": "ማስረጃ፣ ምርመራ፣ ቁያ በፖሊስ።",
      "columns": {
        "officer": "ፖሊስ",
        "badge": "ባጅ",
        "evidenceLogged": "ማስረጃ",
        "interrogations": "ምርመራዎች",
        "arrests": "ቁያዎች"
      }
    }
  },

  "legal": {
    "pageTitle": "የሕጋዊ ሪፖርቶች",
    "chargeOutcomes": {
      "title": "የክስ ውጤቶች",
      "description": "በጊዜ ውስጥ የክሶች ውጤቶች ክፍፍል።",
      "totalLabel": "ጠቅላላ ክሶች",
      "outcomes": {
        "convicted": "ጥፋተኛ ተብሏል",
        "acquitted": "ነፃ ተለቋል",
        "dropped": "ተሰርዟል",
        "pending": "በጠባቂ"
      }
    },
    "convictionTrend": {
      "title": "የጥፋተኝነት ፍጥነት አዝማሚያ",
      "description": "ወርሃዊ ፍጥነት።",
      "yAxisLabel": "ፍጥነት (%)",
      "overallRate": "አጠቃላይ ፍጥነት",
      "noRate": "በቂ ዳታ የለም"
    },
    "upcomingHearings": {
      "title": "ቀጣይ ችሎቶች",
      "description": "በተመረጠ ጊዜ ውስጥ ዝግጁ ችሎቶች።",
      "totalLabel": "{count} ችሎት(ዎች) ዝግጁ",
      "empty": "በተመረጠ ጊዜ ምንም ችሎቶች የሉም።",
      "columns": {
        "case": "ጉዳይ",
        "court": "ፍርድ ቤት",
        "hearingDate": "ቀን",
        "type": "ዓይነት",
        "officer": "ፖሊስ"
      }
    }
  },

  "departments": {
    "pageTitle": "የክፍሎች ሪፖርቶች",
    "accessDenied": "የክፍሎች ሪፖርቶች ለአስተዳዳሪዎች ብቻ ናቸው።",
    "comparison": {
      "title": "የክፍሎች ማነፃፀሪያ",
      "description": "ሁሉም ክፍሎች ጎን ለጎን።",
      "columns": {
        "department": "ክፍል",
        "activeCases": "ንቁ ጉዳዮች",
        "closedCases": "የተዘጉ",
        "officers": "ፖሊሶች",
        "resolutionRate": "የመፍቻ ፍጥነት",
        "avgAge": "አማካይ ዕድሜ"
      },
      "noRate": "—",
      "ageSuffix": "ቀ"
    },
    "caseDistribution": {
      "title": "የጉዳዮች ክፍፍል በክፍሎች",
      "description": "ጠቅላላ ጉዳዮች ድርሻ በክፍሎች።",
      "totalLabel": "ጠቅላላ ጉዳዮች"
    }
  }
}
```

---

# 17. Route Pages

## 17.1 `src/app/(dashboard)/dashboard/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server'
import { DashboardPage } from '@features/dashboard/components/DashboardPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard')
  return { title: t('pageTitle') }
}

export default function Dashboard() {
  return <DashboardPage />
}
```

## 17.2 `src/app/(dashboard)/reports/layout.tsx`

```typescript
import { ReportsShell } from '@features/reports/components/ReportsShell'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ReportsShell>{children}</ReportsShell>
}
```

## 17.3 `src/app/(dashboard)/reports/page.tsx`

```typescript
import { redirect } from 'next/navigation'

export default function ReportsIndex() {
  redirect('/reports/cases')
}
```

## 17.4 Sub-page files

Each sub-page follows this pattern. Create all six:

```typescript
// src/app/(dashboard)/reports/cases/page.tsx
import { getTranslations } from 'next-intl/server'
import { CaseReports } from '@features/reports/components/cases/CaseReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('cases.pageTitle')} | ${t('pageTitle')}` }
}

export default function CaseReportsPage() {
  return <CaseReports />
}
```

Apply the same pattern for `evidence`, `arrests`, `officers`, `legal`, and `departments`, using the correct component and translation key per sub-page.

---

# 18. UI Implementation — DashboardPage (Role Router)

## 18.1 `DashboardPage.tsx`

Client Component. Reads role from `authStore`. Renders the correct variant.

```typescript
'use client'

import { useAuthStore } from '@shared/stores/auth.store'
import { InvestigatorDashboard } from './investigator/InvestigatorDashboard'
import { DeptHeadDashboard } from './dept-head/DeptHeadDashboard'
import { AdminDashboard } from './admin/AdminDashboard'
import { LegalDashboard } from './legal/LegalDashboard'
import { EmptyState } from '@shared/components/feedback/EmptyState'
import { useTranslations } from 'next-intl'

const INVESTIGATOR_ROLES = ['INVESTIGATOR', 'FORENSIC']
const DEPT_HEAD_ROLES = ['DEPT_HEAD']
const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN']
const LEGAL_ROLES = ['LEGAL_OFFICER']

export function DashboardPage() {
  const { officer } = useAuthStore()
  const t = useTranslations('dashboard')
  const role = officer?.role ?? ''

  if (INVESTIGATOR_ROLES.includes(role)) return <InvestigatorDashboard />
  if (LEGAL_ROLES.includes(role))       return <LegalDashboard />
  if (DEPT_HEAD_ROLES.includes(role))   return <DeptHeadDashboard />
  if (ADMIN_ROLES.includes(role))       return <AdminDashboard />

  return (
    <EmptyState
      title={t('fallback.title')}
      description={t('fallback.description')}
    />
  )
}
```

---

# 19. UI Implementation — Dashboard Variants

## 19.1 InvestigatorDashboard — Layout

```
InvestigatorDashboard
──────────────────────────────────────────────────────────────
PageHeader
  Title: t('dashboard.pageTitle')
  Subtitle: t('dashboard.investigator.welcome'), {officer.firstName}
──────────────────────────────────────────────────────────────

[isLoading initial] → 4 KPI skeletons + 2 wide skeletons

┌── KPI Strip (4-column grid) ────────────────────────────────┐
│ [Open Cases]  [Under Investigation]  [Referred]  [Overdue] │
└─────────────────────────────────────────────────────────────┘

┌── Two-column grid (2/3 + 1/3 on desktop, stack on mobile) ─┐
│ ┌── AssignedCasesWidget (2/3) ─────────────────────────────┐│
│ │ "My Recent Cases"                                        ││
│ │ Compact DataTable (10 rows, no pagination)               ││
│ │ Cols: Case #, Title, Status badge, Crime Type, Updated   ││
│ │ Rows click → /cases/[id]                                 ││
│ │ [View all my cases →]                                    ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── PendingActionsWidget (1/3) ─────────────────────────────┐│
│ │ "Pending Actions"                                        ││
│ │ Evidence missing custody  [count chip]  [link →]        ││
│ │ Cases without update      [count chip]  [link →]        ││
│ │ (Empty: "No pending actions." success text)             ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Widget error state:** Each widget independently renders an inline `ErrorState` (compact, no full-page takeover) when its portion of the data fails. A narrow "Unable to load" message with a retry button inside the card. Other widgets continue showing normally.

**KPI cards use `KpiCard` shared component:**
- Open Cases: icon `Folder`, no trend
- Under Investigation: icon `Search`, no trend
- Referred to Court: icon `Gavel`, no trend
- Overdue Actions: icon `AlertCircle`, `changeIsPositiveWhenUp={false}` (overdue going up is bad)

## 19.2 DeptHeadDashboard — Layout

```
DeptHeadDashboard
──────────────────────────────────────────────────────────────
PageHeader  Title: Dashboard  Subtitle: [Department name]
──────────────────────────────────────────────────────────────

┌── KPI Strip (4-column grid) ────────────────────────────────┐
│ [Active Cases] [Resolution Rate] [Avg Case Age] [Arrests]  │
└─────────────────────────────────────────────────────────────┘

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── CaseStatusChartWidget (1/2) ───────────────────────────┐│
│ │ "Cases by Status"                                        ││
│ │ CcmsDonutChart — each status a series colour             ││
│ │ Centre: total count, "Total" label                       ││
│ │ Legend below chart                                       ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── WorkloadByOfficerWidget (1/2) ─────────────────────────┐│
│ │ "Officer Workload"  subtitle: "Active cases per officer" ││
│ │ CcmsBarChart — layout='vertical'                         ││
│ │ xAxisKey='fullName', dataKey='activeCaseCount'           ││
│ │ Up to 10 officers, sorted desc by activeCaseCount        ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── DepartmentActivityWidget (2/3) ────────────────────────┐│
│ │ "Recent Department Activity"                             ││
│ │ Compact list (no DataTable): actor, action, timestamp    ││
│ │ [View full timeline →] → /cases?departmentId=X           ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── ReportsQuickLinksWidget (1/3) ──────────────────────────┐│
│ │ "Reports"                                                ││
│ │ [Case Reports →]  [Officer Workload →]  [Legal →]        ││
│ │ Each is a card link to the corresponding reports sub-page ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Case status colours for donut:** Map each status string to a `CHART_COLORS` value:
- `OPEN` → `CHART_COLORS.primary`
- `UNDER_INVESTIGATION` → `CHART_COLORS.warning`
- `REFERRED_TO_COURT` → `CHART_COLORS.accent`
- `CLOSED` → `CHART_COLORS.success`
- `ARCHIVED` → `CHART_COLORS.muted`

## 19.3 AdminDashboard — Layout

```
AdminDashboard
──────────────────────────────────────────────────────────────
PageHeader  Title: Dashboard
──────────────────────────────────────────────────────────────

┌── KPI Strip (4-column grid) ────────────────────────────────┐
│ [Total Cases] [Total Officers] [Evidence Items] [Health]   │
└─────────────────────────────────────────────────────────────┘

System Health KPI card:
  - Value: t('dashboard.admin.healthStatus.{status}')
  - Icon: CheckCircle (healthy), AlertTriangle (degraded), XCircle (down)
  - No trend indicator
  - Links to /admin/health
  - Background tint: subtle success/warning/destructive tint via className

┌── Full-width CaseVolumeTrendWidget ────────────────────────┐
│ "Case Volume — Last 30 Days"                               │
│ CcmsLineChart — single series 'count', xAxisKey='date'     │
│ xAxisTickFormatter: format(parseISO(v), 'MMM d')           │
└───────────────────────────────────────────────────────────┘

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── SecurityEventsWidget (1/2) ─────────────────────────────┐│
│ │ "Security Events"  [View audit log →]                    ││
│ │ List of events — icon, description, actor, timestamp     ││
│ │ Severity chip: low=muted, medium=warning, high=destructive││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── DepartmentOverviewWidget (1/2) ─────────────────────────┐│
│ │ "Department Overview"  [View all departments →]          ││
│ │ Compact table: Name, Active Cases, Officers              ││
│ │ Rows link to /departments/[id]                           ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌── Full-width PendingAdminTasksWidget ──────────────────────┐
│ "Pending Tasks"                                            │
│ Two metric rows:                                           │
│   Officers awaiting activation: [count] [Review →]        │
│   Departments without head:     [count] [Review →]        │
│ (All-clear: success text with checkmark)                   │
└───────────────────────────────────────────────────────────┘
```

## 19.4 LegalDashboard — Layout

```
LegalDashboard
──────────────────────────────────────────────────────────────
PageHeader  Title: Dashboard
──────────────────────────────────────────────────────────────

┌── KPI Strip (4-column grid) ────────────────────────────────┐
│ [Open Court Cases] [Charges/Month] [Hearings] [Conviction%]│
└─────────────────────────────────────────────────────────────┘

Conviction Rate KPI:
  - `valueFormatter={(v) => formatPercent(v as number)}`
  - `changeIsPositiveWhenUp={true}` (higher conviction rate is positive)
  - null value shows '—'

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── UpcomingHearingsWidget (3/5) ───────────────────────────┐│
│ │ "Upcoming Hearings"  [View all →]                        ││
│ │ Compact list (not DataTable):                            ││
│ │   Case # — Case Title                                    ││
│ │   Court: [name]    Date: [dd MMM yyyy]    Type: [type]   ││
│ │ Sorted by hearingDate asc                                ││
│ │ (Empty: no hearings next 30 days)                        ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── RecentChargesWidget (2/5) ──────────────────────────────┐│
│ │ "Recent Charges"  [View all →]                           ││
│ │ Compact DataTable (10 rows, no pagination)               ││
│ │ Cols: Crime Type (code badge), Suspect, Status, Filed    ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

# 20. UI Implementation — Reports Shell

## 20.1 `ReportsShell.tsx`

Client Component. Provides the left sub-navigation and houses `{children}` in the right content area.

```
ReportsShell
──────────────────────────────────────────────────────────────
PageHeader
  Title: t('reports.pageTitle')
  Actions: (no global actions — export is per-report)
──────────────────────────────────────────────────────────────

┌── Two-panel layout ─────────────────────────────────────────┐
│ ┌── Left sub-nav (200px, sticky) ───────────────────────────┐│
│ │  Case Reports         (→ /reports/cases)                 ││
│ │  Evidence Reports     (→ /reports/evidence)              ││
│ │  Arrest Reports       (→ /reports/arrests)               ││
│ │  Officer Workload     (→ /reports/officers)              ││
│ │  Legal Reports        (→ /reports/legal)                 ││
│ │  Department Reports   (→ /reports/departments) admin+ only││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── Right content area (flex-1) ────────────────────────────┐│
│ │  {children}                                              ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Sub-nav active state:** Use `usePathname()` from `next/navigation` to detect the active sub-page. The active item has a solid left border in `var(--color-primary)` and `text-foreground`. Inactive items have `text-foreground-muted` and a hover state of `text-foreground + bg-card-hover`.

**Department Reports item:** Wrap with `PermissionGuard permission={Permission.ADMIN_MANAGE}`. If the guard hides the item, `/reports/departments` renders `ForbiddenState` at the page level as a second line of defence.

## 20.2 `ReportsFilterBar.tsx`

Client Component. Rendered at the top of every report sub-page (not in the shell layout). Each sub-page component is responsible for mounting `ReportsFilterBar` and owning its filter state.

```
ReportsFilterBar
──────────────────────────────────────────────────────────────
[Last 7 Days] [Last 30 Days] [Last Quarter]  📅 [From] – [To]
                                             [DeptSelect] (admin+ only)
──────────────────────────────────────────────────────────────
```

**Filter state** — each report sub-page manages its own filter state via `useQueryStates`:

```typescript
const [filters, setFilters] = useQueryStates({
  dateFrom: parseAsString.withDefault(format(subDays(new Date(), 29), 'yyyy-MM-dd')),
  dateTo:   parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd')),
  preset:   parseAsString.withDefault(DatePreset.LAST_30_DAYS),
  departmentId: parseAsString.withDefault(''),
})
```

Pass `filters` down to `ReportsFilterBar` and to all report hooks on the same page.

**Department selector:** Visible for `ADMIN` and `SUPERADMIN` only. Uses the existing `DepartmentSelect` shared component (`pageSize: 100`). When `departmentId` is empty, the backend returns data for all departments. For `DEPT_HEAD`, omit the selector entirely — the backend auto-scopes to their department.

---

# 21. UI Implementation — Case Reports

## 21.1 `CaseReports.tsx`

Client Component.

```
CaseReports
──────────────────────────────────────────────────────────────
ReportsFilterBar (filter state managed here)
──────────────────────────────────────────────────────────────

[Export CSV] button  — calls downloadReportCsv('cases/status-summary', filters)
Period label: t('reports.periodLabel', { dateFrom, dateTo })

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── Status Summary (CcmsDonutChart) ───────────────────────┐│
│ │  "Case Status Distribution"                              ││
│ │  Centre: total count, "Total Cases"                      ││
│ │  Legend maps status → translated label                   ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── Resolution Metrics (3 KpiCard-style stat rows) ─────────┐│
│ │  Cases Closed:        {totalClosed}                      ││
│ │  Resolution Rate:     {formatPercent(rate)}              ││
│ │  Avg Case Age:        {avgAge} days                      ││
│ │  Median Case Age:     {medianAge} days                   ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌── Full-width Volume Trend ──────────────────────────────────┐
│ "New Cases Over Time"                                       │
│ CcmsLineChart — series: [{ dataKey:'count', label:'Cases' }]│
│ xAxisTickFormatter: format(parseISO(v), 'MMM d')            │
│ Total in period: {totalInPeriod}                           │
└───────────────────────────────────────────────────────────┘
```

The Export CSV button calls `downloadReportCsv` with the current `filters` object. The button shows a loading spinner (`isLoading` local state) during the async download and surfaces errors via `addToast`.

---

# 22. UI Implementation — Evidence Reports

## 22.1 `EvidenceReports.tsx`

```
EvidenceReports
──────────────────────────────────────────────────────────────
ReportsFilterBar + [Export CSV]
──────────────────────────────────────────────────────────────

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── Type Breakdown (CcmsDonutChart) ───────────────────────┐│
│ │  "Evidence by Type"                                      ││
│ │  Centre: total count                                     ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── Volume Trend (CcmsLineChart) ───────────────────────────┐│
│ │  "Evidence Volume Over Time"                             ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌── Full-width Unreviewed Evidence Table ────────────────────┐
│ "Unreviewed Evidence"                                       │
│ Count badge: "{count} item(s) require review" (amber)      │
│ DataTable — cols: Case, Type, Collected, Days Unreviewed   │
│ Case column links to /cases/[id]                           │
│ Rows sorted by daysUnreviewed desc                         │
│ (If count === 0: success empty state)                      │
└───────────────────────────────────────────────────────────┘
```

---

# 23. UI Implementation — Arrest Reports

## 23.1 `ArrestReports.tsx`

```
ArrestReports
──────────────────────────────────────────────────────────────
ReportsFilterBar + [Export CSV]
──────────────────────────────────────────────────────────────

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── Summary Card ────────────────────────────────────────────┐│
│ │  "Arrest Summary"                                         ││
│ │  Total: [large number]                                    ││
│ │  Change: [formatChange(changePercent)] vs previous period ││
│ │  (null changePercent: "No comparison data" in muted)      ││
│ └───────────────────────────────────────────────────────────┘│
│ ┌── Monthly Trend (CcmsBarChart) ───────────────────────────┐│
│ │  "Monthly Arrest Trend"                                  ││
│ │  xAxisKey='month', series: [{ dataKey:'count' }]         ││
│ │  xAxisTickFormatter: format(parseISO(v+'-01'), 'MMM yy') ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

# 24. UI Implementation — Officer Workload Reports

## 24.1 `OfficerWorkloadReports.tsx`

```
OfficerWorkloadReports
──────────────────────────────────────────────────────────────
ReportsFilterBar + [Export CSV]
──────────────────────────────────────────────────────────────

┌── Full-width Active Case Load Table ───────────────────────┐
│ "Active Case Load"                                          │
│ DataTable — cols: Officer, Badge, Active Cases, Opened, Closed│
│ Sorted by activeCaseCount desc by default                  │
│ Officer name links to /personnel/officers/[id]             │
│ Badge in monospace                                         │
└───────────────────────────────────────────────────────────┘

┌── Full-width Activity Metrics Table ───────────────────────┐
│ "Officer Activity Metrics"                                  │
│ DataTable — cols: Officer, Badge, Evidence, Interrogations, Arrests│
│ Sorted by evidenceItemsLogged desc by default              │
└───────────────────────────────────────────────────────────┘
```

These DataTables are client-side sorted only (no server-side pagination — the dataset is bounded by the department filter). Use `@tanstack/react-table` `getSortedRowModel()`.

---

# 25. UI Implementation — Legal Reports

## 25.1 `LegalReports.tsx`

```
LegalReports
──────────────────────────────────────────────────────────────
ReportsFilterBar + [Export CSV]
──────────────────────────────────────────────────────────────

┌── Two-column grid ──────────────────────────────────────────┐
│ ┌── Charge Outcomes (CcmsDonutChart) ───────────────────────┐│
│ │  "Charge Outcomes"                                       ││
│ │  Colours: convicted=destructive, acquitted=success,      ││
│ │           dropped=muted, pending=warning                 ││
│ │  Centre: total count, "Total Charges"                    ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌── Conviction Rate Trend (CcmsLineChart) ──────────────────┐│
│ │  "Conviction Rate Trend"                                 ││
│ │  Overall Rate: {formatPercent(overallRatePercent)} (large)││
│ │  xAxisKey='month', series: [{ dataKey:'ratePercent' }]   ││
│ │  yAxisTickFormatter: (v) => `${v}%`                      ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌── Full-width Upcoming Hearings Table ──────────────────────┐
│ "Upcoming Hearings"                                         │
│ Total badge: "{count} hearing(s) scheduled" (primary)      │
│ DataTable — cols: Case, Court, Hearing Date, Type, Officer  │
│ Case column links to /cases/[id]                           │
│ Sorted by hearingDate asc                                  │
│ (Empty: "No hearings scheduled" with EmptyState)           │
└───────────────────────────────────────────────────────────┘
```

---

# 26. UI Implementation — Department Reports

## 26.1 `DepartmentReports.tsx`

Client Component. Guarded at page level: renders `ForbiddenState` for roles below `ADMIN`.

```
DepartmentReports
──────────────────────────────────────────────────────────────
[PermissionGuard ADMIN_MANAGE fallback=<ForbiddenState />]
──────────────────────────────────────────────────────────────
ReportsFilterBar (departmentId filter hidden — showing all depts)
[Export CSV]
──────────────────────────────────────────────────────────────

┌── Full-width Department Comparison Table ──────────────────┐
│ "Department Comparison"                                     │
│ DataTable — cols: Department, Active Cases, Closed, Officers│
│                   Resolution Rate, Avg Case Age            │
│ Dept name links to /departments/[id]                       │
│ Resolution Rate and Avg Age show '—' when null             │
│ Avg Age suffix: 'd' (days, compact)                        │
└───────────────────────────────────────────────────────────┘

┌── Full-width Case Distribution Donut ──────────────────────┐
│ "Case Distribution by Department"                          │
│ CcmsDonutChart — one slice per department                  │
│ Centre: total count, "Total Cases"                         │
│ Legend below chart (department names)                      │
│ Total badge: "{total} cases across all departments"        │
└───────────────────────────────────────────────────────────┘
```

Note: the `departmentId` filter is hidden on this page — it doesn't make sense to filter department comparison reports by a single department. Only the date range filter is shown.

---

# 27. Barrel Exports

## 27.1 `src/features/dashboard/index.ts`

```typescript
export * from './types/dashboard.types'

export {
  useInvestigatorDashboard,
  useDeptHeadDashboard,
  useAdminDashboard,
  useLegalDashboard,
} from './hooks'

export { DashboardPage } from './components/DashboardPage'
```

## 27.2 `src/features/reports/index.ts`

```typescript
export * from './types/reports.types'

export {
  useCaseStatusSummary,
  useCaseVolumeTrend,
  useCaseResolutionReport,
  useEvidenceTypeBreakdown,
  useEvidenceVolumeTrend,
  useUnreviewedEvidenceReport,
  useArrestSummary,
  useArrestMonthlyTrend,
  useOfficerWorkloadReport,
  useOfficerActivityReport,
  useChargeOutcomeReport,
  useConvictionRateTrend,
  useUpcomingHearingsReport,
  useDepartmentComparisonReport,
  useDepartmentCaseDistribution,
} from './hooks'

export { ReportsShell } from './components/ReportsShell'
export {
  buildCsvFilename,
  buildReportParams,
  formatPercent,
  formatChange,
  getChangeDirection,
  resolveDatePreset,
  getDefaultReportFilters,
} from './utils/reportUtils'
```

---

# 28. Role-Based Access

## 28.1 Dashboard access

The dashboard (`/dashboard`) is accessible to all authenticated roles. The `DashboardPage` role router ensures each role sees only their appropriate data. There are no permission guards on individual widgets — the backend endpoints enforce role scoping server-side (e.g., the `/api/v1/dashboard/dept-head` endpoint will return a 403 for non-dept-head officers).

## 28.2 Reports access

The reports module (`/reports/*`) is accessible to `DEPT_HEAD`, `ADMIN`, and `SUPERADMIN` only. The middleware-level route guard blocks `INVESTIGATOR`, `FORENSIC`, and `LEGAL_OFFICER` from accessing `/reports`. The `ReportsShell` component does not need a client-side permission guard — middleware handles it. However, the `DepartmentReports` sub-page wraps its content in an additional `PermissionGuard` for `ADMIN_MANAGE`.

**Department filter in reports:** The `DepartmentSelect` inside `ReportsFilterBar` is only rendered for `ADMIN` and `SUPERADMIN`:

```tsx
<PermissionGuard permission={Permission.ADMIN_MANAGE}>
  <DepartmentSelect
    value={filters.departmentId}
    onChange={(v) => setFilters({ departmentId: v })}
    placeholder={t('reports.filters.departmentAll')}
  />
</PermissionGuard>
```

For `DEPT_HEAD`, the backend automatically scopes all report data to their department — no department selector is shown.

## 28.3 Officer links in reports

The officer name links in the Officer Workload DataTable navigate to `/personnel/officers/[id]`. Officer list access requires `DEPT_HEAD` or higher. Since the reports module itself requires `DEPT_HEAD` or higher, these links are always safe for report viewers.

---

# 29. Anti-Pattern Reference

The following patterns are strictly forbidden.

**Dashboard architecture violations:**
- Storing dashboard API data in Zustand — dashboard data is server state; it belongs exclusively in React Query cache. The Zustand `authStore` is read-only here (for role detection)
- Rendering the full `SystemHealthPanel` inside the Admin dashboard — the health status is shown as a single `KpiCard` that links to `/admin/health`. The full polling panel belongs on the dedicated health page only
- Showing dashboard widget loading skeletons on every 60-second background refetch — the skeleton is for initial load only. Use `isLoading` (not `isFetching`) to control skeleton visibility. `isLoading` is only true on the first fetch; `isFetching` is true on every refetch
- Not setting `refetchIntervalInBackground: false` on dashboard hooks — dashboard polling must pause when the browser tab is inactive
- Fetching dashboard data from multiple separate endpoints per widget instead of using the single aggregate endpoint — each dashboard variant has one aggregate endpoint call, not four separate ones
- Reusing a single `useAdminDashboard` hook result across multiple widgets via prop drilling — each widget should destructure what it needs from the same hook result at the orchestration (dashboard variant) component level, then receive it as props

**Reports architecture violations:**
- Client-side filtering of report data — all filter parameters must be sent as API query params. No `.filter()` on the client after data is received
- Using Zustand to store the active date range — report filters live in URL query params via `nuqs`
- Triggering report data re-fetches by manually calling `refetch()` when filters change — React Query handles this automatically when the `queryKey` changes (which it does because filters are in the key)
- Sharing filter state between sub-pages via Zustand or context — each sub-page manages its own `useQueryStates` independently. Navigating between sub-pages and back preserves filter state via URL
- Omitting `enabled: Boolean(filters.dateFrom && filters.dateTo)` on report hooks — without this guard, hooks fire on first render before default values are applied by `nuqs`
- Calling `downloadReportCsv` through `apiClient` instead of `axiosInstance` — `apiClient` is set up for JSON responses and will fail with blob data. The CSV download must use the underlying `axiosInstance` directly
- Naming CSV download files without a date suffix — always use `buildCsvFilename` which appends the current date

**Chart violations:**
- Using CSS variable syntax (`var(--color-primary)`) in Recharts color props — Recharts renders SVG and cannot resolve CSS variables. Use hex values from `CHART_COLORS` exclusively
- Using raw Recharts components directly in feature components — always use the `Ccms{LineChart/BarChart/DonutChart}` wrappers. This ensures consistent theming and prevents each feature component from reimplementing tooltip/axis styling
- Placing Recharts inside a container without `ResponsiveContainer` — all charts must be wrapped in `ResponsiveContainer`; fixed pixel dimensions are forbidden
- Showing charts with data arrays of length zero without an empty state — check `data.length === 0` and render a `NoData` state instead of an empty Recharts canvas
- Animating charts on every refetch — Recharts animates by default. Disable animation on background refetches by setting `isAnimationActive={false}` once data has been loaded at least once. Use a `hasLoadedOnce` ref to track this

**KpiCard violations:**
- Using `isFetching` to show the skeleton loading state — use `isLoading` only. `isFetching` fires on every background poll and would cause the card to flash on every refetch
- Not passing `changeIsPositiveWhenUp={false}` for metrics where an increase is bad (e.g. overdue counts, unreviewed evidence count) — colour semantics must accurately reflect whether a change is good or bad

**Reports layout violations:**
- Using the main Sidebar for reports sub-navigation — the reports sub-nav is a left panel within the main content area, separate from the primary sidebar
- Showing the Department filter selector for `DEPT_HEAD` — they cannot select a department; the backend scopes automatically. The selector causes confusion and must be hidden for this role
- Showing the Department filter on the Department Comparison page — filtering a department comparison by department makes no sense. Hide the department selector on `/reports/departments`

**Module boundary violations:**
- Importing types from `@features/cases` in the dashboard module to reference `CaseStatus` — use string types in `DashboardData` interfaces, as established by the departments module pattern
- Importing from `@features/dashboard` inside `@features/reports` or vice versa — these modules are independent
- Using raw `date-fns` in components instead of going through `reportUtils` helpers for date formatting — consistency requires all report-related date logic to route through the shared utils

**i18n violations:**
- Hardcoding health status labels (`"Healthy"`) instead of `t('dashboard.admin.healthStatus.healthy')`
- Hardcoding charge outcome labels instead of `t('reports.legal.chargeOutcomes.outcomes.convicted')`
- Hardcoding date preset labels instead of `t('reports.filters.presets.last30Days')`
- Using Recharts legend labels from raw data strings instead of i18n-translated labels — status strings from the API are internal codes; always translate them before passing to chart `name` props

---

# 30. Final Verification Checklist

## 30.1 Dashboard

- [ ] `/dashboard` renders the correct variant based on the authenticated officer's role (not the skeleton)
- [ ] `INVESTIGATOR` and `FORENSIC` roles see `InvestigatorDashboard`
- [ ] `DEPT_HEAD` role sees `DeptHeadDashboard`
- [ ] `ADMIN` and `SUPERADMIN` roles see `AdminDashboard`
- [ ] `LEGAL_OFFICER` role sees `LegalDashboard`
- [ ] Unknown roles see the fallback `EmptyState`
- [ ] All four KPI strips render with real data and loading skeletons during initial fetch
- [ ] KPI card trend indicators use correct colours (green = positive, red = negative)
- [ ] `changeIsPositiveWhenUp={false}` is applied to overdue/negative metrics
- [ ] Widget loading skeletons are visible on initial load only — background refetches at 60s do NOT show skeletons (existing data stays visible)
- [ ] Each widget has an independent inline error state on failure — other widgets continue showing
- [ ] The `CcmsDonutChart` in `DeptHeadDashboard` renders with CCMS case status colours
- [ ] The `CcmsBarChart` in `DeptHeadDashboard` renders vertically (officer names on Y axis)
- [ ] The `CcmsLineChart` in `AdminDashboard` renders the 30-day trend with formatted X-axis dates
- [ ] The system health `KpiCard` links to `/admin/health`
- [ ] Pending tasks widget links navigate to `/personnel/officers` and `/departments` respectively
- [ ] Dashboard polls are NOT active when the browser tab is in the background

## 30.2 Reports Shell

- [ ] Navigating to `/reports` redirects to `/reports/cases`
- [ ] The left sub-navigation is visible on all report sub-pages
- [ ] The active sub-nav item is visually highlighted (left border + foreground text)
- [ ] The Department Reports sub-nav item is absent for roles below `ADMIN`
- [ ] Filter state (dateFrom, dateTo, departmentId) persists in the URL when navigating between sub-pages
- [ ] Filter state survives page refresh

## 30.3 Date Range Filter

- [ ] "Last 7 Days" preset sets `dateFrom` to today−6 and `dateTo` to today
- [ ] "Last 30 Days" preset sets `dateFrom` to today−29 and `dateTo` to today
- [ ] "Last Quarter" preset correctly calculates the previous calendar quarter's start and end
- [ ] Selecting a custom date range via the `DatePicker` inputs switches the active preset to `custom`
- [ ] Changing any filter triggers a new API request and updates all charts on the current sub-page
- [ ] Department selector is visible for `ADMIN` and `SUPERADMIN`; absent for `DEPT_HEAD`

## 30.4 Case Reports

- [ ] `/reports/cases` renders three visualisations: status donut, resolution metrics, volume trend line chart
- [ ] Status donut shows correct status labels (translated, not raw API strings)
- [ ] Resolution metrics show `—` when `resolutionRatePercent`, `averageAgeDays`, or `medianAgeDays` is null
- [ ] Volume trend X-axis shows formatted dates (`Jun 1`, `Jun 2`, …)
- [ ] Export CSV triggers a file download named `ccms-cases-status-summary-{date}.csv`
- [ ] Period label updates when the date range changes

## 30.5 Evidence Reports

- [ ] `/reports/evidence` renders type breakdown donut, volume trend, and unreviewed evidence table
- [ ] Unreviewed evidence table shows amber count badge when count > 0
- [ ] Unreviewed evidence table shows success empty state when count === 0
- [ ] Case column in unreviewed table links to `/cases/[id]`

## 30.6 Arrest Reports

- [ ] `/reports/arrests` renders arrest summary card and monthly trend bar chart
- [ ] Change indicator is absent (or shows `—`) when `changePercent` is null
- [ ] Monthly trend X-axis shows formatted month labels (`Jun 26`, `Jul 26`, …)

## 30.7 Officer Workload Reports

- [ ] `/reports/officers` renders two tables: active case load and activity metrics
- [ ] Officer name links to `/personnel/officers/[id]`
- [ ] Tables are client-side sortable by column headers
- [ ] Badge column renders in monospace font

## 30.8 Legal Reports

- [ ] `/reports/legal` renders charge outcomes donut, conviction rate trend line, upcoming hearings table
- [ ] Charge outcomes donut uses correct semantic colours: convicted=destructive, acquitted=success, dropped=muted, pending=warning
- [ ] Overall conviction rate shows `—` when `overallRatePercent` is null
- [ ] Conviction rate Y-axis appends `%` to values
- [ ] Upcoming hearings table sorted by `hearingDate` ascending
- [ ] Case column in hearings table links to `/cases/[id]`

## 30.9 Department Reports

- [ ] `/reports/departments` shows `ForbiddenState` for roles below `ADMIN`
- [ ] For `ADMIN`/`SUPERADMIN`: renders comparison table and case distribution donut
- [ ] Department name column links to `/departments/[id]`
- [ ] Resolution Rate and Avg Case Age show `—` when null
- [ ] Department distribution donut shows one slice per department with names in legend

## 30.10 Recharts Charts

- [ ] All charts render on a dark background without white/default background bleeding through
- [ ] Grid lines use `CHART_COLORS.gridLine` (`#334155`)
- [ ] Axis labels use `CHART_COLORS.axisLabel` (`#94A3B8`)
- [ ] Tooltips use the CCMS card/border colour scheme (dark background, light text)
- [ ] Charts with empty data (`data.length === 0`) render a `NoData` fallback — not an empty Recharts canvas
- [ ] All charts are wrapped in `ResponsiveContainer` — no fixed-width chart containers
- [ ] Charts do not animate on background refetches (only on initial load)

## 30.11 Shared Components

- [ ] `KpiCard` renders skeleton when `isLoading={true}`
- [ ] `KpiCard` renders `—` when `value` is `null`
- [ ] `KpiCard` wraps the card in a `Link` when `linkTo` is provided
- [ ] `DateRangePicker` preset buttons correctly populate `dateFrom` and `dateTo`
- [ ] `DateRangePicker` `maxDate` on the From picker is set to the current `dateTo` value
- [ ] `DateRangePicker` `minDate` on the To picker is set to the current `dateFrom` value

## 30.12 i18n

- [ ] All dashboard UI text retrieved from message files — no hardcoded English
- [ ] All reports UI text retrieved from message files — no hardcoded English
- [ ] Switching to Amharic updates all dashboard text, widget labels, and KPI titles
- [ ] Switching to Amharic updates all reports navigation, filter labels, and table headers
- [ ] Chart legend labels are i18n translated (not raw API status strings)
- [ ] Health status label on Admin KPI card renders in selected locale
- [ ] Charge outcome labels in donut chart legend render in selected locale
- [ ] i18n completeness test passes with zero missing keys in `dashboard` namespace (EN + AM)
- [ ] i18n completeness test passes with zero missing keys in `reports` namespace (EN + AM)

## 30.13 Tooling

- [ ] `pnpm type-check` exits with zero errors
- [ ] `pnpm build` — production build succeeds without errors
- [ ] `axiosInstance` is exported from `@services/api/client` (verify and add export if missing)

---

*End of CCMS Phase 9 Instruction — Dashboards & Reports Module*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
*Next phase: Phase 10 will implement the Audit System module — the full AuditTimeline component with diff viewer, custody gap detection, actor search, event type filtering, date range filters, print view, CSV export, and the three audit surfaces: case timeline (replacing the existing simple timeline component), officer history view (admin+), and person history view (admin+), plus the global audit log page at `/admin/audit`*