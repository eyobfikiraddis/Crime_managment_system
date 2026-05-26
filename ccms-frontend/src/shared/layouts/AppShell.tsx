'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const tA11y = useTranslations('accessibility')

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
        >
          {tA11y('skipToMain')}
        </a>
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
