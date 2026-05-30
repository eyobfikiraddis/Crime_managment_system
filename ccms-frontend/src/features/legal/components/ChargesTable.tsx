'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs'
import {
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SectionHeader } from '@/shared/components/display/SectionHeader'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { DataTable } from '@/shared/components/table/DataTable'
import { TableFilterBar } from '@/shared/components/table/TableFilterBar'
import { TableEmptyState } from '@/shared/components/table/TableEmptyState'
import { TablePagination } from '@/shared/components/table/TablePagination'
import { TableSkeleton } from '@/shared/components/table/TableSkeleton'
import { Permission } from '@/shared/constants/permissions'
import { hasAllPermissions } from '@/shared/permissions'
import { useAuthStore } from '@/shared/stores/auth.store'

import { useChargeList } from '../hooks/useChargeList'
import { CHARGE_STATUS_VARIANTS, isChargeTerminal } from '../utils/chargeUtils'
import { ChargeStatus, type ChargeFilters, type ChargeListItem } from '../types/legal.types'

interface ChargesTableProps {
  courtCaseId: string
  caseId: string
  onAddCharge: () => void
  onUpdateStatus: (charge: ChargeListItem) => void
  onDropCharge: (charge: ChargeListItem) => void
  onViewSentence: (charge: ChargeListItem) => void
}

const STATUS_OPTIONS = Object.values(ChargeStatus)

