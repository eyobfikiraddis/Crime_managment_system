import { getTranslations } from 'next-intl/server'
import { ArrestsTab } from '@features/arrests/components/ArrestsTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('arrests')
  return { title: t('pageTitle') }
}

export default function CaseArrestsPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <ArrestsTab caseId={params.caseId} />
}
