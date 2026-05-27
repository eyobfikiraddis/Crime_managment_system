import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: getDepartments,
    staleTime: 30 * 60 * 1000,
  })
}