export function ChargesTable({
  courtCaseId,
  caseId,
  onAddCharge,
  onUpdateStatus,
  onDropCharge,
  onViewSentence,
}: ChargesTableProps) {
  const t = useTranslations('legal')
  const tErrors = useTranslations('errors')
  const [, startTransition] = useTransition()
  const permissions = useAuthStore((state) => state.permissions)
  const canManage = hasAllPermissions(permissions, [Permission.LEGAL_MANAGE])

  const [filters, setFilters] = useQueryStates({
    chargeSearch: parseAsString.withDefault(''),
    chargeStatus: parseAsArrayOf(parseAsString).withDefault([]),
    chargePage: parseAsInteger.withDefault(1),
    chargePageSize: parseAsInteger.withDefault(25),
    chargeSortField: parseAsString.withDefault('filedAt'),
    chargeSortDirection: parseAsString.withDefault('desc'),
  })

  const [searchValue, setSearchValue] = useState(filters.chargeSearch)

  useEffect(() => {
    setSearchValue(filters.chargeSearch)
  }, [filters.chargeSearch])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchValue === filters.chargeSearch) return
      startTransition(() => {
        void setFilters({ chargeSearch: searchValue || null, chargePage: 1 })
      })
    }, 300)
    return () => clearTimeout(handle)
  }, [filters.chargeSearch, searchValue, setFilters, startTransition])

  const queryFilters: ChargeFilters = useMemo(() => {
    return {
      search: filters.chargeSearch || undefined,
      status:
        filters.chargeStatus.length > 0
          ? (filters.chargeStatus as ChargeStatus[])
          : undefined,
      page: filters.chargePage,
      pageSize: filters.chargePageSize,
      sortField: filters.chargeSortField as any,
      sortDirection: filters.chargeSortDirection as any,
    }
  }, [filters])

  const { data, isLoading, isError, refetch } = useChargeList(
    courtCaseId,
    caseId,
    queryFilters,
  )

  const hasActiveFilters = Boolean(
    filters.chargeSearch || filters.chargeStatus.length > 0,
  )
  const isInitialLoading = isLoading && !data
  const hasResults = (data?.data.length ?? 0) > 0

  const handlePaginationChange = (page: number, pageSize: number) => {
    startTransition(() => {
      void setFilters({ chargePage: page, chargePageSize: pageSize })
    })
  }

  const handleSortingChange = (sorting: any) => {
    startTransition(() => {
      if (sorting && sorting.length > 0) {
        const field = sorting[0].id
        const direction = sorting[0].desc ? 'desc' : 'asc'
        void setFilters({ chargeSortField: field, chargeSortDirection: direction })
      } else {
        void setFilters({ chargeSortField: 'filedAt', chargeSortDirection: 'desc' })
      }
    })
  }

  const toggleStatus = (status: string) => {
    startTransition(() => {
      const current = filters.chargeStatus
      const next = current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
      void setFilters({ chargeStatus: next.length > 0 ? next : null, chargePage: 1 })
    })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    startTransition(() => {
      void setFilters({ chargeSearch: null, chargeStatus: null, chargePage: 1 })
    })
  }

  const handleRowClick = (row: ChargeListItem) => {
    if (row.status === ChargeStatus.CONVICTED) {
      onViewSentence(row)
      return
    }
    if (!isChargeTerminal(row.status)) {
      onUpdateStatus(row)
    }
  }

  const columns = useMemo<ColumnDef<ChargeListItem>[]>(() => {
    return [
      {
        accessorKey: 'suspect',
        header: t('charges.columns.suspect'),
        cell: ({ row }) => {
          const suspect = row.original.suspect
          return <span>{`${suspect.firstName} ${suspect.lastName}`}</span>
        },
      },
      {
        accessorKey: 'crimeType',
        header: t('charges.columns.crimeType'),
        cell: ({ row }) => <span>{row.original.crimeType.name}</span>,
      },
      {
        accessorKey: 'status',
        header: t('charges.columns.status'),
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <StatusBadge
              status={t(`charges.status.${status}`)}
              variant={CHARGE_STATUS_VARIANTS[status] ?? 'muted'}
              className="w-[110px] text-center"
            />
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'filedAt',
        header: t('charges.columns.filedAt'),
        cell: ({ row }) => (
          <span>{format(new Date(row.original.filedAt), 'dd MMM yyyy')}</span>
        ),
        enableSorting: true,
      },
      {
        id: 'sentence',
        header: t('charges.columns.sentence'),
        cell: ({ row }) => {
          const charge = row.original
          if (charge.status !== ChargeStatus.CONVICTED) {
            return <span className="text-foreground-muted">—</span>
          }
          if (charge.hasSentence) {
            return (
              <Badge className="bg-success/10 text-success">
                <CheckCircle2 className="size-3" />
                {t('charges.sentenceIndicator.recorded')}
              </Badge>
            )
          }
          return (
            <Badge className="bg-warning/10 text-warning">
              <Clock className="size-3" />
              {t('charges.sentenceIndicator.pending')}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: t('charges.columns.actions'),
        cell: ({ row }) => {
          const charge = row.original
          const terminal = isChargeTerminal(charge.status)
          const showViewSentence = charge.status === ChargeStatus.CONVICTED
          const showUpdate = !terminal && canManage
          const showDrop = !terminal && canManage
          const showSeparator = showDrop && (showUpdate || showViewSentence)

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showUpdate ? (
                  <DropdownMenuItem onClick={() => onUpdateStatus(charge)}>
                    {t('charges.rowActions.updateStatus')}
                  </DropdownMenuItem>
                ) : null}
                {showViewSentence ? (
                  <DropdownMenuItem onClick={() => onViewSentence(charge)}>
                    {t('charges.rowActions.viewSentence')}
                  </DropdownMenuItem>
                ) : null}
                {showSeparator ? <DropdownMenuSeparator /> : null}
                {showDrop ? (
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onDropCharge(charge)}
                  >
                    {t('charges.rowActions.dropCharge')}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ]
  }, [canManage, onDropCharge, onUpdateStatus, onViewSentence, t])

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('charges.sectionTitle')}
        description={t('charges.entityCount', { count: data?.total ?? 0 })}
        actions={
          <PermissionGuard permission={Permission.LEGAL_MANAGE}>
            <Button onClick={onAddCharge} size="sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              {t('charges.addChargeButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div className="space-y-3">
        <TableFilterBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder={t('charges.filters.search')}
          icon={Search}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('charges.filters.status')}
                {filters.chargeStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.chargeStatus.length}
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
                      checked={filters.chargeStatus.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="text-sm font-medium">{t(`charges.status.${status}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="h-9 px-2 text-foreground-muted"
              onClick={clearAllFilters}
            >
              <RotateCcw className="mr-2 size-4" />
              {t('charges.filters.clearAll')}
            </Button>
          )}
        </TableFilterBar>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-foreground-muted">{t('charges.filters.status')}</span>

            {filters.chargeSearch && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {filters.chargeSearch}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => {
                    setSearchValue('')
                    void setFilters({ chargeSearch: null, chargePage: 1 })
                  }}
                />
              </Badge>
            )}

            {filters.chargeStatus.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1 pr-1 font-normal">
                {t(`charges.status.${status}`)}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleStatus(status)}
                />
              </Badge>
            ))}
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
          <TableSkeleton columns={6} />
        ) : !hasResults ? (
          hasActiveFilters ? (
            <TableEmptyState title={t('charges.emptyFiltered')} description="" />
          ) : (
            <EmptyState
              title={t('charges.empty.title')}
              description={t('charges.empty.description')}
              action={<p className="text-xs text-foreground-muted">{t('charges.empty.cta')}</p>}
            />
          )
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              pageIndex: filters.chargePage - 1,
              pageSize: filters.chargePageSize,
            }}
            onPaginationChange={(state) =>
              handlePaginationChange(state.pageIndex + 1, state.pageSize)
            }
            sorting={[
              {
                id: filters.chargeSortField,
                desc: filters.chargeSortDirection === 'desc',
              },
            ]}
            onSortingChange={handleSortingChange}
            onRowClick={handleRowClick}
          />
        )}

        {data && data.total > 0 && (
          <TablePagination
            total={data.total}
            page={filters.chargePage}
            pageSize={filters.chargePageSize}
            onChange={handlePaginationChange}
          />
        )}
      </div>
    </div>
  )
}
