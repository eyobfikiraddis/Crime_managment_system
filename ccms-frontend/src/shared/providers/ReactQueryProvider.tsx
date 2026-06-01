'use client'

import { useState } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { createQueryClient } from '@/services/query/queryClient'
import { localStoragePersister } from '@services/query/persister'

interface ReactQueryProviderProps {
  children: React.ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours max cache age
        buster: process.env.NEXT_PUBLIC_BUILD_ID ?? '', // Cache-bust on new deployments
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </PersistQueryClientProvider>
  )
}
export default ReactQueryProvider
