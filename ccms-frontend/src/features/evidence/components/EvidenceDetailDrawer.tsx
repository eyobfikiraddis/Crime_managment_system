'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'
import { EvidenceDetailSections } from './EvidenceDetailSections'
import { useEvidence } from '../hooks/useEvidence'
import { EvidenceType } from '../types/evidence.types'

interface EvidenceDetailDrawerProps {
  evidenceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordCustody: (evidenceId: string) => void
  onViewImage?: (evidenceId: string) => void
}

export function EvidenceDetailDrawer({
  evidenceId,
  open,
  onOpenChange,
  onRecordCustody,
  onViewImage,
}: EvidenceDetailDrawerProps) {
  const t = useTranslations('evidence')
  const { data, isLoading } = useEvidence(evidenceId ?? '')

  if (!open) return null

  const isPhoto = data?.evidenceType === EvidenceType.CRIME_SCENE_PHOTO

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('detail.drawerTitle')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <PermissionGuard permission={Permission.EVIDENCE_MANAGE}>
            <Button
              type="button"
              onClick={() => {
                if (evidenceId) onRecordCustody(evidenceId)
                onOpenChange(false)
              }}
            >
              {t('detail.recordCustodyButton')}
            </Button>
          </PermissionGuard>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('upload.cancelButton')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !data ? (
        <EmptyState title={t('tab.empty')} />
      ) : (
        <EvidenceDetailSections
          evidence={data}
          onViewImage={isPhoto && onViewImage ? () => onViewImage(data.id) : undefined}
        />
      )}
    </SlideOverDrawer>
  )
}
