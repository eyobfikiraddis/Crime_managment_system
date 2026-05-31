'use client'

import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { InvestigatorPendingActions } from '../../types/dashboard.types'

interface PendingActionsWidgetProps {
  pendingActions?: InvestigatorPendingActions | undefined
  isLoading: boolean
}

export function PendingActionsWidget({ pendingActions, isLoading }: PendingActionsWidgetProps) {
  const t = useTranslations('dashboard')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('investigator.pendingActionsWidget.title')}</h3>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const { evidenceMissingCustodyCount = 0, casesWithoutRecentUpdateCount = 0 } = pendingActions ?? {}
  const hasActions = evidenceMissingCustodyCount > 0 || casesWithoutRecentUpdateCount > 0

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <h3 className="text-sm font-semibold text-foreground">
        {t('investigator.pendingActionsWidget.title')}
      </h3>

      {!hasActions ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <CheckCircle className="h-8 w-8 text-success" />
          <p className="text-xs text-foreground-muted">
            {t('investigator.pendingActionsWidget.allClear')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {evidenceMissingCustodyCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card-hover/20">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    {evidenceMissingCustodyCount}
                  </span>
                  <span className="text-[10px] text-foreground-muted">
                    {t('investigator.pendingActionsWidget.evidenceMissingCustody')}
                  </span>
                </div>
              </div>
              <Link
                href="/reports/evidence"
                className="text-[10px] font-medium text-primary flex items-center gap-1 hover:underline"
              >
                {t('investigator.pendingActionsWidget.viewEvidence')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {casesWithoutRecentUpdateCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card-hover/20">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    {casesWithoutRecentUpdateCount}
                  </span>
                  <span className="text-[10px] text-foreground-muted">
                    {t('investigator.pendingActionsWidget.casesWithoutUpdate')}
                  </span>
                </div>
              </div>
              <Link
                href="/cases"
                className="text-[10px] font-medium text-primary flex items-center gap-1 hover:underline"
              >
                {t('investigator.pendingActionsWidget.viewCases')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
