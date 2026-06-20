'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { Plus, X, RotateCcw, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

import { useOfficerList } from '@features/personnel/hooks/useOfficerList'
import type { OfficerFilters, OfficerListItem, OfficerRole, OfficerStatus } from '@features/personnel/types/personnel.types'
import { OFFICER_ROLE_VARIANTS, OFFICER_STATUS_VARIANTS } from '@features/personnel/utils/personnelUtils'
import { getDepartments } from '@services/domain/departments.service'

import { PageHeader } from '@shared/components/display/PageHeader'
import { DataTable } from '@shared/components/table/DataTable'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Permission } from '@shared/constants/permissions'
import { useAuthStore } from '@shared/stores/auth.store'

import { ActivateOfficerDialog } from './ActivateOfficerDialog'
import { DeactivateOfficerDialog } from './DeactivateOfficerDialog'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import CreateOfficerDrawer from './CreateOfficerDrawer'

const OFFICER_ROLES: OfficerRole[] = ['INVESTIGATOR', 'FORENSIC', 'LEGAL_OFFICER', 'DEPT_HEAD', 'ADMIN', 'SUPERADMIN']
const OFFICER_STATUSES: OfficerStatus[] = ['ACTIVE', 'INACTIVE']

export function OfficersList() {
  const t = useTranslations('personnel')
  const router = useRouter()
  const permissions = useAuthStore((state) => state.permissions)
  const isManage = permissions.includes(Permission.PERSONNEL_MANAGE)

  const [createOpen, setCreateOpen] = useState(false)
  const [activeOfficer, setActiveOfficer] = useState<OfficerListItem | null>(null)
  const [activateOpen, setActivateOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    role: parseAsArrayOf(parseAsString).withDefault([]),
    departmentId: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('badgeNumber'),
    sortDirection: parseAsString.withDefault('asc'),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: () => getDepartments({ pageSize: 100 }).then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  })

  const queryFilters: OfficerFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
  }
  if (filters.search) queryFilters.search = filters.search
  if (filters.status.length > 0) queryFilters.status = filters.status as OfficerStatus[]
  if (filters.role.length > 0) queryFilters.role = filters.role as OfficerRole[]
  if (filters.departmentId) queryFilters.departmentId = filters.departmentId
  if (filters.sortField) queryFilters.sortField = filters.sortField as any
  if (filters.sortDirection) queryFilters.sortDirection = filters.sortDirection as any

  const { data, isLoading } = useOfficerList(queryFilters)

  const handlePaginationChange = (page: number, pageSize: number) => {
    void setFilters({ page, pageSize })
  }

  const handleSortingChange = (sorting: any) => {
    if (sorting && sorting.length > 0) {
      const field = sorting[0].id
      const direction = sorting[0].desc ? 'desc' : 'asc'
      void setFilters({ sortField: field, sortDirection: direction })
    } else {
      void setFilters({ sortField: 'badgeNumber', sortDirection: 'asc' })
    }
  }

  const toggleStatus = (st: OfficerStatus) => {
    const current = filters.status
    const next = current.includes(st) ? current.filter((s) => s !== st) : [...current, st]
    void setFilters({ status: next.length > 0 ? next : null, page: 1 })
  }

  const toggleRole = (rl: OfficerRole) => {
    const current = filters.role
    const next = current.includes(rl) ? current.filter((r) => r !== rl) : [...current, rl]
    void setFilters({ role: next.length > 0 ? next : null, page: 1 })
  }

  const clearAllFilters = () => {
    void setFilters({
      search: null,
      status: null,
      role: null,
      departmentId: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status.length > 0 ||
    filters.role.length > 0 ||
    filters.departmentId
  )

  const activeDepartment = departments?.find((d) => d.id === filters.departmentId)

  const columns: ColumnDef<OfficerListItem>[] = [
    {
      accessorKey: 'badgeNumber',
      header: t('officers.list.columns.badgeNumber'),
      cell: ({ row }) => {
        const o = row.original
        const isInactive = o.status === 'INACTIVE'
        return (
          <Link
            href={`/personnel/officers/${o.id}`}
            className={`font-mono text-xs font-semibold text-primary hover:underline min-w-[90px] block ${isInactive ? 'opacity-60' : ''}`}
          >
            {o.badgeNumber}
          </Link>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'name',
      header: t('officers.list.columns.name'),
      cell: ({ row }) => {
        const o = row.original
        const fullName = `${o.firstName} ${o.lastName}`
        const isInactive = o.status === 'INACTIVE'
        return (
          <span className={`text-sm font-medium text-foreground min-w-[160px] block ${isInactive ? 'opacity-60' : ''}`}>
            {fullName}
          </span>
        )
      },
      enableSorting: true,
      id: 'firstName',
    },
    {
      accessorKey: 'role',
      header: t('officers.list.columns.role'),
      cell: ({ row }) => {
        const o = row.original
        const isInactive = o.status === 'INACTIVE'
        return (
          <div className={`min-w-[140px] flex ${isInactive ? 'opacity-60' : ''}`}>
            <StatusBadge
              status={t(`officers.officerRole.${o.role}`)}
              variant={OFFICER_ROLE_VARIANTS[o.role]}
            />
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'departmentName',
      header: t('officers.list.columns.department'),
      cell: ({ row }) => {
        const o = row.original
        const isInactive = o.status === 'INACTIVE'
        return (
          <span className={`text-sm text-foreground min-w-[150px] block ${isInactive ? 'opacity-60' : ''}`}>
            {o.departmentName}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: t('officers.list.columns.status'),
      cell: ({ row }) => {
        const o = row.original
        const isInactive = o.status === 'INACTIVE'
        return (
          <div className="min-w-[100px] flex">
            <StatusBadge
              status={t(`officers.officerStatus.${o.status}`)}
              variant={OFFICER_STATUS_VARIANTS[o.status]}
              className={isInactive ? 'opacity-60' : ''}
            />
          </div>
        )
      },
      enableSorting: true,
    },
    ...(isManage
      ? [
          {
            accessorKey: 'lastActivityAt',
            header: t('officers.list.columns.lastActivity'),
            cell: ({ row }: { row: { original: OfficerListItem } }) => {
              const o = row.original
              const dateVal = o.lastActivityAt
              const isInactive = o.status === 'INACTIVE'
              return (
                <span className={`text-sm text-foreground-muted min-w-[120px] block ${isInactive ? 'opacity-60' : ''}`}>
                  {dateVal
                    ? formatDistanceToNow(new Date(dateVal), { addSuffix: true })
                    : t('officers.list.lastActivityNever')}
                </span>
              )
            },
            enableSorting: true,
          },
        ]
      : []),
    {
      id: 'actions',
      cell: ({ row }) => {
        const o = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/personnel/officers/${o.id}`)}>
                {t('officers.list.rowActions.view')}
              </DropdownMenuItem>

              <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
                <DropdownMenuSeparator />

                {o.status === 'INACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveOfficer(o)
                      setActivateOpen(true)
                    }}
                  >
                    {t('officers.list.rowActions.activate')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => {
                      setActiveOfficer(o)
                      setDeactivateOpen(true)
                    }}
                  >
                    {t('officers.list.rowActions.deactivate')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => {
                    setActiveOfficer(o)
                    setResetOpen(true)
                  }}
                >
                  {t('officers.list.rowActions.resetPassword')}
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
        title={t('officers.list.heading')}
        description={`${data?.total ?? 0} ${t('officers.list.entityCount', { count: data?.total ?? 0 })}`}
        actions={
          <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('officers.list.addOfficerButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <TableFilterBar
          value={filters.search}
          onChange={(val) => void setFilters({ search: val || null, page: 1 })}
          placeholder={t('officers.list.filters.search')}
        >
          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('officers.list.filters.status')}
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.status.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {OFFILER_STATUSES_MAPPED(toggleStatus, filters.status, t)}
              </div>
            </PopoverContent>
          </Popover>

          {/* Role Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('officers.list.filters.role')}
                {filters.role.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.role.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {OFFICER_ROLES.map((rl) => (
                  <label key={rl} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={filters.role.includes(rl)}
                      onCheckedChange={() => toggleRole(rl)}
                    />
                    <span className="text-sm font-medium">{t(`officers.officerRole.${rl}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Department Select (scoped by permission) */}
          <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
            <Select
              value={filters.departmentId || 'all'}
              onValueChange={(val) => void setFilters({ departmentId: val === 'all' ? null : val, page: 1 })}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder={t('officers.list.filters.department')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('officers.list.filters.department')}</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionGuard>

          {/* Clear Button */}
          {hasActiveFilters && (
            <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('officers.list.filters.clearAll')}
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

            {filters.status.map((st) => (
              <Badge key={st} variant="secondary" className="gap-1 pr-1 font-normal">
                Status: {t(`officers.officerStatus.${st}`)}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleStatus(st as OfficerStatus)} />
              </Badge>
            ))}

            {filters.role.map((rl) => (
              <Badge key={rl} variant="secondary" className="gap-1 pr-1 font-normal">
                Role: {t(`officers.officerRole.${rl}`)}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleRole(rl as OfficerRole)} />
              </Badge>
            ))}

            {filters.departmentId && activeDepartment && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Department: {activeDepartment.name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ departmentId: null, page: 1 })} />
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
          onRowClick={(row: OfficerListItem) => router.push(`/personnel/officers/${row.id}`)}
          emptyTitle={t('officers.list.empty.title')}
          emptyMessage={hasActiveFilters ? t('officers.list.emptyFiltered') : t('officers.list.empty.description')}
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
        <CreateOfficerDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {activateOpen && activeOfficer && (
        <ActivateOfficerDialog
          open={activateOpen}
          officer={activeOfficer}
          onClose={() => {
            setActivateOpen(false)
            setActiveOfficer(null)
          }}
        />
      )}

      {deactivateOpen && activeOfficer && (
        <DeactivateOfficerDialog
          open={deactivateOpen}
          officer={activeOfficer}
          onClose={() => {
            setDeactivateOpen(false)
            setActiveOfficer(null)
          }}
        />
      )}

      {resetOpen && activeOfficer && (
        <ResetPasswordDialog
          open={resetOpen}
          officer={activeOfficer}
          onClose={() => {
            setResetOpen(false)
            setActiveOfficer(null)
          }}
        />
      )}
    </div>
  )
}

function OFFILER_STATUSES_MAPPED(toggleStatus: (st: OfficerStatus) => void, activeStatuses: string[], t: any) {
  return OFFICER_STATUSES.map((st) => (
    <label key={st} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
      <Checkbox
        checked={activeStatuses.includes(st)}
        onCheckedChange={() => toggleStatus(st)}
      />
      <span className="text-sm font-medium">{t(`officers.officerStatus.${st}`)}</span>
    </label>
  ))
}

export default OfficersList
