'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format, parseISO } from 'date-fns'
import { FileDown, ShieldAlert, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useArrestSummary } from '../../hooks/useArrestSummary'
import { useArrestMonthlyTrend } from '../../hooks/useArrestMonthlyTrend'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { CcmsBarChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsBarSeries } from '@/shared/components/charts/CcmsBarChart'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { Button } from '@/components/ui/button'
import { DatePreset } from '../../types/reports.types'
import { CHART_COLORS } from '@/shared/constants/chartColors'

export function ArrestReports() {
  const t = useTranslations('reports')
  const { addToast } = useNotificationStore()
  const [isExporting, setIsExporting] = useState(false)

  const [filters, setFilters] = useQueryStates({
    dateFrom: parseAsString.withDefault(format(subDays(new Date(), 29), 'yyyy-MM-dd')),
    dateTo:   parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd')),
    preset:   parseAsString.withDefault(DatePreset.LAST_30_DAYS),
    departmentId: parseAsString.withDefault(''),
  })

  const hookFilters = useMemo(() => ({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    departmentId: filters.departmentId || undefined,
  }), [filters.dateFrom, filters.dateTo, filters.departmentId])

  // Queries
  const { data: arrestSummary, isLoading: summaryLoading } = useArrestSummary(hookFilters)
  const { data: monthlyTrend, isLoading: trendLoading } = useArrestMonthlyTrend(hookFilters)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadReportCsv('arrests/summary', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Pre-process monthly trend data
  const barData = useMemo(() => {
    if (!monthlyTrend?.dataPoints) return []
    return monthlyTrend.dataPoints.map((dp) => ({
      month: dp.month,
      count: dp.count,
    }))
  }, [monthlyTrend])

  const barSeries = useMemo<CcmsBarSeries[]>(() => [
    {
      dataKey: 'count',
      label: t('arrests.monthlyTrend.yAxisLabel'),
      color: CHART_COLORS.orange,
    },
  ], [t])

  const monthAxisFormatter = (v: string) => {
    try {
      // API returns YYYY-MM
      const d = parseISO(`${v}-01`)
      return isNaN(d.getTime()) ? v : format(d, 'MMM yy')
    } catch {
      return v
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Header */}
      <div className="flex flex-col gap-4">
        <ReportsFilterBar
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          preset={filters.preset as DatePreset | null}
          departmentId={filters.departmentId}
          onChange={(updates) => setFilters(updates as any)}
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs font-semibold text-foreground-muted bg-card px-3 py-1.5 border border-border rounded-md self-start">
            {t('periodLabel', { dateFrom: filters.dateFrom, dateTo: filters.dateTo })}
          </span>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="self-start gap-2 h-9 text-xs"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? t('export.downloading') : t('export.button')}
          </Button>
        </div>
      </div>

      {/* Grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* KPI Summary Card */}
        <div className="flex flex-col">
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground">
                {t('arrests.summary.title')}
              </h3>
              <p className="text-xs text-foreground-muted">
                Key metrics and summary of arrests.
              </p>
            </div>
            
            <div className="flex-1 flex flex-col justify-center py-6">
              <KpiCard
                icon={ShieldAlert}
                label={t('arrests.summary.totalLabel')}
                value={arrestSummary?.totalInPeriod ?? null}
                changePercent={arrestSummary?.changePercent ?? null}
                isLoading={summaryLoading}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('arrests.monthlyTrend.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('arrests.monthlyTrend.description')}
            </p>
          </div>
          
          <div className="w-full">
            <CcmsBarChart
              data={barData}
              series={barSeries}
              xAxisKey="month"
              xAxisTickFormatter={monthAxisFormatter}
              height={280}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
