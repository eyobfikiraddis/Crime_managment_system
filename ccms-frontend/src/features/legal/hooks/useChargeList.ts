import { useQuery } from '@tanstack/react-query'
import { getCharges } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import type { ChargeFilters } from '../types/legal.types'

export function useChargeList(
  courtCaseId: string,
  caseId: string,
  filters: ChargeFilters,
) {
  return useQuery({
    queryKey: legalKeys.chargeListFiltered(
      courtCaseId,
      filters as Record<string, unknown>,
    ),
    queryFn: () => getCharges(courtCaseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(courtCaseId) && Boolean(caseId),
  })
}
