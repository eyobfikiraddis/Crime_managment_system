'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { format, parseISO } from 'date-fns'
import { CcmsLineChart, type CcmsLineSeries } from '@/shared/components/charts/CcmsLineChart'
import { CHART_COLORS } from '@/shared/constants/chartColors'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import type { CaseVolumeTrendDataPoint } from '../../types/dashboard.types'

interface CaseVolumeTrendWidgetProps {
  caseVolumeTrend?: CaseVolumeTrendDataPoint[] | undefined
  isLoading: boolean
}

export function CaseVolumeTrendWidget({ caseVolumeTrend = [], isLoading }: CaseVolumeTrendWidgetProps) {
  const t = useTranslations('dashboard')

  const chartData = useMemo(() => {
    return caseVolumeTrend.map((item) => ({
      date: item.date,
      count: item.count,
    }))
  }, [caseVolumeTrend])

  const series = useMemo<CcmsLineSeries[]>(() => [
    {
      dataKey: 'count',
      label: t('admin.trendWidget.yAxisLabel'),
      color: CHART_COLORS.primary,
    },
  ], [t])

  const xAxisFormatter = (v: string) => {
    try {
      const d = parseISO(v)
      return isNaN(d.getTime()) ? v : format(d, 'MMM d')
    } catch {
      return v
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('admin.trendWidget.title')}</h3>
        <Skeleton className="h-[280px] w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('admin.trendWidget.title')}
      </h3>

      <div className="w-full">
        <CcmsLineChart
          data={chartData}
          series={series}
          xAxisKey="date"
          xAxisTickFormatter={xAxisFormatter}
          height={280}
        />
      </div>
    </div>
  )
}
