import type { ReportFilters } from '@features/reports/types/reports.types'

export const reportKeys = {
  all: () => ['reports'] as const,

  // ── Case reports ─────────────────────────────────────────────────────────
  cases: () => [...reportKeys.all(), 'cases'] as const,
  caseStatusSummary:  (filters: ReportFilters) =>
    [...reportKeys.cases(), 'status-summary', filters] as const,
  caseVolumeTrend:    (filters: ReportFilters) =>
    [...reportKeys.cases(), 'volume-trend', filters] as const,
  caseResolution:     (filters: ReportFilters) =>
    [...reportKeys.cases(), 'resolution', filters] as const,

  // ── Evidence reports ──────────────────────────────────────────────────────
  evidence: () => [...reportKeys.all(), 'evidence'] as const,
  evidenceTypeBreakdown: (filters: ReportFilters) =>
    [...reportKeys.evidence(), 'type-breakdown', filters] as const,
  evidenceVolumeTrend:   (filters: ReportFilters) =>
    [...reportKeys.evidence(), 'volume-trend', filters] as const,
  unreviewedEvidence:    (filters: ReportFilters) =>
    [...reportKeys.evidence(), 'unreviewed', filters] as const,

  // ── Arrest reports ────────────────────────────────────────────────────────
  arrests: () => [...reportKeys.all(), 'arrests'] as const,
  arrestSummary:       (filters: ReportFilters) =>
    [...reportKeys.arrests(), 'summary', filters] as const,
  arrestMonthlyTrend:  (filters: ReportFilters) =>
    [...reportKeys.arrests(), 'monthly-trend', filters] as const,

  // ── Officer reports ───────────────────────────────────────────────────────
  officers: () => [...reportKeys.all(), 'officers'] as const,
  officerWorkload:  (filters: ReportFilters) =>
    [...reportKeys.officers(), 'workload', filters] as const,
  officerActivity:  (filters: ReportFilters) =>
    [...reportKeys.officers(), 'activity', filters] as const,

  // ── Legal reports ─────────────────────────────────────────────────────────
  legal: () => [...reportKeys.all(), 'legal'] as const,
  chargeOutcomes:      (filters: ReportFilters) =>
    [...reportKeys.legal(), 'charge-outcomes', filters] as const,
  convictionRateTrend: (filters: ReportFilters) =>
    [...reportKeys.legal(), 'conviction-rate-trend', filters] as const,
  upcomingHearings:    (filters: ReportFilters) =>
    [...reportKeys.legal(), 'upcoming-hearings', filters] as const,

  // ── Department reports (admin+) ───────────────────────────────────────────
  departments: () => [...reportKeys.all(), 'departments'] as const,
  deptComparison:      (filters: ReportFilters) =>
    [...reportKeys.departments(), 'comparison', filters] as const,
  deptCaseDistribution:(filters: ReportFilters) =>
    [...reportKeys.departments(), 'case-distribution', filters] as const,
} as const
