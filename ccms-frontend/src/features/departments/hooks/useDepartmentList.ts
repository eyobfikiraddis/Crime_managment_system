import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import type { DepartmentFilters } from '../types/department.types'

export function useDepartmentList(filters: DepartmentFilters) {
  return useQuery({
    queryKey: departmentKeys.departmentListFiltered(filters as Record<string, unknown>),
    queryFn: () => getDepartments(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
