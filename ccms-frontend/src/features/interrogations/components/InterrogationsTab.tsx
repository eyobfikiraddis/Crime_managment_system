'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { MessageSquareOff, Plus, RotateCcw, Search, SearchX, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

import { useInterrogationList } from '../hooks/useInterrogationList'
import { useInterrogationColumns } from './interrogations-columns'
import { CreateInterrogationDrawer } from './CreateInterrogationDrawer'
import { InterrogationDetailDrawer } from './InterrogationDetailDrawer'
import type { InterrogationFilters, InterrogationListItem } from '../types/interrogation.types'

interface InterrogationsTabProps {
  caseId: string
}

export function InterrogationsTab({ caseId }: InterrogationsTabProps) {
  const t = useTranslations('interrogations')
  const tErrors = useTranslations('errors')
  const permissions = useAuthStore((state) => state.permissions)
  const hasManagePermission = hasAllPermissions(permissions, [Permission.INTERROGATIONS_MANAGE])

  const [, startTransition] = useTransition()

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('interrogationDate'),
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

  const queryFilters: InterrogationFilters = useMemo(() => {
    return {
      search: filters.search || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField as any,
      sortDirection: filters.sortDirection as any,
    }
  }, [filters])

  const { data, isLoading, isError, refetch } = useInterrogationList(caseId, queryFilters)

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedInterrogationId, setSelectedInterrogationId] = useState<string | null>(null)

  const columns = useInterrogationColumns({
    onViewDetails: (id) => setSelectedInterrogationId(id),
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
        void setFilters({ sortField: 'interrogationDate', sortDirection: 'desc' })
      }
    })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    startTransition(() => {
      void setFilters({
        search: null,
        dateFrom: null,
        dateTo: null,
        page: 1,
      })
    })
  }

  const hasActiveFilters = Boolean(filters.search || filters.dateFrom || filters.dateTo)
  const isInitialLoading = isLoading && !data
  const hasResults = (data?.data.length ?? 0) > 0
  const emptyStateDescription = hasManagePermission
    ? { description: t('tab.emptyDescription') }
    : {}

  const handleRowClick = (row: InterrogationListItem) => {
    setSelectedInterrogationId(row.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tab.heading')}
        description={t('tab.entityCount', { count: data?.total ?? 0 })}
        actions={
          <PermissionGuard permission={Permission.INTERROGATIONS_MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('tab.addInterrogation')}
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
              icon={MessageSquareOff}
              title={t('tab.empty')}
              {...emptyStateDescription}
              action={
                <PermissionGuard permission={Permission.INTERROGATIONS_MANAGE}>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tab.addInterrogation')}
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
        <CreateInterrogationDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          caseId={caseId}
        />
      )}

      {selectedInterrogationId && (
        <InterrogationDetailDrawer
          interrogationId={selectedInterrogationId}
          open={Boolean(selectedInterrogationId)}
          onOpenChange={(open) => {
            if (!open) setSelectedInterrogationId(null)
          }}
          records={data?.data ?? []}
        />
      )}
    </div>
  )
}
