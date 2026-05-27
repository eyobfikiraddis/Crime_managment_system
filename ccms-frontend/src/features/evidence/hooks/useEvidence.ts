import { useQuery } from '@tanstack/react-query'
import { getEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'

export function useEvidence(evidenceId: string) {
  return useQuery({
    queryKey: evidenceKeys.detail(evidenceId),
    queryFn: () => getEvidence(evidenceId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(evidenceId),
  })
}
