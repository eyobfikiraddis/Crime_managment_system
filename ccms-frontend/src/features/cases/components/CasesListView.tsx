'use client'

import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { Plus, X, RotateCcw, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BulkActionBar } from '@shared/components/table/BulkActionBar'
import { BulkStatusUpdateDialog } from './BulkStatusUpdateDialog'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

import { useCases } from '../hooks/useCases'
import { useCrimeTypes } from '../hooks/useCrimeTypes'
import { useDepartments } from '../hooks/useDepartments'
import { useCaseColumns } from './case-columns'
import type { CaseFilters, CaseListItem, CaseStatus } from '../types/case.types'

import { PageHeader } from '@shared/components/display/PageHeader'
import { DataTable } from '@shared/components/table/DataTable'
import { TableFilterBar } from '@shared/components/table/TableFilterBar'
import { TablePagination } from '@shared/components/table/TablePagination'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { DatePicker } from '@shared/components/forms/DatePicker'
import { useAuthStore } from '@shared/stores/auth.store'
import { Permission } from '@shared/constants/permissions'

const STATUSES: CaseStatus[] = ['OPEN', 'UNDER_INVESTIGATION', 'REFERRED_TO_COURT', 'CLOSED', 'ARCHIVED']

export function CasesListView() {
  const t = useTranslations('cases')
  const router = useRouter()

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)

  const officer = useAuthStore((state) => state.officer)
  const role = useAuthStore((state) => state.role)
  const isPrivileged = role === 'ADMIN' || role === 'SUPERADMIN' || role === 'DEPT_HEAD'

  const [filterState, setFilterState] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    crimeTypeId: parseAsString.withDefault(''),
    departmentId: parseAsString.withDefault(''),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('reportedDate'),
    sortDirection: parseAsString.withDefault('desc'),
  })

  const { data: crimeTypes } = useCrimeTypes()
  const { data: departments } = useDepartments()

  // Build filters payload, scoping department for non-privileged users
  const resolvedDeptId = isPrivileged ? filterState.departmentId : (officer?.departmentId ?? '')
  
  const queryFilters: CaseFilters = {
    search: filterState.search || undefined,
    status: filterState.status.length > 0 ? (filterState.status as CaseStatus[]) : undefined,
    crimeTypeId: filterState.crimeTypeId || undefined,
    departmentId: resolvedDeptId || undefined,
    dateFrom: filterState.dateFrom || undefined,
    dateTo: filterState.dateTo || undefined,
    page: filterState.page,
    pageSize: filterState.pageSize,
    sortField: filterState.sortField as any,
    sortDirection: filterState.sortDirection as any,
  }

  const { data, isLoading } = useCases(queryFilters)

  const columns = useCaseColumns()

  const handlePaginationChange = (page: number, pageSize: number) => {
    void setFilterState({ page, pageSize })
  }

  const handleSortingChange = (sorting: any) => {
    if (sorting && sorting.length > 0) {
      const field = sorting[0].id
      const direction = sorting[0].desc ? 'desc' : 'asc'
      void setFilterState({ sortField: field, sortDirection: direction })
    } else {
      void setFilterState({ sortField: 'reportedDate', sortDirection: 'desc' })
    }
  }

  const toggleStatus = (st: string) => {
    const current = filterState.status
    const next = current.includes(st) ? current.filter((s) => s !== st) : [...current, st]
    void setFilterState({ status: next.length > 0 ? next : null, page: 1 })
  }

  const clearAllFilters = () => {
    void setFilterState({
      search: null,
      status: null,
      crimeTypeId: null,
      departmentId: null,
      dateFrom: null,
      dateTo: null,
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filterState.search ||
    filterState.status.length > 0 ||
    filterState.crimeTypeId ||
    (isPrivileged && filterState.departmentId) ||
    filterState.dateFrom ||
    filterState.dateTo
  )

  const activeCrimeType = crimeTypes?.find((ct) => ct.id === filterState.crimeTypeId)
  const activeDepartment = departments?.find((d) => d.id === filterState.departmentId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageTitle')}
        description={t('list.heading')}
        actions={
          <PermissionGuard permission={Permission.CASES_WRITE}>
            <Button asChild>
              <Link href="/cases/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('list.newCase')}
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <TableFilterBar
          value={filterState.search}
          onChange={(val) => void setFilterState({ search: val || null, page: 1 })}
          placeholder={t('list.searchPlaceholder')}
        >
          {/* Status Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('list.filterStatus')}
                {filterState.status.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filterState.status.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {STATUSES.map((st) => (
                  <label key={st} className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={filterState.status.includes(st)}
                      onCheckedChange={() => toggleStatus(st)}
                    />
                    <span className="text-sm font-medium">{t(`status.${st}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Crime Type Select */}
          <Select
            value={filterState.crimeTypeId || 'all'}
            onValueChange={(val) => void setFilterState({ crimeTypeId: val === 'all' ? null : val, page: 1 })}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t('list.filterCrimeType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('list.filterCrimeType')}</SelectItem>
              {crimeTypes?.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Department Select (scoped by role) */}
          <Select
            value={resolvedDeptId || 'all'}
            onValueChange={(val) => void setFilterState({ departmentId: val === 'all' ? null : val, page: 1 })}
            disabled={!isPrivileged}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={t('list.filterDepartment')} />
            </SelectTrigger>
            <SelectContent>
              {isPrivileged && <SelectItem value="all">{t('list.filterDepartment')}</SelectItem>}
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range DatePickers */}
          <div className="flex items-center gap-2">
            <DatePicker
              value={filterState.dateFrom ? new Date(filterState.dateFrom) : undefined}
              onChange={(date) =>
                void setFilterState({ dateFrom: date ? date.toISOString().slice(0, 10) : null, page: 1 })
              }
              placeholder="From Date"
            />
            <span className="text-foreground-muted text-xs">to</span>
            <DatePicker
              value={filterState.dateTo ? new Date(filterState.dateTo) : undefined}
              onChange={(date) =>
                void setFilterState({ dateTo: date ? date.toISOString().slice(0, 10) : null, page: 1 })
              }
              placeholder="To Date"
            />
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <Button variant="ghost" className="h-9 px-2 text-foreground-muted" onClick={clearAllFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </TableFilterBar>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-foreground-muted">Active Filters:</span>
            
            {filterState.search && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Search: "{filterState.search}"
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilterState({ search: null, page: 1 })} />
              </Badge>
            )}

            {filterState.status.map((st) => (
              <Badge key={st} variant="secondary" className="gap-1 pr-1 font-normal">
                Status: {t(`status.${st}`)}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => toggleStatus(st)} />
              </Badge>
            ))}

            {filterState.crimeTypeId && activeCrimeType && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Crime Type: {activeCrimeType.name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilterState({ crimeTypeId: null, page: 1 })} />
              </Badge>
            )}

            {isPrivileged && filterState.departmentId && activeDepartment && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Department: {activeDepartment.name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => void setFilterState({ departmentId: null, page: 1 })} />
              </Badge>
            )}

            {(filterState.dateFrom || filterState.dateTo) && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Date: {filterState.dateFrom || '*'} to {filterState.dateTo || '*'}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => void setFilterState({ dateFrom: null, dateTo: null, page: 1 })}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.keys(rowSelection).length > 0 && (
          <BulkActionBar
            selectedCount={Object.keys(rowSelection).length}
            onClearSelection={() => setRowSelection({})}
            actions={[
              {
                label: t('bulk.statusUpdate.actionLabel'),
                icon: RefreshCw,
                onClick: () => setBulkStatusOpen(true),
                requiredPermission: Permission.CASES_MANAGE,
              },
            ]}
          />
        )}

        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            pageIndex: filterState.page - 1,
            pageSize: filterState.pageSize,
          }}
          onPaginationChange={(state) => handlePaginationChange(state.pageIndex + 1, state.pageSize)}
          sorting={[{ id: filterState.sortField, desc: filterState.sortDirection === 'desc' }]}
          onSortingChange={handleSortingChange}
          onRowClick={(row: CaseListItem) => router.push(`/cases/${row.id}`)}
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection as any}
          rowSelection={rowSelection}
          emptyTitle={t('list.noResults')}
          emptyMessage={t('list.noResultsDescription')}
        />

        {data && data.total > 0 && (
          <TablePagination
            total={data.total}
            page={filterState.page}
            pageSize={filterState.pageSize}
            onChange={handlePaginationChange}
          />
        )}
      </div>

      {bulkStatusOpen && (
        <BulkStatusUpdateDialog
          open={bulkStatusOpen}
          onClose={() => {
            setBulkStatusOpen(false)
            setRowSelection({})
          }}
          caseIds={Object.keys(rowSelection).filter(id => rowSelection[id])}
        />
      )}
    </div>
  )
}
