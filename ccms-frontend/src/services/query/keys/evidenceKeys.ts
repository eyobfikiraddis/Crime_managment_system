export const evidenceKeys = {
  all: ['evidence'] as const,

  // All evidence for a case
  caseEvidence: (caseId: string) => [...evidenceKeys.all, 'case', caseId] as const,
  caseEvidenceList: (caseId: string, filters: Record<string, unknown>) =>
    [...evidenceKeys.caseEvidence(caseId), 'list', filters] as const,

  // Single evidence item
  details: () => [...evidenceKeys.all, 'detail'] as const,
  detail: (evidenceId: string) => [...evidenceKeys.details(), evidenceId] as const,

  // Custody chain
  custodyChain: (evidenceId: string) =>
    [...evidenceKeys.detail(evidenceId), 'custody'] as const,
} as const
