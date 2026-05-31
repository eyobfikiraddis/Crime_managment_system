'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { Plus, X, RotateCcw, MoreHorizontal, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { usePersonList } from '@features/personnel/hooks/usePersonList'
import type { PersonFilters, PersonListItem, PersonRole, RiskLevel } from '@features/personnel/types/personnel.types'
import { PERSON_ROLE_VARIANTS, RISK_LEVEL_VARIANTS, getFullName } from '@features/personnel/utils/personnelUtils'

import { PageHeader } from '@shared/components/display/PageHeader'
import { DataTable } from '@shared/components/table/DataTable'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { Permission } from '@shared/constants/permissions'
import { SlideOverDrawer } from '@shared/components/modals/SlideOverDrawer'
import CreatePersonDrawer from './CreatePersonDrawer'

const PERSON_ROLES: PersonRole[] = ['SUSPECT', 'VICTIM', 'WITNESS']
const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH']

export function PersonsList() {
  const t = useTranslations('personnel')
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    riskLevel: parseAsArrayOf(parseAsString).withDefault([]),
    isProtectedWitness: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('lastName'),
    sortDirection: parseAsString.withDefault('asc'),
  })

  const queryFilters: PersonFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
  }
  if (filters.search) queryFilters.search = filters.search
  if (filters.roles.length > 0) queryFilters.roles = filters.roles as PersonRole[]
  if (filters.riskLevel.length > 0) queryFilters.riskLevel = filters.riskLevel as RiskLevel[]
  if (filters.isProtectedWitness === 'true') {
    queryFilters.isProtectedWitness = true
  } else if (filters.isProtectedWitness === 'false') {
    queryFilters.isProtectedWitness = false
  }
  if (filters.sortField) queryFilters.sortField = filters.sortField as any
  if (filters.sortDirection) queryFilters.sortDirection = filters.sortDirection as any

  const { data, isLoading } = usePersonList(queryFilters)

  const handlePaginationChange = (page: number, pageSize: number) => {
    void setFilters({ page, pageSize })
  }

  const handleSortingChange = (sorting: any) => {
    if (sorting && sorting.length > 0) {
      const field = sorting[0].id
      const direction = sorting[0].desc ? 'desc' : 'asc'
      void setFilters({ sortField: field, sortDirection: direction })
    } else {
      void setFilters({ sortField: 'lastName', sortDirection: 'asc' })
    }
  }

  const toggleRole = (role: PersonRole) => {
    const current = filters.roles
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
    void setFilters({ roles: next.length > 0 ? next : null, page: 1 })
  }

  const toggleRiskLevel = (risk: RiskLevel) => {
    const current = filters.riskLevel
    const next = current.includes(risk) ? current.filter((r) => r !== risk) : [...current, risk]
    void setFilters({ riskLevel: next.length > 0 ? next : null, page: 1 })
  }

  const clearAllFilters = () => {
    void setFilters({
      search: null,
      roles: null,
      riskLevel: null,
      isProtectedWitness: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.roles.length > 0 ||
    filters.riskLevel.length > 0 ||
    filters.isProtectedWitness !== ''
  )

  const columns: ColumnDef<PersonListItem>[] = [
    {
      accessorKey: 'name',
      header: t('persons.list.columns.name'),
      cell: ({ row }) => {
        const p = row.original
        const fullName = getFullName(p.firstName, p.lastName)
        return (
          <Link
            href={`/personnel/persons/${p.id}`}
            className="font-medium text-primary hover:underline text-sm min-w-[160px] block"
          >
            {fullName}
          </Link>
        )
      },
      enableSorting: true,
      id: 'lastName', // bound to backend sort field
    },
    {
      accessorKey: 'nationalIdMasked',
      header: t('persons.list.columns.nationalId'),
      cell: ({ row }) => {
        const val = row.original.nationalIdMasked
        return <span className="text-sm font-mono text-foreground-muted min-w-[130px] block">{val ?? '—'}</span>
      },
      enableSorting: false,
    },
    {
      accessorKey: 'roles',
      header: t('persons.list.columns.roles'),
      cell: ({ row }) => {
        const roles = row.original.roles || []
        // Sort roles to guarantee order: SUSPECT, VICTIM, WITNESS
        const sortedRoles = [...roles].sort((a, b) => {
          const order = { SUSPECT: 1, VICTIM: 2, WITNESS: 3 }
          return (order[a] ?? 99) - (order[b] ?? 99)
        })

        return (
          <div className="flex flex-wrap gap-1.5 min-w-[180px]">
            {sortedRoles.length > 0 ? (
              sortedRoles.map((role) => (
                <StatusBadge
                  key={role}
                  status={t(`persons.role.${role}`)}
                  variant={PERSON_ROLE_VARIANTS[role]}
                />
              ))
            ) : (
              <span className="text-foreground-muted">—</span>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'riskLevel',
      header: t('persons.list.columns.riskLevel'),
      cell: ({ row }) => {
        const risk = row.original.riskLevel
        if (!risk) return <span className="text-foreground-muted text-sm min-w-[100px] block">—</span>
        return (
          <div className="min-w-[100px] flex">
            <StatusBadge
              status={t(`persons.riskLevel.${risk}`)}
              variant={RISK_LEVEL_VARIANTS[risk]}
            />
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'isProtectedWitness',
      header: t('persons.list.columns.protected'),
      cell: ({ row }) => {
        const protectedWitness = row.original.isProtectedWitness
        return (
          <div className="min-w-[110px]">
            {protectedWitness ? (
              <StatusBadge
                status={t('persons.list.protectedYes')}
                variant="accent"
              />
            ) : null}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: t('persons.list.columns.createdAt'),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return <span className="text-sm text-foreground-muted min-w-[100px] block">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/personnel/persons/${row.original.id}`)}>
              {t('persons.list.rowActions.view')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('persons.list.heading')}
        description={`${data?.total ?? 0} ${t('persons.list.entityCount', { count: data?.total ?? 0 })}`}
        actions={
          <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('persons.list.addPersonButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <TableFilterBar
          value={filters.search}
          onChange={(val) => void setFilters({ search: val || null, page: 1 })}
          placeholder={t('persons.list.filters.search')}
        >
          {/* Roles Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('persons.list.filters.roles')}
                {filters.roles.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.roles.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {PERSON_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={filters.roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <span className="text-sm font-medium">{t(`persons.role.${role}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Risk Level Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('persons.list.filters.riskLevel')}
                {filters.riskLevel.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.riskLevel.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {RISK_LEVELS.map((risk) => (
                  <label key={risk} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={filters.riskLevel.includes(risk)}
                      onCheckedChange={() => toggleRiskLevel(risk)}
                    />
                    <span className="text-sm font-medium">{t(`persons.riskLevel.${risk}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Protected Witness Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('persons.list.filters.protectedWitness')}
                {filters.isProtectedWitness !== '' && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={filters.isProtectedWitness === 'true'}
                    onCheckedChange={(checked) => {
                      void setFilters({ isProtectedWitness: checked ? 'true' : null, page: 1 })
                    }}
                  />
                  <span className="text-sm font-medium">{t('persons.list.protectedYes')}</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Button */}
          {hasActiveFilters && (
            <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('persons.list.filters.clearAll')}
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

            {filters.roles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1 pr-1 font-normal">
                Role: {t(`persons.role.${role}`)}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleRole(role as PersonRole)} />
              </Badge>
            ))}

            {filters.riskLevel.map((risk) => (
              <Badge key={risk} variant="secondary" className="gap-1 pr-1 font-normal">
                Risk: {t(`persons.riskLevel.${risk}`)}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleRiskLevel(risk as RiskLevel)} />
              </Badge>
            ))}

            {filters.isProtectedWitness === 'true' && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Protected Witness: Yes
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilters({ isProtectedWitness: null, page: 1 })} />
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
          pagination={{
            pageIndex: filters.page - 1,
            pageSize: filters.pageSize,
          }}
          onPaginationChange={(state) => handlePaginationChange(state.pageIndex + 1, state.pageSize)}
          sorting={[{ id: filters.sortField, desc: filters.sortDirection === 'desc' }]}
          onSortingChange={handleSortingChange}
          onRowClick={(row: PersonListItem) => router.push(`/personnel/persons/${row.id}`)}
          emptyTitle={t('persons.list.empty.title')}
          emptyMessage={hasActiveFilters ? t('persons.list.emptyFiltered') : t('persons.list.empty.description')}
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
        <CreatePersonDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  )
}
