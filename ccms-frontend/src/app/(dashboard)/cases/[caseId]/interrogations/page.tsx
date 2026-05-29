import { getTranslations } from 'next-intl/server'
import { InterrogationsTab } from '@features/interrogations/components/InterrogationsTab'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('interrogations')
  return { title: t('pageTitle') }
}

export default function CaseInterrogationsPage({
  params,
}: {
  params: { caseId: string }
}) {
  return <InterrogationsTab caseId={params.caseId} />
}
