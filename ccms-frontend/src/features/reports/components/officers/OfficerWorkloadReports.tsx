'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format } from 'date-fns'
import { FileDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useOfficerWorkloadReport } from '../../hooks/useOfficerWorkloadReport'
import { useOfficerActivityReport } from '../../hooks/useOfficerActivityReport'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { DataTable } from '@/shared/components/table/DataTable'
import { Button } from '@/components/ui/button'
import { DatePreset, type OfficerWorkloadItem, type OfficerActivityItem } from '../../types/reports.types'

export function OfficerWorkloadReports() {
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
  const { data: workloadReport, isLoading: workloadLoading } = useOfficerWorkloadReport(hookFilters)
  const { data: activityReport, isLoading: activityLoading } = useOfficerActivityReport(hookFilters)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Export workload as primary workload report
      await downloadReportCsv('officers/workload', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Workload Columns
  const workloadColumns = useMemo<ColumnDef<OfficerWorkloadItem>[]>(() => [
    {
      id: 'officer',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.workload.columns.officer')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: 'badgeNumber',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.workload.columns.badge')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground-muted">
          {row.original.badgeNumber}
        </span>
      ),
    },
    {
      accessorKey: 'activeCaseCount',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.workload.columns.activeCases')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold text-foreground">
          {row.original.activeCaseCount}
        </span>
      ),
    },
    {
      accessorKey: 'totalCasesInPeriod',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.workload.columns.totalInPeriod')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-foreground-muted">
          {row.original.totalCasesInPeriod}
        </span>
      ),
    },
    {
      accessorKey: 'closedCasesInPeriod',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.workload.columns.closedInPeriod')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-success">
          {row.original.closedCasesInPeriod}
        </span>
      ),
    },
  ], [t])

  // Activity Columns
  const activityColumns = useMemo<ColumnDef<OfficerActivityItem>[]>(() => [
    {
      id: 'officer',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.activity.columns.officer')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: 'badgeNumber',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.activity.columns.badge')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground-muted">
          {row.original.badgeNumber}
        </span>
      ),
    },
    {
      accessorKey: 'evidenceItemsLogged',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.activity.columns.evidenceLogged')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-foreground">
          {row.original.evidenceItemsLogged}
        </span>
      ),
    },
    {
      accessorKey: 'interrogationsConducted',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.activity.columns.interrogations')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-foreground">
          {row.original.interrogationsConducted}
        </span>
      ),
    },
    {
      accessorKey: 'arrestsRecorded',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('officers.activity.columns.arrests')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-foreground">
          {row.original.arrestsRecorded}
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

      <div className="grid grid-cols-1 gap-6">
        {/* Active Case Load Table */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('officers.workload.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('officers.workload.description')}
            </p>
          </div>
          <div className="overflow-hidden">
            <DataTable
              data={workloadReport?.officers ?? []}
              columns={workloadColumns}
              isLoading={workloadLoading}
              emptyTitle={t('officers.workload.title')}
              emptyMessage={t('noData')}
            />
          </div>
        </div>

        {/* Officer Activity Metrics Table */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {t('officers.activity.title')}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t('officers.activity.description')}
            </p>
          </div>
          <div className="overflow-hidden">
            <DataTable
              data={activityReport?.officers ?? []}
              columns={activityColumns}
              isLoading={activityLoading}
              emptyTitle={t('officers.activity.title')}
              emptyMessage={t('noData')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
