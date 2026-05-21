export const personnelKeys = {
  all: ['personnel'] as const,
  lists: () => [...personnelKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...personnelKeys.lists(), filters] as const,
  details: () => [...personnelKeys.all, 'detail'] as const,
  detail: (id: string) => [...personnelKeys.details(), id] as const,
} as const
