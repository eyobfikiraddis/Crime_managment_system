import { getTranslations } from 'next-intl/server'
import { CaseReports } from '@features/reports/components/cases/CaseReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('cases.pageTitle')} | ${t('pageTitle')}` }
}

export default function CaseReportsPage() {
  return <CaseReports />
}
