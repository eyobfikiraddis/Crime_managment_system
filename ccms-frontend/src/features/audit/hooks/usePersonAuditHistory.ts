import { useQuery } from '@tanstack/react-query'
import { getPersonAuditHistory } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function usePersonAuditHistory(
  personId: string,
  filters: AuditFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: auditKeys.personHistoryFiltered(personId, filters),
    queryFn: () => getPersonAuditHistory(personId, filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(personId) && enabled,
  })
}
