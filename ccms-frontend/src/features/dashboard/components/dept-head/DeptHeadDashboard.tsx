'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useDeptHeadDashboard } from '../../hooks/useDeptHeadDashboard'
import { DepartmentKpiStrip } from './DepartmentKpiStrip'
import { CaseStatusChartWidget } from './CaseStatusChartWidget'
import { WorkloadByOfficerWidget } from './WorkloadByOfficerWidget'
import { DepartmentActivityWidget } from './DepartmentActivityWidget'
import { ReportsQuickLinksWidget } from './ReportsQuickLinksWidget'
import { ErrorState } from '@/shared/components/feedback/ErrorState'

export function DeptHeadDashboard() {
  const t = useTranslations('dashboard')
  const { officer } = useAuthStore()
  const { data, isLoading, isError, refetch } = useDeptHeadDashboard()

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

  const deptName = officer?.departmentId
    ? `Department ${officer.departmentId}`
    : 'Department Dashboard'

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-foreground-muted">
          {deptName}
        </p>
      </div>

      {/* KPI Cards Section */}
      <DepartmentKpiStrip kpis={data?.kpis} isLoading={isLoading} />

      {/* Top Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CaseStatusChartWidget casesByStatus={data?.casesByStatus} isLoading={isLoading} />
        <WorkloadByOfficerWidget workloadByOfficer={data?.workloadByOfficer} isLoading={isLoading} />
      </div>

      {/* Bottom Activities & Shortcuts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentActivityWidget activity={data?.recentActivity} isLoading={isLoading} />
        </div>
        <div>
          <ReportsQuickLinksWidget />
        </div>
      </div>
    </div>
  )
}
