'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CcmsDonutChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsDonutDataPoint } from '@/shared/components/charts/CcmsDonutChart'
import { CHART_COLORS } from '@/shared/constants/chartColors'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { CaseStatusDataPoint } from '../../types/dashboard.types'

const STATUS_COLOR_MAP: Record<string, string> = {
  OPEN: CHART_COLORS.primary,
  UNDER_INVESTIGATION: CHART_COLORS.warning,
  REFERRED_TO_COURT: CHART_COLORS.accent,
  CLOSED: CHART_COLORS.success,
  ARCHIVED: CHART_COLORS.muted,
}

interface CaseStatusChartWidgetProps {
  casesByStatus?: CaseStatusDataPoint[] | undefined
  isLoading: boolean
}

export function CaseStatusChartWidget({ casesByStatus = [], isLoading }: CaseStatusChartWidgetProps) {
  const t = useTranslations('dashboard')
  const tCases = useTranslations('cases')

  const { chartData, total } = useMemo(() => {
    const totalCount = casesByStatus.reduce((sum, item) => sum + item.count, 0)
    const points: CcmsDonutDataPoint[] = casesByStatus.map((item) => ({
      name: tCases(`status.${item.status}`),
      value: item.count,
      color: STATUS_COLOR_MAP[item.status] ?? CHART_COLORS.muted,
    }))
    return { chartData: points, total: totalCount }
  }, [casesByStatus, tCases])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('deptHead.caseStatusWidget.title')}</h3>
        <div className="flex h-[240px] items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('deptHead.caseStatusWidget.title')}
      </h3>

      <div className="flex justify-center">
        <CcmsDonutChart
          data={chartData}
          centreLabel={t('deptHead.caseStatusWidget.total')}
          centreValue={total}
          height={240}
          showLegend={true}
        />
      </div>
    </div>
  )
}
