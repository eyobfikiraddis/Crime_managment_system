'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/shared/components/table/DataTable'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { useDepartmentOfficers } from '../hooks/useDepartmentOfficers'
import { DEPT_OFFICER_ROLE_VARIANTS, DEPT_OFFICER_STATUS_VARIANTS } from '../utils/departmentUtils'
import type { DepartmentOfficerSummary } from '../types/department.types'

interface DepartmentOfficersTableProps {
  departmentId: string
}

export function DepartmentOfficersTable({ departmentId }: DepartmentOfficersTableProps) {
  const t = useTranslations('departments')
  const { data, isLoading } = useDepartmentOfficers(departmentId, { pageSize: 50 })

  const columns = useMemo<ColumnDef<DepartmentOfficerSummary>[]>(() => {
    return [
      {
        accessorKey: 'badgeNumber',
        header: t('detail.officersSection.columns.badgeNumber'),
        cell: ({ row }) => {
          const o = row.original
          const isInactive = o.status === 'INACTIVE'
          return (
            <span className={`font-mono text-xs font-semibold ${isInactive ? 'opacity-60' : ''}`}>
              {o.badgeNumber}
            </span>
          )
        },
      },
      {
        accessorKey: 'name',
        header: t('detail.officersSection.columns.name'),
        cell: ({ row }) => {
          const o = row.original
          const isInactive = o.status === 'INACTIVE'
          return (
            <Link
              href={`/personnel/officers/${o.id}`}
              className={`text-sm font-medium text-primary hover:underline ${isInactive ? 'opacity-60' : ''}`}
            >
              {o.firstName} {o.lastName}
            </Link>
          )
        },
      },
      {
        accessorKey: 'role',
        header: t('detail.officersSection.columns.role'),
        cell: ({ row }) => {
          const o = row.original
          const isInactive = o.status === 'INACTIVE'
          return (
            <div className={isInactive ? 'opacity-60' : ''}>
              <StatusBadge
                status={o.role}
                variant={DEPT_OFFICER_ROLE_VARIANTS[o.role] ?? 'muted'}
              />
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: t('detail.officersSection.columns.status'),
        cell: ({ row }) => {
          const o = row.original
          const isInactive = o.status === 'INACTIVE'
          return (
            <div className={isInactive ? 'opacity-60' : ''}>
              <StatusBadge
                status={o.status}
                variant={DEPT_OFFICER_STATUS_VARIANTS[o.status] ?? 'muted'}
              />
            </div>
          )
        },
      },
      {
        accessorKey: 'joinedAt',
        header: t('detail.officersSection.columns.joinedAt'),
        cell: ({ row }) => {
          const o = row.original
          const isInactive = o.status === 'INACTIVE'
          let dateStr = ''
          try {
            dateStr = format(new Date(o.joinedAt), 'dd MMM yyyy')
          } catch {
            dateStr = o.joinedAt
          }
          return (
            <span className={`text-sm text-foreground-muted ${isInactive ? 'opacity-60' : ''}`}>
              {dateStr}
            </span>
          )
        },
      },
    ]
  }, [t])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {t('detail.officersSection.title')}
          <span className="ml-2 text-sm font-normal text-foreground-muted">
            {data ? t('detail.officersSection.entityCount', { count: data.total }) : ''}
          </span>
        </h3>
        <Link
          href={`/personnel/officers?departmentId=${departmentId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('detail.officersSection.viewAll')}
        </Link>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyTitle={t('detail.officersSection.title')}
        emptyMessage={t('detail.officersSection.empty')}
      />
    </div>
  )
}
