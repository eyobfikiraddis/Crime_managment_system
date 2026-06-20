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
    id: z.string(),
    caseNumber: z.string(),
    title: z.string(),
    status: z.string(),
    crimeTypeName: z.string().nullable(),
    lastUpdatedAt: z.string(),
  })),
  recentEvidence: z.array(z.object({
    id: z.string(),
    caseId: z.string(),
    caseNumber: z.string(),
    type: z.string(),
    collectedAt: z.string(),
  })).optional(),
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
    officerId: z.string(),
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
    departmentId: z.string(),
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
    courtCaseId: z.string(),
    caseNumber: z.string(),
    caseTitle: z.string(),
    hearingDate: z.string(),
    courtName: z.string(),
    hearingType: z.string(),
  })),
  recentCharges: z.array(z.object({
    id: z.string(),
    crimeTypeName: z.string(),
    crimeTypeCode: z.string(),
    suspectName: z.string(),
    status: z.string(),
    filedAt: z.string(),
  })),
})
