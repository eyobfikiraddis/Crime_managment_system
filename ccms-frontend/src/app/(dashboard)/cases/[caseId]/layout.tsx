import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { CaseTabs } from '@/shared/layouts/CaseTabs'

interface CaseLayoutProps {
  children: ReactNode
  params: { caseId: string }
}

export default function CaseDetailLayout({ children, params }: CaseLayoutProps) {
  return (
    <div className="space-y-4">
      <Card className="border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs uppercase text-foreground-muted">Case</p>
          <h1 className="text-lg font-semibold">Case {params.caseId}</h1>
          <p className="text-sm text-foreground-muted">Case header [Skeleton]</p>
        </div>
      </Card>
      <CaseTabs caseId={params.caseId} />
      <div>{children}</div>
    </div>
  )
}
