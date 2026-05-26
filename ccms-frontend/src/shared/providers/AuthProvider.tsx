'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/hooks/useSession'
import { useIdleTimeout } from '@/features/auth/hooks/useIdleTimeout'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading } = useSession()
  useIdleTimeout()

  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    setShowSkeleton(isLoading)
  }, [isLoading])

  return (
    <>
      {children}
      {showSkeleton ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      ) : null}
    </>
  )
}
