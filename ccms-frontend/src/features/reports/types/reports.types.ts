// ─── Shared filter type ───────────────────────────────────────────────────────

export interface ReportFilters {
  dateFrom: string               // 'YYYY-MM-DD'
  dateTo: string                 // 'YYYY-MM-DD'
  departmentId?: string | undefined // Admin+ only; omitted = all departments (admin) or own dept (dept head)
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
