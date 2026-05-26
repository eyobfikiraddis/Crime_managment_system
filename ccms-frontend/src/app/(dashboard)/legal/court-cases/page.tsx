import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default async function CourtCasesPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('legal')

  return (
    <div>
      <h1>{t('courtCases.heading')}</h1>
    </div>
  )
}
