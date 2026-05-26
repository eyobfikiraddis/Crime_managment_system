import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: { caseId: string; evidenceId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function EvidenceDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('cases')

  return (
    <div>
      <h1>{t('sections.evidenceDetail.heading')}</h1>
    </div>
  )
}
