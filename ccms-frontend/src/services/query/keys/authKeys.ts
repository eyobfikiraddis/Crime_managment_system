export const authKeys = {
  all: ['auth'] as const,
  lists: () => [...authKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...authKeys.lists(), filters] as const,
  details: () => [...authKeys.all, 'detail'] as const,
  detail: (id: string) => [...authKeys.details(), id] as const,
  session: () => [...authKeys.all, 'session'] as const,
} as const
