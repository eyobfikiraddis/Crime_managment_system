'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CcmsBarChart, type CcmsBarSeries } from '@/shared/components/charts/CcmsBarChart'
import { CHART_COLORS } from '@/shared/constants/chartColors'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { OfficerWorkloadDataPoint } from '../../types/dashboard.types'

interface WorkloadByOfficerWidgetProps {
  workloadByOfficer?: OfficerWorkloadDataPoint[] | undefined
  isLoading: boolean
}

export function WorkloadByOfficerWidget({ workloadByOfficer = [], isLoading }: WorkloadByOfficerWidgetProps) {
  const t = useTranslations('dashboard')

  const chartData = useMemo(() => {
    return workloadByOfficer.map((item) => ({
      fullName: item.fullName,
      activeCaseCount: item.activeCaseCount,
    }))
  }, [workloadByOfficer])

  const series = useMemo<CcmsBarSeries[]>(() => [
    {
      dataKey: 'activeCaseCount',
      label: t('deptHead.workloadWidget.activeCasesLabel'),
      color: CHART_COLORS.primary,
    },
  ], [t])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('deptHead.workloadWidget.title')}</h3>
        <Skeleton className="h-[280px] w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-foreground">
          {t('deptHead.workloadWidget.title')}
        </h3>
        <p className="text-xs text-foreground-muted">
          {t('deptHead.workloadWidget.subtitle')}
        </p>
      </div>

      <div className="w-full">
        <CcmsBarChart
          data={chartData}
          series={series}
          xAxisKey="fullName"
          layout="vertical"
          height={280}
        />
      </div>
    </div>
  )
}
