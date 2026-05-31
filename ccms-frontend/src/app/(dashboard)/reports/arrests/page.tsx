import { getTranslations } from 'next-intl/server'
import { ArrestReports } from '@features/reports/components/arrests/ArrestReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('arrests.pageTitle')} | ${t('pageTitle')}` }
}

export default function ArrestReportsPage() {
  return <ArrestReports />
}
