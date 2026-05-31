'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'

import { useOfficerCases } from '@features/personnel/hooks/useOfficerCases'
import type { OfficerCaseSummary } from '@features/personnel/types/personnel.types'

import { DataTable } from '@shared/components/table/DataTable'
import { SectionHeader } from '@shared/components/display/SectionHeader'
import { StatusBadge } from '@/shared/components/display/StatusBadge'

interface OfficerCasesSummaryProps {
  officerId: string
}

const CASE_STATUS_VARIANT_MAP: Record<string, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

export function OfficerCasesSummary({ officerId }: OfficerCasesSummaryProps) {
  const t = useTranslations('personnel')
  const router = useRouter()

  const { data, isLoading } = useOfficerCases(officerId)

  const columns: ColumnDef<OfficerCaseSummary>[] = [
    {
      accessorKey: 'caseNumber',
      header: t('officers.detail.casesSection.columns.caseNumber'),
      cell: ({ row }) => {
        const c = row.original
        return (
          <Link
            href={`/cases/${c.caseId}`}
            className="font-mono text-xs font-semibold text-primary hover:underline min-w-[90px] block"
          >
            {c.caseNumber}
          </Link>
        )
      },
    },
    {
      accessorKey: 'title',
      header: t('officers.detail.casesSection.columns.title'),
      cell: ({ row }) => {
        const title = row.original.title
        const truncated = title.length > 40 ? `${title.slice(0, 40)}...` : title
        return <span className="text-sm font-medium truncate max-w-[280px] block" title={title}>{truncated}</span>
      },
    },
    {
      accessorKey: 'status',
      header: t('officers.detail.casesSection.columns.status'),
      cell: ({ row }) => {
        const status = row.original.status
        const variant = CASE_STATUS_VARIANT_MAP[status] ?? 'primary'
        return (
          <div className="min-w-[100px] flex">
            <StatusBadge
              status={status}
              variant={variant}
            />
          </div>
        )
      },
    },
    {
      accessorKey: 'assignedAt',
      header: t('officers.detail.casesSection.columns.assignedAt'),
      cell: ({ row }) => {
        const date = new Date(row.original.assignedAt)
        return <span className="text-xs text-foreground-muted min-w-[90px] block">{format(date, 'dd MMM yyyy')}</span>
      },
    },
  ]

  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('officers.detail.casesSection.title')}
        description={t('officers.list.entityCount', { count: total })}
        actions={
          total > 0 ? (
            <Link
              href={`/cases?assignedOfficerId=${officerId}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t('officers.detail.casesSection.viewAll')} &rarr;
            </Link>
          ) : null
        }
      />

      <div className="space-y-4">
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row: OfficerCaseSummary) => router.push(`/cases/${row.caseId}`)}
          emptyTitle={t('officers.detail.casesSection.title')}
          emptyMessage={t('officers.detail.casesSection.empty')}
        />
      </div>
    </div>
  )
}
