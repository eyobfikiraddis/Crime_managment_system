'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/shared/components/table/DataTable'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import type { InvestigatorCaseSummary } from '../../types/dashboard.types'

const STATUS_VARIANT_MAP: Record<string, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

interface AssignedCasesWidgetProps {
  cases?: InvestigatorCaseSummary[] | undefined
  isLoading: boolean
}

export function AssignedCasesWidget({ cases = [], isLoading }: AssignedCasesWidgetProps) {
  const t = useTranslations('dashboard')
  const tCases = useTranslations('cases')
  const router = useRouter()

  const columns = useMemo<ColumnDef<InvestigatorCaseSummary>[]>(() => [
    {
      accessorKey: 'caseNumber',
      header: t('investigator.recentCasesWidget.columns.caseNumber'),
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
      accessorKey: 'title',
      header: t('investigator.recentCasesWidget.columns.title'),
      cell: ({ row }) => (
        <span className="truncate max-w-[200px] block text-xs font-medium text-foreground">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('investigator.recentCasesWidget.columns.status'),
      cell: ({ row }) => {
        const status = row.original.status
        const variant = STATUS_VARIANT_MAP[status] ?? 'primary'
        return (
          <StatusBadge
            status={tCases(`status.${status}`)}
            variant={variant}
            className="text-center text-[10px] px-2 py-0.5"
          />
        )
      },
    },
    {
      accessorKey: 'crimeTypeName',
      header: t('investigator.recentCasesWidget.columns.crimeType'),
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {row.original.crimeTypeName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'lastUpdatedAt',
      header: t('investigator.recentCasesWidget.columns.lastUpdated'),
      cell: ({ row }) => {
        const d = new Date(row.original.lastUpdatedAt)
        return (
          <span className="text-xs text-foreground-muted">
            {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy')}
          </span>
        )
      },
    },
  ], [t, tCases])

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('investigator.recentCasesWidget.title')}
        </h3>
        <Link
          href="/cases"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('investigator.recentCasesWidget.viewAll')}
        </Link>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={cases}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/cases/${row.id}`)}
          emptyTitle={t('investigator.recentCasesWidget.title')}
          emptyMessage={t('investigator.recentCasesWidget.empty')}
        />
      </div>
    </div>
  )
}
