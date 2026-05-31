'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'

import { usePersonCases } from '@features/personnel/hooks/usePersonCases'
import { PERSON_ROLE_VARIANTS } from '@features/personnel/utils/personnelUtils'
import type { PersonCaseSummary } from '@features/personnel/types/personnel.types'

import { DataTable } from '@shared/components/table/DataTable'
import { TablePagination } from '@shared/components/table/TablePagination'
import { SectionHeader } from '@shared/components/display/SectionHeader'
import { StatusBadge } from '@/shared/components/display/StatusBadge'

interface PersonCasesTableProps {
  personId: string
}

const CASE_STATUS_VARIANT_MAP: Record<string, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

export function PersonCasesTable({ personId }: PersonCasesTableProps) {
  const t = useTranslations('personnel')
  const router = useRouter()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = usePersonCases(personId, { page, pageSize })

  const columns: ColumnDef<PersonCaseSummary>[] = [
    {
      accessorKey: 'caseNumber',
      header: t('persons.detail.casesSection.columns.caseNumber'),
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
      header: t('persons.detail.casesSection.columns.title'),
      cell: ({ row }) => {
        const title = row.original.title
        const truncated = title.length > 40 ? `${title.slice(0, 40)}...` : title
        return <span className="text-sm font-medium truncate max-w-[240px] block" title={title}>{truncated}</span>
      },
    },
    {
      accessorKey: 'roleOnCase',
      header: t('persons.detail.casesSection.columns.roleOnCase'),
      cell: ({ row }) => {
        const role = row.original.roleOnCase
        return (
          <div className="min-w-[100px] flex">
            <StatusBadge
              status={t(`persons.role.${role}`)}
              variant={PERSON_ROLE_VARIANTS[role]}
            />
          </div>
        )
      },
    },
    {
      accessorKey: 'caseStatus',
      header: t('persons.detail.casesSection.columns.caseStatus'),
      cell: ({ row }) => {
        const status = row.original.caseStatus
        const variant = CASE_STATUS_VARIANT_MAP[status] ?? 'primary'
        // Translate using next-intl from 'cases' or fallback if not possible, but since we are inside personnel namespace, let's display status title
        // In CCMS system, statuses match string keys
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
      accessorKey: 'createdAt',
      header: t('persons.detail.casesSection.columns.createdAt'),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return <span className="text-xs text-foreground-muted min-w-[90px] block">{format(date, 'dd MMM yyyy')}</span>
      },
    },
  ]

  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('persons.detail.casesSection.title')}
        description={t('persons.detail.casesSection.entityCount', { count: total })}
      />

      <div className="space-y-4">
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row: PersonCaseSummary) => router.push(`/cases/${row.caseId}`)}
          emptyTitle={t('persons.detail.casesSection.title')}
          emptyMessage={t('persons.detail.casesSection.empty')}
        />

        {total > pageSize && (
          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onChange={(nextPage) => setPage(nextPage)}
          />
        )}
      </div>
    </div>
  )
}
