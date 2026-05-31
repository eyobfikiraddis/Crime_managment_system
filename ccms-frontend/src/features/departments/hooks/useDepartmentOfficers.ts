import { useQuery } from '@tanstack/react-query'
import { getDepartmentOfficers } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartmentOfficers(
  departmentId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: [...departmentKeys.departmentOfficers(departmentId), params],
    queryFn: () => getDepartmentOfficers(departmentId, params),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(departmentId),
  })
}
