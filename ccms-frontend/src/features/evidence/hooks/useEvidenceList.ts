import { useQuery } from '@tanstack/react-query'
import { getCaseEvidence } from '@services/domain/evidence.service'
import { evidenceKeys } from '@services/query/keys/evidenceKeys'
import type { EvidenceFilters } from '../types/evidence.types'

export function useEvidenceList(caseId: string, filters: EvidenceFilters) {
  return useQuery({
    queryKey: evidenceKeys.caseEvidenceList(caseId, filters as Record<string, unknown>),
    queryFn: () => getCaseEvidence(caseId, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled: Boolean(caseId),
  })
}
