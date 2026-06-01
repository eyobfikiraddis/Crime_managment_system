'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format, parseISO } from 'date-fns'
import { FileDown, Folder, Percent, Clock, Calendar } from 'lucide-react'
import { useCaseStatusSummary } from '../../hooks/useCaseStatusSummary'
import { useCaseVolumeTrend } from '../../hooks/useCaseVolumeTrend'
import { useCaseResolutionReport } from '../../hooks/useCaseResolutionReport'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { CcmsDonutChart, CcmsLineChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsDonutDataPoint } from '@/shared/components/charts/CcmsDonutChart'
import type { CcmsLineSeries } from '@/shared/components/charts/CcmsLineChart'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { Button } from '@/components/ui/button'
import { CHART_COLORS } from '@/shared/constants/chartColors'
import { DatePreset } from '../../types/reports.types'
import { formatPercent } from '../../utils/reportUtils'

const STATUS_COLOR_MAP: Record<string, string> = {
  OPEN: CHART_COLORS.primary,
  UNDER_INVESTIGATION: CHART_COLORS.warning,
  REFERRED_TO_COURT: CHART_COLORS.accent,
  CLOSED: CHART_COLORS.success,
  ARCHIVED: CHART_COLORS.muted,
}

export function CaseReports() {
  const t = useTranslations('reports')
  const tCases = useTranslations('cases')
  const { addToast } = useNotificationStore()
  const [isExporting, setIsExporting] = useState(false)

  // Manage filter state reactively via URL params
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
  const { data: statusSummary, isLoading: statusLoading } = useCaseStatusSummary(hookFilters)
  const { data: volumeTrend, isLoading: volumeLoading } = useCaseVolumeTrend(hookFilters)
  const { data: resolutionReport, isLoading: resolutionLoading } = useCaseResolutionReport(hookFilters)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadReportCsv('cases/status-summary', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Pre-process donut data
  const donutData = useMemo<CcmsDonutDataPoint[]>(() => {
    if (!statusSummary?.byStatus) return []
    return statusSummary.byStatus.map((item) => ({
      name: tCases(`status.${item.status}`),
      value: item.count,
      color: STATUS_COLOR_MAP[item.status] ?? CHART_COLORS.muted,
    }))
  }, [statusSummary, tCases])

  // Pre-process line data
  const lineData = useMemo(() => {
    if (!volumeTrend?.dataPoints) return []
    return volumeTrend.dataPoints.map((dp) => ({
      date: dp.date,
      count: dp.count,
    }))
  }, [volumeTrend])

  const lineSeries = useMemo<CcmsLineSeries[]>(() => [
    {
      dataKey: 'count',
      label: t('cases.volumeTrend.yAxisLabel'),
      color: CHART_COLORS.primary,
    },
  ], [t])

  const dateAxisFormatter = (v: string) => {
    try {
      const d = parseISO(v)
      return isNaN(d.getTime()) ? v : format(d, 'MMM d')
    } catch {
      return v
    }
  }

  const periodText = t('periodLabel', {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  })

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header filter controls */}
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
            {periodText}
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

      {/* Top visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Status Distribution */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('cases.statusSummary.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('cases.statusSummary.description')}
            </p>
          </div>
          <div className="flex justify-center flex-1 items-center">
            <CcmsDonutChart
              data={donutData}
              centreLabel={t('cases.statusSummary.totalLabel')}
              centreValue={statusSummary?.total ?? 0}
              isLoading={statusLoading}
            />
          </div>
        </div>

        {/* Resolution KPI List */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground">
                {t('cases.resolution.title')}
              </h3>
              <p className="text-xs text-foreground-muted">
                {t('cases.resolution.description')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KpiCard
                icon={Folder}
                label={t('cases.resolution.totalClosed')}
                value={resolutionReport?.totalClosed ?? null}
                isLoading={resolutionLoading}
              />
              <KpiCard
                icon={Percent}
                label={t('cases.resolution.resolutionRate')}
                value={resolutionReport?.resolutionRatePercent ?? null}
                valueFormatter={(v) => formatPercent(v as number)}
                isLoading={resolutionLoading}
              />
              <KpiCard
                icon={Clock}
                label={t('cases.resolution.avgAge')}
                value={resolutionReport?.averageAgeDays ?? null}
                valueFormatter={(v) => `${Number(v).toFixed(0)} ${t('cases.resolution.ageSuffix')}`}
                isLoading={resolutionLoading}
              />
              <KpiCard
                icon={Calendar}
                label={t('cases.resolution.medianAge')}
                value={resolutionReport?.medianAgeDays ?? null}
                valueFormatter={(v) => `${Number(v).toFixed(0)} ${t('cases.resolution.ageSuffix')}`}
                isLoading={resolutionLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Case Volume Trend */}
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">
            {t('cases.volumeTrend.title')}
          </h3>
          <p className="text-xs text-foreground-muted">
            {t('cases.volumeTrend.description')}
          </p>
        </div>
        <CcmsLineChart
          data={lineData}
          series={lineSeries}
          xAxisKey="date"
          xAxisTickFormatter={dateAxisFormatter}
          isLoading={volumeLoading}
        />
      </div>
    </div>
  )
}
