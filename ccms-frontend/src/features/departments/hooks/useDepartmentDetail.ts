import { useQuery } from '@tanstack/react-query'
import { getDepartment } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartmentDetail(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.department(departmentId),
    queryFn: () => getDepartment(departmentId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(departmentId),
  })
}
