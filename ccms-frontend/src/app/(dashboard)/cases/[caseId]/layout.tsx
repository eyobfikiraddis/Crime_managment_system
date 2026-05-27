import type { ReactNode } from 'react'
import { CaseDetailLayout } from '@features/cases/components/CaseDetailLayout'
import { CaseAccessGuard } from '@shared/components/permission/CaseAccessGuard'

interface CaseLayoutProps {
  children: ReactNode
  params: Promise<{ caseId: string }> | { caseId: string }
}

export default async function Layout({ children, params }: CaseLayoutProps) {
  const resolvedParams = await params
  const { caseId } = resolvedParams

  return (
    <CaseAccessGuard caseId={caseId} requiredLevel="read">
      <CaseDetailLayout caseId={caseId}>
        {children}
      </CaseDetailLayout>
    </CaseAccessGuard>
  )
}
