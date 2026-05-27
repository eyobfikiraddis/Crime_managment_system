export const caseKeys = {
  all: ['cases'] as const,

  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...caseKeys.lists(), filters] as const,

  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,

  // Sub-resources keyed under detail(id) for precise invalidation
  summary: (id: string) => [...caseKeys.detail(id), 'summary'] as const,
  timeline: (id: string) => [...caseKeys.detail(id), 'timeline'] as const,
  timelineFiltered: (id: string, filters: Record<string, unknown>) =>
    [...caseKeys.timeline(id), filters] as const,
  officers: (id: string) => [...caseKeys.detail(id), 'officers'] as const,
  evidence: (id: string) => [...caseKeys.detail(id), 'evidence'] as const,
  arrests: (id: string) => [...caseKeys.detail(id), 'arrests'] as const,
  interrogations: (id: string) => [...caseKeys.detail(id), 'interrogations'] as const,
  permissions: (id: string) => [...caseKeys.detail(id), 'permissions'] as const,

  // Reference data
  crimeTypes: () => [...caseKeys.all, 'crimeTypes'] as const,
  locations: () => [...caseKeys.all, 'locations'] as const,
} as const
