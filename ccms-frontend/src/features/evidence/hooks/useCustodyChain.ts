import { useQuery } from '@tanstack/react-query'
import { getCustodyChain } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'

export function useCustodyChain(evidenceId: string) {
  return useQuery({
    queryKey: evidenceKeys.custodyChain(evidenceId),
    queryFn: () => getCustodyChain(evidenceId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(evidenceId),
  })
}
