export const arrestKeys = {
  all: ['arrests'] as const,

  // All arrests for a case
  caseArrests: (caseId: string) => [...arrestKeys.all, 'case', caseId] as const,
  caseArrestList: (caseId: string, filters: Record<string, unknown>) =>
    [...arrestKeys.caseArrests(caseId), 'list', filters] as const,

  // Single arrest detail
  details: () => [...arrestKeys.all, 'detail'] as const,
  detail: (arrestId: string) => [...arrestKeys.details(), arrestId] as const,
} as const
