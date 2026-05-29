'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { Plus, RotateCcw, Search, SearchX, UserX, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/display/PageHeader'
import { DataTable } from '@/shared/components/table/DataTable'
import { TableFilterBar } from '@/shared/components/table/TableFilterBar'
import { TablePagination } from '@/shared/components/table/TablePagination'
import { TableSkeleton } from '@/shared/components/table/TableSkeleton'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { Permission } from '@/shared/constants/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'
import { hasAllPermissions } from '@/shared/permissions'

import { useArrestList } from '../hooks/useArrestList'
import { useArrestColumns } from './arrests-columns'
import { CreateArrestDrawer } from './CreateArrestDrawer'
import { ArrestDetailDrawer } from './ArrestDetailDrawer'
import { UpdateArrestDrawer } from './UpdateArrestDrawer'
import { DetentionStatus, type ArrestFilters, type ArrestListItem } from '../types/arrest.types'

interface ArrestsTabProps {
  caseId: string
}

const DETENTION_STATUSES = Object.values(DetentionStatus)

export function ArrestsTab({ caseId }: ArrestsTabProps) {
  const t = useTranslations('arrests')
  const tErrors = useTranslations('errors')
  const permissions = useAuthStore((state) => state.permissions)
  const hasManagePermission = hasAllPermissions(permissions, [Permission.ARRESTS_MANAGE])

  const [, startTransition] = useTransition()

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    detentionStatus: parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('arrestDate'),
    sortDirection: parseAsString.withDefault('desc'),
  })

  const [searchValue, setSearchValue] = useState(filters.search)

  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchValue === filters.search) return
      startTransition(() => {
        void setFilters({ search: searchValue || null, page: 1 })
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [filters.search, searchValue, setFilters, startTransition])

  const queryFilters: ArrestFilters = useMemo(() => {
    return {
      search: filters.search || undefined,
      detentionStatus:
        filters.detentionStatus.length > 0
          ? (filters.detentionStatus as DetentionStatus[])
          : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField as any,
      sortDirection: filters.sortDirection as any,
    }
  }, [filters])

  const { data, isLoading, isError, refetch } = useArrestList(caseId, queryFilters)

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedArrestId, setSelectedArrestId] = useState<string | null>(null)
  const [updateArrestId, setUpdateArrestId] = useState<string | null>(null)

  const columns = useArrestColumns({
    caseId,
    onViewDetails: (id) => setSelectedArrestId(id),
    onUpdateStatus: (id) => {
      setUpdateArrestId(id)
      setSelectedArrestId(null)
    },
  })

  const handlePaginationChange = (page: number, pageSize: number) => {
    startTransition(() => {
      void setFilters({ page, pageSize })
    })
  }

  const handleSortingChange = (sorting: any) => {
    startTransition(() => {
      if (sorting && sorting.length > 0) {
        const field = sorting[0].id
        const direction = sorting[0].desc ? 'desc' : 'asc'
        void setFilters({ sortField: field, sortDirection: direction })
      } else {
        void setFilters({ sortField: 'arrestDate', sortDirection: 'desc' })
      }
    })
  }

  const toggleDetentionStatus = (status: string) => {
    startTransition(() => {
      const current = filters.detentionStatus
      const next = current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
      void setFilters({ detentionStatus: next.length > 0 ? next : null, page: 1 })
    })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    startTransition(() => {
      void setFilters({
        search: null,
        detentionStatus: null,
        dateFrom: null,
        dateTo: null,
        page: 1,
      })
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.detentionStatus.length > 0 ||
      filters.dateFrom ||
      filters.dateTo,
  )

  const isInitialLoading = isLoading && !data
  const hasResults = (data?.data.length ?? 0) > 0
  const emptyStateDescription = hasManagePermission
    ? { description: t('tab.emptyDescription') }
    : {}

  const handleRowClick = (row: ArrestListItem) => {
    setSelectedArrestId(row.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tab.heading')}
        description={t('tab.entityCount', { count: data?.total ?? 0 })}
        actions={
          <PermissionGuard permission={Permission.ARRESTS_MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('tab.recordArrest')}
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-4">
        <TableFilterBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder={t('tab.filters.search')}
          icon={Search}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('tab.filters.detentionStatus')}
                {filters.detentionStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.detentionStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {DETENTION_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.detentionStatus.includes(status)}
                      onCheckedChange={() => toggleDetentionStatus(status)}
                    />
                    <span className="text-sm font-medium">{t(`detentionStatus.${status}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <DatePicker
              value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onChange={(date) =>
                startTransition(() => {
                  void setFilters({ dateFrom: date ? date.toISOString().slice(0, 10) : null, page: 1 })
                })
              }
              placeholder={t('tab.filters.fromDate')}
            />
            <span className="text-foreground-muted text-xs">
              {t('tab.filters.rangeSeparator')}
            </span>
            <DatePicker
              value={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onChange={(date) =>
                startTransition(() => {
                  void setFilters({ dateTo: date ? date.toISOString().slice(0, 10) : null, page: 1 })
                })
              }
              placeholder={t('tab.filters.toDate')}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="h-9 px-2 text-foreground-muted"
              onClick={clearAllFilters}
            >
              <RotateCcw className="mr-2 size-4" />
              {t('tab.filters.clearAll')}
            </Button>
          )}
        </TableFilterBar>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-foreground-muted">{t('tab.filters.activeLabel')}</span>

            {filters.search && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {t('tab.filters.searchChip', { value: filters.search })}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => {
                    setSearchValue('')
                    void setFilters({ search: null, page: 1 })
                  }}
                />
              </Badge>
            )}

            {filters.detentionStatus.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1 pr-1 font-normal">
                {t(`detentionStatus.${status}`)}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleDetentionStatus(status)}
                />
              </Badge>
            ))}

            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {t('tab.filters.dateChip', {
                  from: filters.dateFrom || '*',
                  to: filters.dateTo || '*',
                })}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => void setFilters({ dateFrom: null, dateTo: null, page: 1 })}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isError ? (
          <ErrorState
            title={tErrors('pages.global.title')}
            description={tErrors('api.generic')}
            retry={() => void refetch()}
            retryLabel={tErrors('pages.global.action')}
          />
        ) : isInitialLoading ? (
          <TableSkeleton columns={8} />
        ) : !hasResults ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title={t('tab.emptyFiltered')}
              action={
                <Button variant="link" onClick={clearAllFilters}>
                  {t('tab.filters.clearAll')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UserX}
              title={t('tab.empty')}
              {...emptyStateDescription}
              action={
                <PermissionGuard permission={Permission.ARRESTS_MANAGE}>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tab.recordArrest')}
                  </Button>
                </PermissionGuard>
              }
            />
          )
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              pageIndex: filters.page - 1,
              pageSize: filters.pageSize,
            }}
            onPaginationChange={(state) =>
              handlePaginationChange(state.pageIndex + 1, state.pageSize)
            }
            sorting={[{ id: filters.sortField, desc: filters.sortDirection === 'desc' }]}
            onSortingChange={handleSortingChange}
            onRowClick={handleRowClick}
          />
        )}

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
        <CreateArrestDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          caseId={caseId}
        />
      )}

      {selectedArrestId && (
        <ArrestDetailDrawer
          caseId={caseId}
          arrestId={selectedArrestId}
          open={Boolean(selectedArrestId)}
          onOpenChange={(open) => {
            if (!open) setSelectedArrestId(null)
          }}
          onUpdateStatus={(id) => {
            setUpdateArrestId(id)
            setSelectedArrestId(null)
          }}
        />
      )}

      {updateArrestId && (
        <UpdateArrestDrawer
          caseId={caseId}
          arrestId={updateArrestId}
          open={Boolean(updateArrestId)}
          onOpenChange={(open) => {
            if (!open) setUpdateArrestId(null)
          }}
        />
      )}
    </div>
  )
}
