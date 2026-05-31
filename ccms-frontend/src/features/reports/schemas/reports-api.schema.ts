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
