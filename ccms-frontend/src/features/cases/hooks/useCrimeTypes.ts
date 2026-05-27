import { useQuery } from '@tanstack/react-query'
import { getCrimeTypes } from '@services/domain/cases.service'
import { caseKeys } from '@services/query/keys/caseKeys'

export function useCrimeTypes() {
  return useQuery({
    queryKey: caseKeys.crimeTypes(),
    queryFn: getCrimeTypes,
    staleTime: 30 * 60 * 1000,
  })
}
