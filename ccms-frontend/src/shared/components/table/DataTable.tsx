'use client'

import { useMemo, useRef, useState } from 'react'
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { TableEmptyState } from './TableEmptyState'
import { TableSkeleton } from './TableSkeleton'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  isLoading: boolean
  pagination?: PaginationState
  onPaginationChange?: (state: PaginationState) => void
  sorting?: SortingState
  onSortingChange?: (state: SortingState) => void
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: RowSelectionState) => void
  emptyMessage?: string
  tableId?: string
}

export function DataTable<TData>({
  data,
  columns,
  isLoading,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  enableRowSelection,
  onRowSelectionChange,
  emptyMessage,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const sortingState = sorting ?? internalSorting
  const paginationState = pagination ?? internalPagination

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      pagination: paginationState,
    },
    onSortingChange: (onSortingChange ?? setInternalSorting) as any,
    onPaginationChange: (onPaginationChange ?? setInternalPagination) as any,
    // allow boolean or row-chooser function; cast for strict typing
    enableRowSelection: enableRowSelection as any,
    // cast to any due to exactOptionalPropertyTypes mismatch with tanstack's OnChangeFn
    onRowSelectionChange: onRowSelectionChange as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: Boolean(onPaginationChange),
  })

  const rows = table.getRowModel().rows
  const parentRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = rows.length >= 200

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : null
  const paddingTop = virtualItems?.[0]?.start ?? 0
  const paddingBottom = virtualItems
    ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0

  const visibleRows = useMemo(() => {
    if (!virtualItems) {
      return rows.map((row, index) => ({ row, index }))
    }
    return virtualItems.map((item) => ({ row: rows[item.index], index: item.index }))
  }, [rows, virtualItems])

  if (isLoading) {
    return <TableSkeleton columns={columns.length} />
  }

  if (rows.length === 0) {
    return <TableEmptyState message={emptyMessage ?? 'No data'} />
  }

  return (
    <div className="rounded-md border border-border" ref={parentRef}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortState = header.column.getIsSorted()
                const ariaSort = sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : undefined

                return (
                  <TableHead key={header.id} aria-sort={ariaSort}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 ? (
            <TableRow>
              <TableCell style={{ height: paddingTop }} colSpan={columns.length} />
            </TableRow>
          ) : null}
          {visibleRows.map(({ row }) =>
            row ? (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ) : null,
          )}
          {paddingBottom > 0 ? (
            <TableRow>
              <TableCell style={{ height: paddingBottom }} colSpan={columns.length} />
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}
