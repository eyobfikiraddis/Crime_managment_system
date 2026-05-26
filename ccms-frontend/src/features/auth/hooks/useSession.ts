import { useQuery } from '@tanstack/react-query'

import { getSession } from '@/services/domain/auth.service'
import { authKeys } from '@/services/query/keys/authKeys'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useSession() {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    onSuccess: (session) => {
      if (session) {
        setSession(session.officer, session.officer.permissions ?? [], session.sessionId)
        return
      }
      clearSession()
    },
    onError: () => clearSession(),
    refetchOnWindowFocus: true,
  })
}
