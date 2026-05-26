import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default async function OfficersPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('personnel')

  return (
    <div>
      <h1>{t('officers.listHeading')}</h1>
    </div>
  )
}
