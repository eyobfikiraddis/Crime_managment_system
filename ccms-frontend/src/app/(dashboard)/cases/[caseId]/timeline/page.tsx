import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CaseTimelineTab } from '@/features/cases/components/CaseTimelineTab'
import { Skeleton } from '@/shared/components/feedback/Skeleton'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('timeline.pageTitle') }
}

type PageProps = {
  params: Promise<{ caseId: string }> | { caseId: string }
}

export default async function CaseTimelinePage({ params }: PageProps) {
  const resolvedParams = await params
  const { caseId } = resolvedParams

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CaseTimelineTab caseId={caseId} />
    </Suspense>
  )
}
