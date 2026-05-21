export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
  evidence: (caseId: string) => [...caseKeys.detail(caseId), 'evidence'] as const,
  timeline: (caseId: string) => [...caseKeys.detail(caseId), 'timeline'] as const,
  permissions: (caseId: string) => [...caseKeys.detail(caseId), 'permissions'] as const,
  arrests: (caseId: string) => [...caseKeys.detail(caseId), 'arrests'] as const,
  interrogations: (caseId: string) => [...caseKeys.detail(caseId), 'interrogations'] as const,
} as const
