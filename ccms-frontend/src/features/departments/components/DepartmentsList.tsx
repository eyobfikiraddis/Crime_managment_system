'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { Plus, X, RotateCcw, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { PageHeader } from '@shared/components/display/PageHeader'
import { DataTable } from '@shared/components/table/DataTable'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Permission } from '@shared/constants/permissions'
import { useAuthStore } from '@shared/stores/auth.store'

import { useDepartmentList } from '../hooks/useDepartmentList'
import { useLocationList } from '@/features/admin/hooks/useLocationList'
import { getDepartmentDisplayName, getHeadOfficerLabel } from '../utils/departmentUtils'
import type { DepartmentListItem } from '../types/department.types'

import { CreateDepartmentDrawer } from './CreateDepartmentDrawer'
import { UpdateDepartmentDrawer } from './UpdateDepartmentDrawer'
import { DeleteDepartmentDialog } from './DeleteDepartmentDialog'
import { AssignHeadOfficerDrawer } from './AssignHeadOfficerDrawer'

export function DepartmentsList() {
  const t = useTranslations('departments')
  const router = useRouter()
  const permissions = useAuthStore((state) => state.permissions)
  const isManage = permissions.includes(Permission.DEPARTMENTS_MANAGE)

  const [createOpen, setCreateOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [activeDept, setActiveDept] = useState<DepartmentListItem | null>(null)

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    locationId: parseAsString.withDefault(''),
    hasHeadOfficer: parseAsString.withDefault(''), // '' | 'true' | 'false'
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('name'),
    sortDirection: parseAsString.withDefault('asc'),
  })

  const { data: locations } = useLocationList({
    pageSize: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const queryFilters = useMemo(() => {
    const q: any = {
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField,
      sortDirection: filters.sortDirection,
    }
    if (filters.search) q.search = filters.search
    if (filters.locationId) q.locationId = filters.locationId
    if (filters.hasHeadOfficer === 'true') q.hasHeadOfficer = true
    if (filters.hasHeadOfficer === 'false') q.hasHeadOfficer = false
    return q
  }, [filters])

  const { data, isLoading } = useDepartmentList(queryFilters)

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
      locationId: null,
      hasHeadOfficer: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.locationId ||
    filters.hasHeadOfficer
  )

  const activeLocation = locations?.data.find((l) => l.id === filters.locationId)

  const columns: ColumnDef<DepartmentListItem>[] = [
    {
      accessorKey: 'name',
      header: t('list.columns.name'),
      cell: ({ row }) => {
        const d = row.original
        const displayName = getDepartmentDisplayName(d.name, d.code)
        return (
          <Link
            href={`/departments/${d.id}`}
            className="text-sm font-semibold text-primary hover:underline min-w-[200px] block"
          >
            {displayName}
          </Link>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'location',
      header: t('list.columns.location'),
      cell: ({ row }) => {
        const d = row.original
        return (
          <span className="text-sm text-foreground min-w-[140px] block">
            {d.location ? d.location.name : <span className="text-foreground-muted italic">{t('list.noLocation')}</span>}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'headOfficer',
      header: t('list.columns.headOfficer'),
      cell: ({ row }) => {
        const d = row.original
        if (!d.headOfficer) {
          return (
            <div className="min-w-[180px] flex">
              <StatusBadge status={t('list.noHead')} variant="muted" />
            </div>
          )
        }
        const label = getHeadOfficerLabel(
          d.headOfficer.firstName,
          d.headOfficer.lastName,
          d.headOfficer.badgeNumber,
        )
        return (
          <span className="text-sm text-foreground min-w-[180px] block">
            {label}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'officerCount',
      header: t('list.columns.officerCount'),
      cell: ({ row }) => {
        const d = row.original
        return <span className="text-sm text-foreground min-w-[80px] block">{d.officerCount}</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'activeCaseCount',
      header: t('list.columns.activeCases'),
      cell: ({ row }) => {
        const d = row.original
        return <span className="text-sm text-foreground min-w-[100px] block">{d.activeCaseCount}</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: t('list.columns.createdAt'),
      cell: ({ row }) => {
        const d = row.original
        let dateStr = ''
        try {
          dateStr = new Date(d.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        } catch {
          dateStr = d.createdAt
        }
        return <span className="text-sm text-foreground-muted min-w-[100px] block">{dateStr}</span>
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const d = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/departments/${d.id}`)}>
                {t('list.rowActions.view')}
              </DropdownMenuItem>

              <PermissionGuard permission={Permission.DEPARTMENTS_MANAGE}>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    setActiveDept(d)
                    setUpdateOpen(true)
                  }}
                >
                  {t('list.rowActions.edit')}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setActiveDept(d)
                    setAssignOpen(true)
                  }}
                >
                  {t('list.rowActions.assignHead')}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => {
                    setActiveDept(d)
                    setDeleteOpen(true)
                  }}
                >
                  {t('list.rowActions.delete')}
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('list.heading')}
        description={`${data?.total ?? 0} ${t('list.entityCount', { count: data?.total ?? 0 })}`}
        actions={
          <PermissionGuard permission={Permission.DEPARTMENTS_MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('list.addDepartmentButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <TableFilterBar
          value={filters.search}
          onChange={(val) => void setFilters({ search: val || null, page: 1 })}
          placeholder={t('list.filters.search')}
        >
          {/* Location Select filter */}
          <Select
            value={filters.locationId || 'all'}
            onValueChange={(val) => void setFilters({ locationId: val === 'all' ? null : val, page: 1 })}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t('list.filters.location')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('list.filters.location')}</SelectItem>
              {locations?.data.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Has Head Officer filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('list.filters.hasHead')}
                {filters.hasHeadOfficer && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-sm"
                  onClick={() => void setFilters({ hasHeadOfficer: 'true', page: 1 })}
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-sm"
                  onClick={() => void setFilters({ hasHeadOfficer: 'false', page: 1 })}
                >
                  No
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-sm text-foreground-muted"
                  onClick={() => void setFilters({ hasHeadOfficer: null, page: 1 })}
                >
                  All
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('list.filters.clearAll')}
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

            {filters.locationId && activeLocation && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Location: {activeLocation.name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ locationId: null, page: 1 })} />
              </Badge>
            )}

            {filters.hasHeadOfficer && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Has Head: {filters.hasHeadOfficer === 'true' ? 'Yes' : 'No'}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ hasHeadOfficer: null, page: 1 })} />
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
          onRowClick={(row: DepartmentListItem) => router.push(`/departments/${row.id}`)}
          emptyTitle={t('list.empty.title')}
          emptyMessage={hasActiveFilters ? t('list.emptyFiltered') : t('list.empty.description')}
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
        <CreateDepartmentDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {updateOpen && activeDept && (
        <UpdateDepartmentDrawer
          open={updateOpen}
          department={activeDept as any}
          onClose={() => {
            setUpdateOpen(false)
            setActiveDept(null)
          }}
        />
      )}

      {assignOpen && activeDept && (
        <AssignHeadOfficerDrawer
          open={assignOpen}
          departmentId={activeDept.id}
          currentHead={activeDept.headOfficer}
          onClose={() => {
            setAssignOpen(false)
            setActiveDept(null)
          }}
        />
      )}

      {deleteOpen && activeDept && (
        <DeleteDepartmentDialog
          open={deleteOpen}
          department={activeDept as any}
          onClose={() => {
            setDeleteOpen(false)
            setActiveDept(null)
          }}
        />
      )}
    </div>
  )
}
