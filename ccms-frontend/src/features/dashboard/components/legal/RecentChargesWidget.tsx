'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DataTable } from '@/shared/components/table/DataTable'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import type { RecentChargeDashboardItem } from '../../types/dashboard.types'

const CHARGE_STATUS_COLOR_MAP: Record<string, 'destructive' | 'success' | 'muted' | 'warning' | 'primary'> = {
  CONVICTED: 'destructive',
  ACQUITTED: 'success',
  DROPPED: 'muted',
  PENDING: 'warning',
}

interface RecentChargesWidgetProps {
  charges?: RecentChargeDashboardItem[] | undefined
  isLoading: boolean
}

export function RecentChargesWidget({ charges = [], isLoading }: RecentChargesWidgetProps) {
  const t = useTranslations('dashboard')
  const tReports = useTranslations('reports')

  const columns = useMemo<ColumnDef<RecentChargeDashboardItem>[]>(() => [
    {
      accessorKey: 'crimeTypeCode',
      header: t('legal.chargesWidget.columns.crimeType'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-semibold flex-shrink-0">
            {row.original.crimeTypeCode}
          </Badge>
          <span className="text-xs text-foreground truncate max-w-[120px]" title={row.original.crimeTypeName}>
            {row.original.crimeTypeName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'suspectName',
      header: t('legal.chargesWidget.columns.suspect'),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.original.suspectName}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('legal.chargesWidget.columns.status'),
      cell: ({ row }) => {
        const status = row.original.status.toUpperCase()
        const variant = CHARGE_STATUS_COLOR_MAP[status] ?? 'primary'
        // Fallback translation if key is not found in legal outcome namespace
        const translatedStatus = tReports(`legal.chargeOutcomes.outcomes.${status.toLowerCase()}`, { defaultValue: status })
        return (
          <StatusBadge
            status={translatedStatus}
            variant={variant}
            className="text-center text-[10px] px-2 py-0.5 w-[80px]"
          />
        )
      },
    },
    {
      accessorKey: 'filedAt',
      header: t('legal.chargesWidget.columns.filedAt'),
      cell: ({ row }) => {
        const d = new Date(row.original.filedAt)
        return (
          <span className="text-xs text-foreground-muted">
            {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy')}
          </span>
        )
      },
    },
  ], [t, tReports])

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('legal.chargesWidget.title')}
        </h3>
        <Link
          href="/legal"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('legal.chargesWidget.viewAll')}
        </Link>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={charges}
          columns={columns}
          isLoading={isLoading}
          emptyTitle={t('legal.chargesWidget.title')}
          emptyMessage={t('legal.chargesWidget.empty')}
        />
      </div>
    </div>
  )
}
