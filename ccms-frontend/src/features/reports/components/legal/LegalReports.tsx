'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format, parseISO } from 'date-fns'
import { FileDown, Scale, Percent } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useChargeOutcomeReport } from '../../hooks/useChargeOutcomeReport'
import { useConvictionRateTrend } from '../../hooks/useConvictionRateTrend'
import { useUpcomingHearingsReport } from '../../hooks/useUpcomingHearingsReport'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { CcmsDonutChart, CcmsLineChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsDonutDataPoint } from '@/shared/components/charts/CcmsDonutChart'
import type { CcmsLineSeries } from '@/shared/components/charts/CcmsLineChart'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { DataTable } from '@/shared/components/table/DataTable'
import { Button } from '@/components/ui/button'
import { DatePreset, type UpcomingHearingReportItem } from '../../types/reports.types'
import { CHART_COLORS } from '@/shared/constants/chartColors'
import { formatPercent } from '../../utils/reportUtils'

const OUTCOME_COLOR_MAP: Record<string, string> = {
  convicted: CHART_COLORS.success,
  acquitted: CHART_COLORS.warning,
  dropped: CHART_COLORS.muted,
  pending: CHART_COLORS.primary,
}

export function LegalReports() {
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
  const { data: outcomesReport, isLoading: outcomesLoading } = useChargeOutcomeReport(hookFilters)
  const { data: trendReport, isLoading: trendLoading } = useConvictionRateTrend(hookFilters)
  const { data: hearingsReport, isLoading: hearingsLoading } = useUpcomingHearingsReport(hookFilters)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadReportCsv('legal/charge-outcomes', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Pre-process donut data
  const donutData = useMemo<CcmsDonutDataPoint[]>(() => {
    if (!outcomesReport?.byOutcome) return []
    return outcomesReport.byOutcome.map((item) => ({
      name: t(`legal.chargeOutcomes.outcomes.${item.outcome}`),
      value: item.count,
      color: OUTCOME_COLOR_MAP[item.outcome] ?? CHART_COLORS.muted,
    }))
  }, [outcomesReport, t])

  // Pre-process line data
  const lineData = useMemo(() => {
    if (!trendReport?.dataPoints) return []
    return trendReport.dataPoints.map((dp) => ({
      month: dp.month,
      rate: dp.ratePercent,
    }))
  }, [trendReport])

  const lineSeries = useMemo<CcmsLineSeries[]>(() => [
    {
      dataKey: 'rate',
      label: t('legal.convictionTrend.yAxisLabel') || 'Rate (%)',
      color: CHART_COLORS.success,
    },
  ], [t])

  const monthAxisFormatter = (v: string) => {
    try {
      const d = parseISO(`${v}-01`)
      return isNaN(d.getTime()) ? v : format(d, 'MMM yy')
    } catch {
      return v
    }
  }

  // Hearings Columns
  const hearingsColumns = useMemo<ColumnDef<UpcomingHearingReportItem>[]>(() => [
    {
      accessorKey: 'caseNumber',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('legal.upcomingHearings.columns.case')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link
            href={`/cases/${row.original.courtCaseId}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {row.original.caseNumber}
          </Link>
          <span className="text-[10px] text-foreground-muted truncate max-w-[150px]">
            {row.original.caseTitle}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'courtName',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('legal.upcomingHearings.columns.court')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-foreground font-medium">{row.original.courtName}</span>,
    },
    {
      accessorKey: 'hearingDate',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('legal.upcomingHearings.columns.hearingDate')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.original.hearingDate)
        return (
          <span className="text-xs text-foreground-muted">
            {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy HH:mm')}
          </span>
        )
      },
    },
    {
      accessorKey: 'hearingType',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('legal.upcomingHearings.columns.type')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-foreground">{row.original.hearingType}</span>,
    },
    {
      accessorKey: 'assignedOfficerName',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('legal.upcomingHearings.columns.officer')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {row.original.assignedOfficerName || '—'}
        </span>
      ),
    },
  ], [t])

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Area */}
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

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* KPI & Outcomes Donut */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Conviction Rate KPI */}
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('legal.convictionTrend.title')}
            </h3>
            <div className="flex-1 flex items-center py-2">
              <KpiCard
                icon={Percent}
                label={t('legal.convictionTrend.overallRate')}
                value={trendReport?.overallRatePercent ?? null}
                valueFormatter={(v) => formatPercent(v as number)}
                isLoading={trendLoading}
              />
            </div>
          </div>

          {/* Outcomes Donut */}
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 flex-1">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground">
                {t('legal.chargeOutcomes.title')}
              </h3>
              <p className="text-xs text-foreground-muted">
                {t('legal.chargeOutcomes.description')}
              </p>
            </div>
            <div className="flex justify-center items-center flex-1">
              <CcmsDonutChart
                data={donutData}
                centreLabel={t('legal.chargeOutcomes.totalLabel')}
                centreValue={outcomesReport?.total ?? 0}
                isLoading={outcomesLoading}
              />
            </div>
          </div>
        </div>

        {/* Conviction Rate Trend Line Chart */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('legal.convictionTrend.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('legal.convictionTrend.description')}
            </p>
          </div>
          <div className="w-full flex-1 flex items-center justify-center">
            <CcmsLineChart
              data={lineData}
              series={lineSeries}
              xAxisKey="month"
              xAxisTickFormatter={monthAxisFormatter}
              isLoading={trendLoading}
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Hearings */}
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('legal.upcomingHearings.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('legal.upcomingHearings.description')}
            </p>
          </div>
          {hearingsReport?.total !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary font-semibold text-[10px]">
              <Scale className="h-3.5 w-3.5" />
              {t('legal.upcomingHearings.totalLabel', { count: hearingsReport.total })}
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <DataTable
            data={hearingsReport?.hearings ?? []}
            columns={hearingsColumns}
            isLoading={hearingsLoading}
            emptyTitle={t('legal.upcomingHearings.title')}
            emptyMessage={t('legal.upcomingHearings.empty')}
          />
        </div>
      </div>
    </div>
  )
}
