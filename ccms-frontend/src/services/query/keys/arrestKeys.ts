export const arrestKeys = {
  all: ['arrests'] as const,
  lists: () => [...arrestKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...arrestKeys.lists(), filters] as const,
  details: () => [...arrestKeys.all, 'detail'] as const,
  detail: (id: string) => [...arrestKeys.details(), id] as const,
} as const
