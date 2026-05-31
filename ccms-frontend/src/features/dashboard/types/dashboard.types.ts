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

export interface RecentEvidenceItem {
  id: string
  caseId: string
  caseNumber: string
  type: string
  collectedAt: string
}

export interface InvestigatorDashboardData {
  kpis: InvestigatorKpis
  recentCases: InvestigatorCaseSummary[]      // Last 10 cases assigned to this officer
  recentEvidence?: RecentEvidenceItem[] | undefined // Last 5 evidence items logged
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
