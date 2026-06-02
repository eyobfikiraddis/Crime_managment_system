'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString } from 'nuqs'
import { subDays, format } from 'date-fns'
import { FileDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useDepartmentComparisonReport } from '../../hooks/useDepartmentComparisonReport'
import { useDepartmentCaseDistribution } from '../../hooks/useDepartmentCaseDistribution'
import { downloadReportCsv } from '@services/domain/reports.service'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ReportsFilterBar } from '../ReportsFilterBar'
import { CcmsDonutChart } from '@/shared/components/charts/LazyCharts'
import type { CcmsDonutDataPoint } from '@/shared/components/charts/CcmsDonutChart'
import { KpiCard } from '@/shared/components/display/KpiCard'
import { DataTable } from '@/shared/components/table/DataTable'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState'
import { Permission } from '@/shared/constants/permissions'
import { hasAllPermissions } from '@/shared/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'
import { DatePreset, type DepartmentComparisonItem } from '../../types/reports.types'
import { formatPercent } from '../../utils/reportUtils'

export function DepartmentReports() {
  const t = useTranslations('reports')
  const { addToast } = useNotificationStore()
  const [isExporting, setIsExporting] = useState(false)

  const permissions = useAuthStore((state) => state.permissions)
  const isAdmin = useMemo(() => hasAllPermissions(permissions, [Permission.ADMIN_MANAGE]), [permissions])

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
  const { data: comparisonReport, isLoading: comparisonLoading } = useDepartmentComparisonReport(hookFilters, isAdmin)
  const { data: distributionReport, isLoading: distributionLoading } = useDepartmentCaseDistribution(hookFilters, isAdmin)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadReportCsv('departments/comparison', hookFilters)
      addToast({ message: t('export.successMessage'), variant: 'success' })
    } catch {
      addToast({ message: t('export.errorMessage'), variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // Pre-process donut data
  const donutData = useMemo<CcmsDonutDataPoint[]>(() => {
    if (!distributionReport?.byDepartment) return []
    return distributionReport.byDepartment.map((item) => ({
      name: item.departmentName,
      value: item.count,
    }))
  }, [distributionReport])

  // Comparison Columns
  const comparisonColumns = useMemo<ColumnDef<DepartmentComparisonItem>[]>(() => [
    {
      accessorKey: 'departmentName',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('departments.comparison.columns.department')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/departments/${row.original.departmentId}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {row.original.departmentName}
        </Link>
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
          {t('departments.comparison.columns.activeCases')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => <span className="text-xs font-mono text-foreground font-semibold">{row.original.activeCaseCount}</span>,
    },
    {
      accessorKey: 'closedCaseCount',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('departments.comparison.columns.closedCases')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => <span className="text-xs font-mono text-foreground-muted">{row.original.closedCaseCount}</span>,
    },
    {
      accessorKey: 'officerCount',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('departments.comparison.columns.officers')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => <span className="text-xs font-mono text-foreground-muted">{row.original.officerCount}</span>,
    },
    {
      accessorKey: 'resolutionRatePercent',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('departments.comparison.columns.resolutionRate')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-success font-semibold">
          {row.original.resolutionRatePercent !== null ? formatPercent(row.original.resolutionRatePercent) : t('departments.comparison.noRate')}
        </span>
      ),
    },
    {
      accessorKey: 'averageCaseAgeDays',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer select-none font-semibold hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('departments.comparison.columns.avgAge')}
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-foreground-muted">
          {row.original.averageCaseAgeDays !== null ? `${row.original.averageCaseAgeDays.toFixed(0)}${t('departments.comparison.ageSuffix')}` : '—'}
        </span>
      ),
    },
  ], [t])

  return (
    <PermissionGuard
      permission={Permission.ADMIN_MANAGE}
      fallback={
        <ForbiddenState
          title={t('departments.accessDenied')}
          description="You do not have the required permissions to view this report."
        />
      }
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Filters Area */}
        <div className="flex flex-col gap-4">
          <ReportsFilterBar
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            preset={filters.preset as DatePreset | null}
            departmentId={filters.departmentId}
            onChange={(updates) => setFilters(updates as any)}
            hideDepartmentFilter={true}
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
          {/* Comparison Table */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground">
                {t('departments.comparison.title')}
              </h3>
              <p className="text-xs text-foreground-muted">
                {t('departments.comparison.description')}
              </p>
            </div>
            <div className="overflow-hidden">
              <DataTable
                data={comparisonReport?.departments ?? []}
                columns={comparisonColumns}
                isLoading={comparisonLoading}
                emptyTitle={t('departments.comparison.title')}
                emptyMessage={t('noData')}
              />
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground">
                {t('departments.caseDistribution.title')}
              </h3>
              <p className="text-xs text-foreground-muted">
                {t('departments.caseDistribution.description')}
              </p>
            </div>
            <div className="flex justify-center items-center flex-1">
              <CcmsDonutChart
                data={donutData}
                centreLabel={t('departments.caseDistribution.totalLabel')}
                centreValue={distributionReport?.total ?? 0}
                isLoading={distributionLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
