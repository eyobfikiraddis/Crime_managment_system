import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { CaseOverviewTab } from '@features/cases/components/CaseOverviewTab'
import { Skeleton } from '@shared/components/feedback/Skeleton'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Promise<{ caseId: string }> | { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function CaseOverviewPage({ params, searchParams }: PageProps) {
  void searchParams
  const resolvedParams = await params
  const { caseId } = resolvedParams

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CaseOverviewTab caseId={caseId} />
    </Suspense>
  )
}
