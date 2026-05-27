'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/shared/components/display/PageHeader'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { useEvidence } from '../hooks/useEvidence'
import { EvidenceDetailSections } from './EvidenceDetailSections'
import { EvidenceLightbox } from './EvidenceLightbox'

interface EvidenceDetailPageProps {
  caseId: string
  evidenceId: string
}

export function EvidenceDetailPage({ caseId, evidenceId }: EvidenceDetailPageProps) {
  const t = useTranslations('evidence')
  const { data, isLoading } = useEvidence(evidenceId)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 animate-pulse bg-muted" />
        <Skeleton className="h-64 w-full animate-pulse bg-muted" />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title={t('tab.empty')}
        description={t('tab.emptyDescription')}
      />
    )
  }

  const isPhoto = data.evidenceType === 'CRIME_SCENE_PHOTO'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('detail.drawerTitle')}: ${data.evidenceNumber}`}
        description={data.description}
        breadcrumb={
          <Link
            href={`/cases/${caseId}/evidence`}
            className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>{t('pageTitle')}</span>
          </Link>
        }
      />

      <div className="max-w-4xl">
        <EvidenceDetailSections
          evidence={data}
          onViewImage={isPhoto ? () => setLightboxOpen(true) : undefined}
        />
      </div>

      {isPhoto && lightboxOpen && (
        <EvidenceLightbox
          photos={[data]}
          initialIndex={0}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
