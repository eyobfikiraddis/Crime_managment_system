'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQueryStates, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs'
import { MoreHorizontal, RotateCcw, Search, SearchX, Scale, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PageHeader } from '@/shared/components/display/PageHeader'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { DataTable } from '@/shared/components/table/DataTable'
import { TableFilterBar } from '@/shared/components/table/TableFilterBar'
import { TablePagination } from '@/shared/components/table/TablePagination'
import { TableSkeleton } from '@/shared/components/table/TableSkeleton'
import { DatePicker } from '@/shared/components/forms/DatePicker'

import { useCourtCaseList } from '../hooks/useCourtCaseList'
import {
  CourtCaseStatus,
  type CourtCaseFilters,
  type CourtCaseSummary,
} from '../types/legal.types'
import { COURT_CASE_STATUS_VARIANTS } from '../utils/chargeUtils'

const STATUS_OPTIONS = Object.values(CourtCaseStatus)

export function CourtCasesList() {
  const t = useTranslations('legal')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('filedAt'),
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

  const queryFilters: CourtCaseFilters = useMemo(() => {
    return {
      search: filters.search || undefined,
      status:
        filters.status.length > 0
          ? (filters.status as CourtCaseStatus[])
          : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField as any,
      sortDirection: filters.sortDirection as any,
    }
  }, [filters])

  const { data, isLoading, isError, refetch } = useCourtCaseList(queryFilters)

  const hasActiveFilters = Boolean(
    filters.search || filters.status.length > 0 || filters.dateFrom || filters.dateTo,
  )
  const isInitialLoading = isLoading && !data
  const hasResults = (data?.data.length ?? 0) > 0

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
        void setFilters({ sortField: 'filedAt', sortDirection: 'desc' })
      }
    })
  }

  const toggleStatus = (status: string) => {
    startTransition(() => {
      const current = filters.status
      const next = current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
      void setFilters({ status: next.length > 0 ? next : null, page: 1 })
    })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    startTransition(() => {
      void setFilters({
        search: null,
        status: null,
        dateFrom: null,
        dateTo: null,
        page: 1,
      })
    })
  }

  const handleRowClick = (row: CourtCaseSummary) => {
    router.push(`/cases/${row.investigationCaseId}/legal`)
  }

  const columns = useMemo<ColumnDef<CourtCaseSummary>[]>(() => {
    return [
      {
        accessorKey: 'courtCaseNumber',
        header: t('courtCasesList.columns.courtCaseNumber'),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-[var(--color-primary)]">
            {row.original.courtCaseNumber}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'investigationCaseTitle',
        header: t('courtCasesList.columns.investigationCase'),
        cell: ({ row }) => (
          <span className="truncate max-w-[220px] block">{row.original.investigationCaseTitle}</span>
        ),
      },
      {
        accessorKey: 'court',
        header: t('courtCasesList.columns.court'),
        cell: ({ row }) => (
          <span className="truncate max-w-[180px] block">{row.original.court}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('courtCasesList.columns.status'),
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <StatusBadge
              status={t(`courtCase.status.${status}`)}
              variant={COURT_CASE_STATUS_VARIANTS[status] ?? 'muted'}
              className="w-[110px] text-center"
            />
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'outcome',
        header: t('courtCasesList.columns.outcome'),
        cell: ({ row }) => {
          const outcome = row.original.outcome
          if (!outcome) return <span className="text-foreground-muted">—</span>
          return (
            <StatusBadge
              status={t(`courtCase.outcome.${outcome}`)}
              variant="muted"
              className="w-[110px] text-center"
            />
          )
        },
      },
      {
        accessorKey: 'filedAt',
        header: t('courtCasesList.columns.filedAt'),
        cell: ({ row }) => (
          <span>{format(new Date(row.original.filedAt), 'dd MMM yyyy')}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'nextHearingDate',
        header: t('courtCasesList.columns.nextHearing'),
        cell: ({ row }) => (
          <span>
            {row.original.nextHearingDate
              ? format(new Date(row.original.nextHearingDate), 'dd MMM yyyy')
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'chargeCount',
        header: t('courtCasesList.columns.chargeCount'),
        cell: ({ row }) => <span>{row.original.chargeCount}</span>,
      },
      {
        id: 'actions',
        header: t('courtCasesList.columns.actions'),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/cases/${row.original.investigationCaseId}/legal`)
                }
              >
                {t('courtCasesList.rowActions.viewCase')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ]
  }, [router, t])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('courtCasesList.pageTitle')}
        description={t('courtCasesList.entityCount', { count: data?.total ?? 0 })}
      />

      <div className="space-y-4">
        <TableFilterBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder={t('courtCasesList.filters.search')}
          icon={Search}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('courtCasesList.filters.status')}
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.status.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {STATUS_OPTIONS.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="text-sm font-medium">{t(`courtCase.status.${status}`)}</span>
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
              placeholder={t('courtCasesList.filters.dateRange')}
            />
            <span className="text-foreground-muted text-xs">to</span>
            <DatePicker
              value={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onChange={(date) =>
                startTransition(() => {
                  void setFilters({ dateTo: date ? date.toISOString().slice(0, 10) : null, page: 1 })
                })
              }
              placeholder={t('courtCasesList.filters.dateRange')}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="h-9 px-2 text-foreground-muted"
              onClick={clearAllFilters}
            >
              <RotateCcw className="mr-2 size-4" />
              {t('courtCasesList.filters.clearAll')}
            </Button>
          )}
        </TableFilterBar>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {filters.search && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {filters.search}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => {
                    setSearchValue('')
                    void setFilters({ search: null, page: 1 })
                  }}
                />
              </Badge>
            )}

            {filters.status.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1 pr-1 font-normal">
                {t(`courtCase.status.${status}`)}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleStatus(status)}
                />
              </Badge>
            ))}

            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {filters.dateFrom || '*'} to {filters.dateTo || '*'}
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
          <TableSkeleton columns={9} />
        ) : !hasResults ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title={t('courtCasesList.emptyFiltered')}
            />
          ) : (
            <EmptyState
              icon={Scale}
              title={t('courtCasesList.empty.title')}
              description={t('courtCasesList.empty.description')}
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
    </div>
  )
}
