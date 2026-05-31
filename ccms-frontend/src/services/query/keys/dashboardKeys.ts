export const dashboardKeys = {
  all: () => ['dashboard'] as const,
  investigator: () => [...dashboardKeys.all(), 'investigator'] as const,
  deptHead:     () => [...dashboardKeys.all(), 'dept-head'] as const,
  admin:        () => [...dashboardKeys.all(), 'admin'] as const,
  legal:        () => [...dashboardKeys.all(), 'legal'] as const,
} as const
