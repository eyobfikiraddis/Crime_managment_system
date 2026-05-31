import { apiClient, axiosInstance } from '@services/api/client'
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
