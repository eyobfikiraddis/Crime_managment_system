import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CourtCasesList } from '@/features/legal/components/CourtCasesList'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return { title: t('courtCasesList.pageTitle') }
}

export default function CourtCasesPage() {
  return <CourtCasesList />
}
