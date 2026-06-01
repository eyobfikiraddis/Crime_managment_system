import { useQuery } from '@tanstack/react-query'
import { getOfficerAuditHistory } from '@services/domain/audit.service'
import { auditKeys } from '@services/query/keys/auditKeys'
import type { AuditFilters } from '../types/audit.types'

export function useOfficerAuditHistory(
  officerId: string,
  filters: AuditFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: auditKeys.officerHistoryFiltered(officerId, filters),
    queryFn: () => getOfficerAuditHistory(officerId, filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(officerId) && enabled,
  })
}
