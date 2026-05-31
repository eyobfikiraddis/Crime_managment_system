import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import PersonDetail from '@features/personnel/components/persons/PersonDetail'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('persons.pageTitle') }
}

type PageProps = {
  params: { personId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function PersonDetailPage({ params, searchParams }: PageProps) {
  void searchParams

  return (
    <div>
      {/* Client component renders the person detail UI */}
      <PersonDetail personId={params.personId} />
    </div>
  )
}
