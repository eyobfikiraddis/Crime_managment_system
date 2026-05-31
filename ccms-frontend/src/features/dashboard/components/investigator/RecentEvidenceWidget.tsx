'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DataTable } from '@/shared/components/table/DataTable'
import type { RecentEvidenceItem } from '../../types/dashboard.types'

interface RecentEvidenceWidgetProps {
  evidence?: RecentEvidenceItem[] | undefined
  isLoading: boolean
}

export function RecentEvidenceWidget({ evidence = [], isLoading }: RecentEvidenceWidgetProps) {
  const t = useTranslations('dashboard')

  const columns = useMemo<ColumnDef<RecentEvidenceItem>[]>(() => [
    {
      accessorKey: 'caseNumber',
      header: t('investigator.evidenceWidget.columns.case'),
      cell: ({ row }) => (
        <Link
          href={`/cases/${row.original.caseId}`}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          {row.original.caseNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: t('investigator.evidenceWidget.columns.type'),
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground">
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'collectedAt',
      header: t('investigator.evidenceWidget.columns.collectedAt'),
      cell: ({ row }) => {
        const d = new Date(row.original.collectedAt)
        return (
          <span className="text-xs text-foreground-muted">
            {isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy HH:mm')}
          </span>
        )
      },
    },
  ], [t])

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('investigator.evidenceWidget.title')}
        </h3>
        <Link
          href="/reports/evidence"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('investigator.evidenceWidget.viewAll')}
        </Link>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={evidence}
          columns={columns}
          isLoading={isLoading}
          emptyTitle={t('investigator.evidenceWidget.title')}
          emptyMessage={t('investigator.evidenceWidget.empty')}
        />
      </div>
    </div>
  )
}
