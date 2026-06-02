'use client'

import type { ReactNode } from 'react'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { SkipToMain } from '@shared/components/layout/SkipToMain'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <SkipToMain />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

