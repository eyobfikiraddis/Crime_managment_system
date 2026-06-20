'use client'

import type { ReactNode } from 'react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AuthProvider } from './AuthProvider'
import { ReactQueryProvider } from './ReactQueryProvider'
import { ThemeProvider } from './ThemeProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ReactQueryProvider>
        <AuthProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </AuthProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  )
}
