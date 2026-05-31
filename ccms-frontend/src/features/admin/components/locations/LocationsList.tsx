'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { Plus, X, RotateCcw, MoreHorizontal } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { PageHeader } from '@shared/components/display/PageHeader'
import { DataTable } from '@shared/components/table/DataTable'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'

import { useLocationList } from '../../hooks/useLocationList'
import type { Location } from '../../types/admin.types'

import { CreateLocationDrawer } from './CreateLocationDrawer'
import { DeleteLocationDialog } from './DeleteLocationDialog'

export function LocationsList() {
  const t = useTranslations('admin')
  
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('name'),
    sortDirection: parseAsString.withDefault('asc'),
  })

  const queryFilters = useMemo(() => {
    const q: any = {
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField,
      sortDirection: filters.sortDirection,
    }
    if (filters.search) q.search = filters.search
    return q
  }, [filters])

  const { data, isLoading } = useLocationList(queryFilters)

  const handlePaginationChange = (page: number, pageSize: number) => {
    void setFilters({ page, pageSize })
  }

  const handleSortingChange = (sorting: any) => {
    if (sorting && sorting.length > 0) {
      const field = sorting[0].id
      const direction = sorting[0].desc ? 'desc' : 'asc'
      void setFilters({ sortField: field, sortDirection: direction })
    } else {
      void setFilters({ sortField: 'name', sortDirection: 'asc' })
    }
  }

  const clearAllFilters = () => {
    void setFilters({
      search: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(filters.search)

  const columns: ColumnDef<Location>[] = [
    {
      accessorKey: 'name',
      header: t('locations.list.columns.name'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground min-w-[200px] block">
          {row.original.name}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'region',
      header: t('locations.list.columns.region'),
      cell: ({ row }) => (
        <span className="text-sm text-foreground min-w-[140px] block">
          {row.original.region || <span className="text-foreground-muted">{t('locations.list.noRegion')}</span>}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'country',
      header: t('locations.list.columns.country'),
      cell: ({ row }) => (
        <span className="text-sm text-foreground min-w-[120px] block">
          {row.original.country}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: t('locations.list.columns.createdAt'),
      cell: ({ row }) => {
        let dateStr = ''
        try {
          dateStr = new Date(row.original.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        } catch {
          dateStr = row.original.createdAt
        }
        return <span className="text-sm text-foreground-muted min-w-[100px] block">{dateStr}</span>
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const loc = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setDeleteTarget(loc)}
              >
                {t('locations.list.rowActions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <PermissionGuard permission={Permission.ADMIN_MANAGE} fallback={<ForbiddenState />}>
      <div className="space-y-6">
        <PageHeader
          title={t('locations.list.heading')}
          description={`${data?.total ?? 0} ${t('locations.list.entityCount', { count: data?.total ?? 0 })}`}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('locations.list.addLocationButton')}
            </Button>
          }
        />

        <div className="space-y-4">
          <TableFilterBar
            value={filters.search}
            onChange={(val) => void setFilters({ search: val || null, page: 1 })}
            placeholder={t('locations.list.filters.search')}
          >
            {hasActiveFilters && (
              <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('locations.list.filters.clearAll')}
              </Button>
            )}
          </TableFilterBar>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-foreground-muted">Active Filters:</span>
              {filters.search && (
                <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                  Search: "{filters.search}"
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ search: null, page: 1 })} />
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            emptyTitle={t('locations.list.empty.title')}
            emptyMessage={hasActiveFilters ? t('locations.list.emptyFiltered') : t('locations.list.empty.description')}
            sorting={[{ id: filters.sortField, desc: filters.sortDirection === 'desc' }]}
            onSortingChange={handleSortingChange}
            pagination={{
              pageIndex: filters.page - 1,
              pageSize: filters.pageSize,
            }}
            onPaginationChange={(state) => handlePaginationChange(state.pageIndex + 1, state.pageSize)}
          />

          {data && data.total > 0 && (
            <TablePagination
              total={data.total}
              page={filters.page}
              pageSize={filters.pageSize}
              onChange={handlePaginationChange}
            />
          )}
        </div>

        {createOpen && (
          <CreateLocationDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        )}

        {deleteTarget && (
          <DeleteLocationDialog
            open={Boolean(deleteTarget)}
            location={deleteTarget}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </PermissionGuard>
  )
}
