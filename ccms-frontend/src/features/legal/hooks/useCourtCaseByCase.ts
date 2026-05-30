import { useQuery } from '@tanstack/react-query'
import { getCourtCaseByCase } from '@services/domain/legal.service'
import { legalKeys } from '@services/query/keys/legalKeys'
import { ApiError } from '@services/api/errors'

export function useCourtCaseByCase(caseId: string) {
  return useQuery({
    queryKey: legalKeys.courtCaseByCase(caseId),
    queryFn: () => getCourtCaseByCase(caseId),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(caseId),
    retry: (failureCount, error: unknown) => {
      const is404 =
        error instanceof ApiError
          ? error.statusCode === 404
          : typeof error === 'object' &&
            error !== null &&
            (('status' in error && (error as { status: number }).status === 404) ||
              ('statusCode' in error &&
                (error as { statusCode: number }).statusCode === 404))
      if (is404) return false
      return failureCount < 3
    },
  })
}
