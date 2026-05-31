'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useInvestigatorDashboard } from '../../hooks/useInvestigatorDashboard'
import { MyCasesKpiStrip } from './MyCasesKpiStrip'
import { AssignedCasesWidget } from './AssignedCasesWidget'
import { RecentEvidenceWidget } from './RecentEvidenceWidget'
import { PendingActionsWidget } from './PendingActionsWidget'
import { ErrorState } from '@/shared/components/feedback/ErrorState'

export function InvestigatorDashboard() {
  const t = useTranslations('dashboard')
  const { officer } = useAuthStore()
  const { data, isLoading, isError, refetch } = useInvestigatorDashboard()

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

  const welcomeText = officer?.firstName 
    ? `${t('investigator.welcome')}, ${officer.firstName}`
    : t('investigator.welcome')

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-foreground-muted">
          {welcomeText}
        </p>
      </div>

      {/* KPI Cards Section */}
      <MyCasesKpiStrip kpis={data?.kpis} isLoading={isLoading} />

      {/* Widgets Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases and Evidence Widget Area (2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AssignedCasesWidget cases={data?.recentCases} isLoading={isLoading} />
          <RecentEvidenceWidget evidence={data?.recentEvidence} isLoading={isLoading} />
        </div>

        {/* Pending Actions Area (1/3 width on large screens) */}
        <div className="flex flex-col">
          <PendingActionsWidget pendingActions={data?.pendingActions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
