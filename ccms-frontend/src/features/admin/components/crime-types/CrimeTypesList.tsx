'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs'
import { Plus, X, RotateCcw, MoreHorizontal } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { StatusBadge } from '@/shared/components/display/StatusBadge'

import { useCrimeTypeList } from '../../hooks/useCrimeTypeList'
import { CrimeSeverity } from '../../types/admin.types'
import { CRIME_SEVERITY_VARIANTS } from '../../utils/adminUtils'
import type { CrimeType } from '../../types/admin.types'

import { CreateCrimeTypeDrawer } from './CreateCrimeTypeDrawer'
import { DeleteCrimeTypeDialog } from './DeleteCrimeTypeDialog'

export function CrimeTypesList() {
  const t = useTranslations('admin')

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CrimeType | null>(null)

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    severity: parseAsArrayOf(parseAsString).withDefault([]),
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
    if (filters.severity && filters.severity.length > 0) {
      q.severity = filters.severity as CrimeSeverity[]
    }
    return q
  }, [filters])

  const { data, isLoading } = useCrimeTypeList(queryFilters)

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

  const toggleSeverity = (sev: CrimeSeverity) => {
    const current = filters.severity
    const next = current.includes(sev)
      ? current.filter((s) => s !== sev)
      : [...current, sev]
    void setFilters({ severity: next.length > 0 ? next : null, page: 1 })
  }

  const clearAllFilters = () => {
    void setFilters({
      search: null,
      severity: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.severity.length > 0
  )

  const columns: ColumnDef<CrimeType>[] = [
    {
      accessorKey: 'name',
      header: t('crimeTypes.list.columns.name'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground min-w-[200px] block">
          {row.original.name}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'code',
      header: t('crimeTypes.list.columns.code'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground min-w-[130px] block bg-muted/30 px-1 py-0.5 rounded border border-border/40 w-fit">
          {row.original.code}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'category',
      header: t('crimeTypes.list.columns.category'),
      cell: ({ row }) => (
        <span className="text-sm text-foreground min-w-[140px] block">
          {row.original.category || <span className="text-foreground-muted">{t('crimeTypes.list.noCategory')}</span>}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'severity',
      header: t('crimeTypes.list.columns.severity'),
      cell: ({ row }) => {
        const sev = row.original.severity
        if (!sev) {
          return (
            <span className="text-sm text-foreground-muted min-w-[110px] block">
              {t('crimeTypes.list.noSeverity')}
            </span>
          )
        }
        return (
          <div className="min-w-[110px] flex">
            <StatusBadge
              status={t(`crimeTypes.severity.${sev}`)}
              variant={CRIME_SEVERITY_VARIANTS[sev] ?? 'muted'}
            />
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: t('crimeTypes.list.columns.createdAt'),
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
        const ct = row.original
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
                onClick={() => setDeleteTarget(ct)}
              >
                {t('crimeTypes.list.rowActions.delete')}
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
          title={t('crimeTypes.list.heading')}
          description={`${data?.total ?? 0} ${t('crimeTypes.list.entityCount', { count: data?.total ?? 0 })}`}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('crimeTypes.list.addCrimeTypeButton')}
            </Button>
          }
        />

        <div className="space-y-4">
          <TableFilterBar
            value={filters.search}
            onChange={(val) => void setFilters({ search: val || null, page: 1 })}
            placeholder={t('crimeTypes.list.filters.search')}
          >
            {/* Severity filter popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9">
                  {t('crimeTypes.list.filters.severity')}
                  {filters.severity.length > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                      {filters.severity.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-2">
                  {Object.values(CrimeSeverity).map((sev) => (
                    <label key={sev} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={filters.severity.includes(sev)}
                        onCheckedChange={() => toggleSeverity(sev)}
                      />
                      <span className="text-sm font-medium">{t(`crimeTypes.severity.${sev}`)}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('crimeTypes.list.filters.clearAll')}
              </Button>
            )}
          </TableFilterBar>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-foreground-muted">Active Filters:</span>
              {filters.search && (
                <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                  Search: "{filters.search}"
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ search: null, page: 1 })} />
                </Badge>
              )}
              {filters.severity.map((sev) => (
                <Badge key={sev} variant="secondary" className="gap-1 pr-1 font-normal">
                  Severity: {t(`crimeTypes.severity.${sev}`)}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleSeverity(sev as CrimeSeverity)} />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            emptyTitle={t('crimeTypes.list.empty.title')}
            emptyMessage={hasActiveFilters ? t('crimeTypes.list.emptyFiltered') : t('crimeTypes.list.empty.description')}
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
          <CreateCrimeTypeDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        )}

        {deleteTarget && (
          <DeleteCrimeTypeDialog
            open={Boolean(deleteTarget)}
            crimeType={deleteTarget}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </PermissionGuard>
  )
}
