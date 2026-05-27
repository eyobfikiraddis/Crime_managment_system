import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EvidenceTab } from '@/features/evidence/components/EvidenceTab'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('evidence')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: Promise<{ caseId: string }> | { caseId: string }
}

export default async function CaseEvidencePage({ params }: PageProps) {
  const resolvedParams = await params
  const { caseId } = resolvedParams

  return <EvidenceTab caseId={caseId} />
}

