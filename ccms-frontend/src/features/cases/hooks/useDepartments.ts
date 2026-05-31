import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.departmentList(),
    queryFn: () => getDepartments({ pageSize: 100 }).then((res) => res.data),
    staleTime: 30 * 60 * 1000,
  })
}
