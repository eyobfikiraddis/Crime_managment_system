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
