export const adminKeys = {
  all: ['admin'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...adminKeys.lists(), filters] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
} as const
