'use client'

import { useTranslations } from 'next-intl'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'
import { SystemKpiStrip } from './SystemKpiStrip'
import { CaseVolumeTrendWidget } from './CaseVolumeTrendWidget'
import { SecurityEventsWidget } from './SecurityEventsWidget'
import { DepartmentOverviewWidget } from './DepartmentOverviewWidget'
import { PendingAdminTasksWidget } from './PendingAdminTasksWidget'
import { ErrorState } from '@/shared/components/feedback/ErrorState'

export function AdminDashboard() {
  const t = useTranslations('dashboard')
  const { data, isLoading, isError, refetch } = useAdminDashboard()

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
          System Overview
        </p>
      </div>

      {/* KPI Cards Strip */}
      <SystemKpiStrip kpis={data?.kpis} isLoading={isLoading} />

      {/* Full Width Line Chart */}
      <CaseVolumeTrendWidget caseVolumeTrend={data?.caseVolumeTrend} isLoading={isLoading} />

      {/* Grid for Security & Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SecurityEventsWidget securityEvents={data?.securityEvents} isLoading={isLoading} />
        <DepartmentOverviewWidget departments={data?.departmentOverview} isLoading={isLoading} />
      </div>

      {/* Full Width Checklists */}
      <PendingAdminTasksWidget pendingTasks={data?.pendingTasks} isLoading={isLoading} />
    </div>
  )
}
