'use client'

import { format } from 'date-fns'
import { Download, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'
import { CustodyChainTimeline } from './CustodyChainTimeline'
import type { Evidence, EvidenceType, CustodyEventType } from '../types/evidence.types'

const EVIDENCE_TYPE_VARIANTS: Record<EvidenceType, 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'> = {
  CRIME_SCENE_PHOTO: 'accent',
  DIGITAL: 'primary',
  PHYSICAL: 'muted',
  DOCUMENT: 'muted',
  BIOLOGICAL: 'warning',
  FORENSIC_REPORT: 'success',
  WEAPON: 'destructive',
  VEHICLE: 'warning',
  WITNESS_STATEMENT: 'primary',
  AUDIO: 'accent',
  VIDEO: 'accent',
  OTHER: 'muted',
}

const CUSTODY_STATUS_VARIANTS: Record<CustodyEventType, 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'> = {
  COLLECTED: 'muted',
  TRANSFERRED: 'warning',
  EXAMINED: 'primary',
  STORED: 'muted',
  PRESENTED_IN_COURT: 'accent',
  RETURNED: 'success',
  DESTROYED: 'destructive',
}

interface EvidenceDetailSectionsProps {
  evidence: Evidence
  onViewImage?: (() => void) | undefined
}

export function EvidenceDetailSections({ evidence, onViewImage }: EvidenceDetailSectionsProps) {
  const t = useTranslations('evidence')
  const role = useAuthStore((state) => state.role)
  const canViewForensic = role === 'FORENSIC' || role === 'ADMIN' || role === 'SUPERADMIN'

  const isPhoto = evidence.evidenceType === 'CRIME_SCENE_PHOTO'
  const typeVariant = EVIDENCE_TYPE_VARIANTS[evidence.evidenceType] ?? 'muted'
  const custodyVariant = CUSTODY_STATUS_VARIANTS[evidence.custodyStatus] ?? 'muted'

  const handleDownload = () => {
    if (!evidence.mediaUrl) return
    const anchor = document.createElement('a')
    anchor.href = evidence.mediaUrl
    anchor.download = `${evidence.evidenceNumber ?? 'evidence'}`
    anchor.click()
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('detail.drawerTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.evidenceNumber')}</p>
            <div className="text-sm font-mono text-foreground">{evidence.evidenceNumber}</div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.type')}</p>
            <StatusBadge status={t(`types.${evidence.evidenceType}`)} variant={typeVariant} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.description')}</p>
            <div className="text-sm text-foreground">{evidence.description}</div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.collectedBy')}</p>
            <div className="text-sm text-foreground">
              {`${evidence.collectedBy.firstName} ${evidence.collectedBy.lastName} (${evidence.collectedBy.badgeNumber})`}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.collectedAt')}</p>
            <div className="text-sm text-foreground">
              {format(new Date(evidence.collectedAt), 'dd MMM yyyy HH:mm')}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.storageLocation')}</p>
            <div className="text-sm text-foreground">{evidence.storageLocation || '—'}</div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-foreground-muted">{t('tab.columns.custodyStatus')}</p>
            <StatusBadge status={t(`custodyStatus.${evidence.custodyStatus}`)} variant={custodyVariant} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase text-foreground-muted">{t('detail.notes')}</p>
            <div className="text-sm text-foreground">{evidence.notes ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('detail.mediaSection')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!evidence.mediaUrl ? (
            <p className="text-sm text-foreground-muted">{t('detail.noMedia')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {isPhoto ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <img
                    src={evidence.thumbnailUrl ?? evidence.mediaUrl}
                    alt={evidence.description}
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-md border border-border p-3">
                  <FileText className="size-5 text-foreground-muted" />
                  <span className="text-sm text-foreground-muted">{evidence.mediaUrl}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isPhoto && onViewImage ? (
                  <Button type="button" variant="outline" onClick={onViewImage}>
                    {t('detail.viewFullImage')}
                  </Button>
                ) : null}
                <PermissionGuard permission={Permission.EVIDENCE_MANAGE}>
                  <Button type="button" variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 size-4" />
                    {t('detail.downloadFile')}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('custody.sectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustodyChainTimeline custodyChain={evidence.custodyChain} />
        </CardContent>
      </Card>

      {canViewForensic ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('detail.forensicSection')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!evidence.forensicReport ? (
              <p className="text-sm text-foreground-muted">{t('detail.noForensicReport')}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicReportNumber')}</p>
                  <div className="text-sm text-foreground">{evidence.forensicReport.reportNumber}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicLab')}</p>
                  <div className="text-sm text-foreground">{evidence.forensicReport.labName}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicSubmittedBy')}</p>
                  <div className="text-sm text-foreground">
                    {`${evidence.forensicReport.submittedBy.firstName} ${evidence.forensicReport.submittedBy.lastName}`}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicSubmittedAt')}</p>
                  <div className="text-sm text-foreground">
                    {format(new Date(evidence.forensicReport.submittedAt), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicFindings')}</p>
                  <div className="text-sm text-foreground">{evidence.forensicReport.findings}</div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs uppercase text-foreground-muted">{t('detail.forensicConclusion')}</p>
                  <div className="text-sm text-foreground">{evidence.forensicReport.conclusion}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {evidence.vehicleDetails ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('detail.vehicleSection')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Make</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.make}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Model</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.model}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Year</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.year ?? '—'}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Plate</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.licensePlate}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Color</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.color}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">VIN</p>
              <div className="text-sm text-foreground">{evidence.vehicleDetails.vin ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {evidence.weaponDetails ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('detail.weaponSection')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Type</p>
              <div className="text-sm text-foreground">{evidence.weaponDetails.weaponType}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Make</p>
              <div className="text-sm text-foreground">{evidence.weaponDetails.make}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Model</p>
              <div className="text-sm text-foreground">{evidence.weaponDetails.model}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Serial</p>
              <div className="text-sm text-foreground">{evidence.weaponDetails.serialNumber ?? '—'}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">Caliber</p>
              <div className="text-sm text-foreground">{evidence.weaponDetails.caliber ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
