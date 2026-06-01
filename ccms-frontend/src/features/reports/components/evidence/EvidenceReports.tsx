'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format, parseISO } from 'date-fns'
import { FileDown, Calendar, AlertCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useEvidenceTypeBreakdown } from '../../hooks/useEvidenceTypeBreakdown'
import { useEvidenceVolumeTrend } from '../../hooks/useEvidenceVolumeTrend'
import { useUnreviewedEvidenceReport } from '../../hooks/useUnreviewedEvidenceReport'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { CcmsDonutChart, CcmsLineChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsDonutDataPoint } from '@/shared/components/charts/CcmsDonutChart'
import type { CcmsLineSeries } from '@/shared/components/charts/CcmsLineChart'
import { DataTable } from '@/shared/components/table/DataTable'
import { Button } from '@/components/ui/button'
import { DatePreset, type UnreviewedEvidenceItem } from '../../types/reports.types'
import { CHART_COLORS } from '@/shared/constants/chartColors'

export function EvidenceReports() {
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
  const { data: typeBreakdown, isLoading: typeLoading } = useEvidenceTypeBreakdown(hookFilters)
  const { data: volumeTrend, isLoading: volumeLoading } = useEvidenceVolumeTrend(hookFilters)
  const { data: unreviewedReport, isLoading: unreviewedLoading } = useUnreviewedEvidenceReport(hookFilters)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadReportCsv('evidence/type-breakdown', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Pre-process donut data
  const donutData = useMemo<CcmsDonutDataPoint[]>(() => {
    if (!typeBreakdown?.byType) return []
    return typeBreakdown.byType.map((item) => ({
      name: item.type,
      value: item.count,
    }))
  }, [typeBreakdown])

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
      label: t('evidence.volumeTrend.totalLabel'),
      color: CHART_COLORS.teal,
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

  // Unreviewed Table Columns
  const columns = useMemo<ColumnDef<UnreviewedEvidenceItem>[]>(() => [
    {
      accessorKey: 'caseNumber',
      header: t('evidence.unreviewed.columns.case'),
      cell: ({ row }) => (
        <Link
          href={`/cases/${row.original.id}`}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          {row.original.caseNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: t('evidence.unreviewed.columns.type'),
      cell: ({ row }) => <span className="text-xs text-foreground font-medium">{row.original.type}</span>,
    },
    {
      accessorKey: 'collectedAt',
      header: t('evidence.unreviewed.columns.collectedAt'),
      cell: ({ row }) => {
        const d = new Date(row.original.collectedAt)
        return (
          <span className="text-xs text-foreground-muted">
            {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy')}
          </span>
        )
      },
    },
    {
      accessorKey: 'daysUnreviewed',
      header: t('evidence.unreviewed.columns.daysUnreviewed'),
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold text-warning">
          {row.original.daysUnreviewed}
        </span>
      ),
    },
  ], [t])

  const unreviewedCount = unreviewedReport?.count ?? 0

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Type Breakdown */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('evidence.typeBreakdown.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('evidence.typeBreakdown.description')}
            </p>
          </div>
          <div className="flex justify-center flex-1 items-center">
            <CcmsDonutChart
              data={donutData}
              centreLabel={t('evidence.typeBreakdown.totalLabel')}
              centreValue={typeBreakdown?.total ?? 0}
              isLoading={typeLoading}
            />
          </div>
        </div>

        {/* Volume Trend */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('evidence.volumeTrend.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('evidence.volumeTrend.description')}
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

      {/* Unreviewed Evidence List */}
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('evidence.unreviewed.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('evidence.unreviewed.description')}
            </p>
          </div>
          
          {unreviewedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-warning/20 bg-warning/5 text-warning font-semibold text-[10px]">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('evidence.unreviewed.countLabel', { count: unreviewedCount })}
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <DataTable
            data={unreviewedReport?.items ?? []}
            columns={columns}
            isLoading={unreviewedLoading}
            emptyTitle={t('evidence.unreviewed.title')}
            emptyMessage={t('evidence.unreviewed.allReviewed')}
          />
        </div>
      </div>
    </div>
  )
}
