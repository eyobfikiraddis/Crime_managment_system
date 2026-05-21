export const interrogationKeys = {
  all: ['interrogations'] as const,
  lists: () => [...interrogationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...interrogationKeys.lists(), filters] as const,
  details: () => [...interrogationKeys.all, 'detail'] as const,
  detail: (id: string) => [...interrogationKeys.details(), id] as const,
} as const
