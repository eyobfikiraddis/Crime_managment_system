'use client'

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/shared/components/table/DataTable'
import type { DepartmentOverviewItem } from '../../types/dashboard.types'

interface DepartmentOverviewWidgetProps {
  departments?: DepartmentOverviewItem[] | undefined
  isLoading: boolean
}

export function DepartmentOverviewWidget({ departments = [], isLoading }: DepartmentOverviewWidgetProps) {
  const t = useTranslations('dashboard')
  const router = useRouter()

  const columns = useMemo<ColumnDef<DepartmentOverviewItem>[]>(() => [
    {
      accessorKey: 'departmentName',
      header: t('admin.deptOverviewWidget.columns.department'),
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
      header: t('admin.deptOverviewWidget.columns.activeCases'),
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground">
          {row.original.activeCaseCount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'officerCount',
      header: t('admin.deptOverviewWidget.columns.officers'),
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {row.original.officerCount.toLocaleString()}
        </span>
      ),
    },
  ], [t])

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.deptOverviewWidget.title')}
        </h3>
        <Link
          href="/departments"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('admin.deptOverviewWidget.viewAll')}
        </Link>
      </div>

      <div className="overflow-hidden">
        <DataTable
          data={departments}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/departments/${row.departmentId}`)}
          emptyTitle={t('admin.deptOverviewWidget.title')}
          emptyMessage={t('admin.deptOverviewWidget.empty')}
        />
      </div>
    </div>
  )
}
