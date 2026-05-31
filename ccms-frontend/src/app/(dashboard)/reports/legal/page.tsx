import { getTranslations } from 'next-intl/server'
import { LegalReports } from '@features/reports/components/legal/LegalReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('legal.pageTitle')} | ${t('pageTitle')}` }
}

export default function LegalReportsPage() {
  return <LegalReports />
}
