import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalTab } from '@/features/legal/components/LegalTab'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return { title: t('pageTitle') }
}

export default function CaseLegalPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <LegalTab caseId={params.caseId} />
}
