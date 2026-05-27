'use client'

import type { ReactNode } from 'react'
import { CaseHeaderCard } from './CaseHeaderCard'
import { CaseTabNav } from './CaseTabNav'

interface CaseDetailLayoutProps {
  caseId: string
  children: ReactNode
}

export function CaseDetailLayout({ caseId, children }: CaseDetailLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Case Header Card */}
      <CaseHeaderCard caseId={caseId} />

      {/* Tabs Sticky Navigation */}
      <CaseTabNav caseId={caseId} />

      {/* Child Pages Container */}
      <div className="px-6 pb-8">{children}</div>
    </div>
  )
}
