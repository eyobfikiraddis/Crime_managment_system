import { getTranslations } from 'next-intl/server'
import { EvidenceReports } from '@features/reports/components/evidence/EvidenceReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('evidence.pageTitle')} | ${t('pageTitle')}` }
}

export default function EvidenceReportsPage() {
  return <EvidenceReports />
}
