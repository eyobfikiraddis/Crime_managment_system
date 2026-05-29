'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'

import { useArrest } from '../hooks/useArrest'
import { useDeleteArrest } from '../hooks/useDeleteArrest'
import { BailStatus, DetentionStatus } from '../types/arrest.types'

interface ArrestDetailDrawerProps {
  caseId: string
  arrestId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (arrestId: string) => void
}

type BadgeVariant = 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'

const DETENTION_STATUS_VARIANTS: Record<DetentionStatus, BadgeVariant> = {
  IN_CUSTODY: 'warning',
  RELEASED_ON_BAIL: 'accent',
  RELEASED: 'success',
  TRANSFERRED: 'primary',
}

const BAIL_STATUS_VARIANTS: Record<BailStatus, BadgeVariant> = {
  NOT_SET: 'muted',
  DENIED: 'destructive',
  GRANTED: 'success',
  POSTED: 'accent',
}

function formatBailAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'am' ? 'am-ET' : 'en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function ArrestDetailDrawer({
  caseId,
  arrestId,
  open,
  onOpenChange,
  onUpdateStatus,
}: ArrestDetailDrawerProps) {
  const t = useTranslations('arrests')
  const locale = useLocale()
  const { data, isLoading } = useArrest(arrestId ?? '')
  const deleteArrestMutation = useDeleteArrest(caseId)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  if (!open) return null

  const bailAmountLabel =
    data?.bailAmount !== null && data?.bailAmount !== undefined
      ? t('detail.bailAmountValue', { amount: formatBailAmount(data.bailAmount, locale) })
      : t('detail.noBailAmount')

  const handleDelete = () => {
    if (!data) return
    deleteArrestMutation.mutate(data.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('detail.drawerTitle')}
      description={data?.arrestNumber ?? ''}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <PermissionGuard permission={Permission.ARRESTS_DELETE}>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {t('tab.rowActions.delete')}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={Permission.ARRESTS_MANAGE}>
            <Button
              type="button"
              onClick={() => {
                if (data) onUpdateStatus(data.id)
                onOpenChange(false)
              }}
            >
              {t('detail.updateStatusButton')}
            </Button>
          </PermissionGuard>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !data ? (
        <EmptyState title={t('tab.empty')} />
      ) : (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.drawerTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.arrestNumber')}</p>
                <p className="text-sm font-mono text-foreground">{data.arrestNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.arrestedPerson')}</p>
                <p className="text-sm text-foreground">{`${data.arrestedPerson.firstName} ${data.arrestedPerson.lastName}`}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.arrestingOfficer')}</p>
                <p className="text-sm text-foreground">{`${data.arrestingOfficer.firstName} ${data.arrestingOfficer.lastName} (${data.arrestingOfficer.badgeNumber})`}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.arrestDate')}</p>
                <p className="text-sm text-foreground">{format(new Date(data.arrestDate), 'dd MMM yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.location')}</p>
                <p className="text-sm text-foreground">{data.location}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">{t('detail.warrantNumber')}</p>
                <p className="text-sm text-foreground">{data.warrantNumber ?? t('detail.noWarrant')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.detentionStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase text-foreground-muted">{t('detail.detentionStatus')}</p>
                <StatusBadge
                  status={t(`detentionStatus.${data.detentionStatus}`)}
                  variant={DETENTION_STATUS_VARIANTS[data.detentionStatus] ?? 'muted'}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-foreground-muted">{t('detail.bailStatus')}</p>
                <StatusBadge
                  status={t(`bailStatus.${data.bailStatus}`)}
                  variant={BAIL_STATUS_VARIANTS[data.bailStatus] ?? 'muted'}
                />
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-foreground-muted">{t('detail.bailAmount')}</p>
                <p className="text-sm text-foreground">{bailAmountLabel}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.chargesAtArrest')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.chargesAtArrest.length === 0 ? (
                <p className="text-sm text-foreground-muted">{t('detail.noCharges')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.chargesAtArrest.map((charge) => (
                    <span
                      key={charge}
                      className="rounded-sm border border-border bg-[var(--color-card-hover)] px-2 py-0.5 text-xs text-foreground-muted"
                    >
                      {charge}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.courtAppearanceDate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {data.courtAppearanceDate
                  ? format(new Date(data.courtAppearanceDate), 'dd MMM yyyy')
                  : t('detail.noCourtDate')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('detail.notes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {data.notes ? data.notes : t('detail.noNotes')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isDeleteDialogOpen ? (
        <DestructiveConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t('delete.confirmTitle')}
          description={t('delete.confirmDescription', { arrestNumber: data?.arrestNumber ?? '' })}
          confirmLabel={t('tab.rowActions.delete')}
          cancelLabel={t('create.cancelButton')}
          confirmPhrase={t('delete.confirmPhrase', { arrestNumber: data?.arrestNumber ?? '' })}
          confirmPrompt={t('delete.confirmPhrase', { arrestNumber: data?.arrestNumber ?? '' })}
          onConfirm={handleDelete}
          isConfirming={deleteArrestMutation.isPending}
        />
      ) : null}
    </SlideOverDrawer>
  )
}
