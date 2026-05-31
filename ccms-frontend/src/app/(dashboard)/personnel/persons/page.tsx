import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PersonsList } from '@features/personnel/components/persons/PersonsList'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('persons.pageTitle') }
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default async function PersonsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <PersonsList />
    </div>
  )
}
