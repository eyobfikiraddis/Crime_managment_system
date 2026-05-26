import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default async function DashboardPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('dashboard')

  return (
    <div>
      <h1>{t('heading')}</h1>
    </div>
  )
}
