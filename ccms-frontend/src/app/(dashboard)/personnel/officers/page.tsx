import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import OfficersList from '@features/personnel/components/officers/OfficersList'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('officers.pageTitle') }
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default async function OfficersPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <OfficersList />
    </div>
  )
}
