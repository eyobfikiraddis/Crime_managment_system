export const dashboardKeys = {
  all: ['dashboard'] as const,
  lists: () => [...dashboardKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...dashboardKeys.lists(), filters] as const,
  details: () => [...dashboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...dashboardKeys.details(), id] as const,
} as const
