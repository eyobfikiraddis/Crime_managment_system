export const interrogationKeys = {
  all: ['interrogations'] as const,

  // All interrogations for a case
  caseInterrogations: (caseId: string) =>
    [...interrogationKeys.all, 'case', caseId] as const,
  caseInterrogationList: (caseId: string, filters: Record<string, unknown>) =>
    [...interrogationKeys.caseInterrogations(caseId), 'list', filters] as const,
} as const
