'use client'

import { useTranslations } from 'next-intl'
import { useLegalDashboard } from '../../hooks/useLegalDashboard'
import { LegalKpiStrip } from './LegalKpiStrip'
import { UpcomingHearingsWidget } from './UpcomingHearingsWidget'
import { RecentChargesWidget } from './RecentChargesWidget'
import { ErrorState } from '@/shared/components/feedback/ErrorState'

export function LegalDashboard() {
  const t = useTranslations('dashboard')
  const { data, isLoading, isError, refetch } = useLegalDashboard()

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          title={t('fallback.title')}
          description={t('widgetError', { retryLink: '' })}
          retry={refetch}
          retryLabel={t('retryLink')}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-foreground-muted">
          Legal Office
        </p>
      </div>

      {/* KPI Cards Strip */}
      <LegalKpiStrip kpis={data?.kpis} isLoading={isLoading} />

      {/* Grid for Hearings and Charges (3/5 + 2/5 layout on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <UpcomingHearingsWidget hearings={data?.upcomingHearings} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <RecentChargesWidget charges={data?.recentCharges} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
