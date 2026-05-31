import { getTranslations } from 'next-intl/server'
import { OfficerWorkloadReports } from '@features/reports/components/officers/OfficerWorkloadReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('officers.pageTitle')} | ${t('pageTitle')}` }
}

export default function OfficerReportsPage() {
  return <OfficerWorkloadReports />
}
