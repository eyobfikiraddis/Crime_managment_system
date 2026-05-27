import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { Info } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Promise<{ caseId: string }> | { caseId: string }
}

export default async function CaseEvidencePage({ params }: PageProps) {
  void params
  const t = await getTranslations('cases')

  return (
    <div className="py-6">
      <EmptyState
        title={t('skeletonTabs.evidence')}
        description="This module is scheduled for development in Phase 5."
        icon={Info}
      />
    </div>
  )
}
