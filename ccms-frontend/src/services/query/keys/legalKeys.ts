export const legalKeys = {
  all: ['legal'] as const,
  lists: () => [...legalKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...legalKeys.lists(), filters] as const,
  details: () => [...legalKeys.all, 'detail'] as const,
  detail: (id: string) => [...legalKeys.details(), id] as const,
} as const
