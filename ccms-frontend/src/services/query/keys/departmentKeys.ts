export const departmentKeys = {
  // ── Root ──────────────────────────────────────────────────────────────────────
  departments: () => ['departments'] as const,

  departmentList: () => [...departmentKeys.departments(), 'list'] as const,
  departmentListFiltered: (filters: Record<string, unknown>) =>
    [...departmentKeys.departmentList(), filters] as const,

  departmentDetail: () => [...departmentKeys.departments(), 'detail'] as const,
  department: (departmentId: string) =>
    [...departmentKeys.departmentDetail(), departmentId] as const,

  departmentOfficers: (departmentId: string) =>
    [...departmentKeys.department(departmentId), 'officers'] as const,
} as const
