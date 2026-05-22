'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/shared/stores/auth.store'
import { getSession } from '@/services/domain/auth.service'

export function useSession() {
  const [isLoading, setLoading] = useState(true)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    let mounted = true

    getSession()
      .then((s) => {
        if (!mounted) return
        if (s && s.officer) {
          setSession(s.officer as any, [] as any, s.sessionId)
        }
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [setSession, clearSession])

  return { isLoading }
}
