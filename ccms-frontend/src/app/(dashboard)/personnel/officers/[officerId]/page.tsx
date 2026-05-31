import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import OfficerDetail from '@features/personnel/components/officers/OfficerDetail'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('personnel')
  return { title: t('officers.pageTitle') }
}

type PageProps = {
  params: { officerId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function OfficerDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('personnel')

  return (
    <div>
      <OfficerDetail officerId={params.officerId} />
    </div>
  )
}
