'use client'

import { format } from 'date-fns'
import { Lock, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { getCharge } from '@/services/domain/legal.service'
import { legalKeys } from '@/services/query/keys/legalKeys'

import { CHARGE_STATUS_VARIANTS, formatDurationMonths, formatFineAmount } from '../utils/chargeUtils'
import { ChargeStatus, type ChargeListItem } from '../types/legal.types'

interface ViewSentenceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chargeId: string
  charge: ChargeListItem
}

export function ViewSentenceDrawer({
  open,
  onOpenChange,
  chargeId,
  charge,
}: ViewSentenceDrawerProps) {
  const t = useTranslations('legal')
  const tErrors = useTranslations('errors')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: legalKeys.chargeDetail(chargeId),
    queryFn: () => getCharge(chargeId),
    enabled: Boolean(chargeId) && open,
    staleTime: 2 * 60 * 1000,
  })

  if (!open) return null

  const sentence = data?.sentence ?? null

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('charges.viewSentence.drawerTitle')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('charges.viewSentence.closeButton')}
          </Button>
        </div>
      }
    >
      {isError ? (
        <ErrorState
          title={tErrors('pages.global.title')}
          description={tErrors('api.generic')}
          retry={() => void refetch()}
          retryLabel={tErrors('pages.global.action')}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                    <Lock className="size-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('charges.viewSentence.immutableNotice')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2 rounded-sm border border-border bg-[var(--color-card-hover)] px-3 py-2 text-xs text-foreground-muted">
            <Lock className="size-4" />
            <span>{t('charges.viewSentence.immutableNotice')}</span>
          </div>

          {charge.status === ChargeStatus.CONVICTED && !sentence ? (
            <div className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 p-3 text-xs text-warning">
              <AlertTriangle className="mt-0.5 size-4" />
              <span>{t('charges.viewSentence.pendingNotice')}</span>
            </div>
          ) : null}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('charges.viewSentence.contextTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.columns.suspect')}
                </p>
                <p className="text-sm text-foreground">
                  {charge.suspect.firstName} {charge.suspect.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.columns.crimeType')}
                </p>
                <p className="text-sm text-foreground">{charge.crimeType.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.columns.status')}
                </p>
                <StatusBadge
                  status={t(`charges.status.${charge.status}`)}
                  variant={CHARGE_STATUS_VARIANTS[charge.status] ?? 'muted'}
                  className="w-[120px] text-center"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('charges.viewSentence.detailsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.viewSentence.sentenceType')}
                </p>
                <p className="text-sm text-foreground">
                  {sentence
                    ? t(`charges.sentenceType.${sentence.sentenceType}`)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.viewSentence.duration')}
                </p>
                <p className="text-sm text-foreground">
                  {sentence?.durationMonths !== null && sentence?.durationMonths !== undefined
                    ? formatDurationMonths(sentence.durationMonths)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.viewSentence.fineAmount')}
                </p>
                <p className="text-sm text-foreground">
                  {sentence?.fineAmountETB !== null && sentence?.fineAmountETB !== undefined
                    ? formatFineAmount(sentence.fineAmountETB)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.viewSentence.issuedAt')}
                </p>
                <p className="text-sm text-foreground">
                  {sentence?.issuedAt ? format(new Date(sentence.issuedAt), 'dd MMM yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-foreground-muted">
                  {t('charges.viewSentence.issuedByJudge')}
                </p>
                <p className="text-sm text-foreground">
                  {sentence?.issuedByJudge || t('charges.viewSentence.noJudge')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('charges.viewSentence.notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {sentence?.notes || t('charges.viewSentence.noNotes')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </SlideOverDrawer>
  )
}
