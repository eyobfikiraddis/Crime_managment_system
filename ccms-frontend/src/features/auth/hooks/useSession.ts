import { useQuery } from '@tanstack/react-query'

import { getSession } from '@/services/domain/auth.service'
import { authKeys } from '@/services/query/keys/authKeys'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useSession() {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const session = await getSession()
      if (session) {
        setSession(session.officer, session.officer.permissions ?? [], session.sessionId)
      } else {
        clearSession()
      }
      return session
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  })
}
