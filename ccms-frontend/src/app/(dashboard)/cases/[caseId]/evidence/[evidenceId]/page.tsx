import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EvidenceDetailPage } from '@/features/evidence/components/EvidenceDetailPage'

type PageProps = {
  params: Promise<{ caseId: string; evidenceId: string }> | { caseId: string; evidenceId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations('evidence')
  const resolvedParams = await params
  return { title: `${t('detail.drawerTitle')} - ${resolvedParams.evidenceId}` }
}

export default async function EvidenceDetailRoute({ params }: PageProps) {
  const resolvedParams = await params
  const { caseId, evidenceId } = resolvedParams

  return (
    <EvidenceDetailPage caseId={caseId} evidenceId={evidenceId} />
  )
}

