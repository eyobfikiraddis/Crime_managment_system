'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { useUiStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Permission } from '@/shared/constants/permissions'
import { hasAllPermissions } from '@/shared/permissions'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useDeleteCase } from '../hooks/useDeleteCase'
import type { CaseListItem, CaseStatus } from '../types/case.types'

const STATUS_VARIANT_MAP: Record<CaseStatus, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

function ActionsCell({ row }: { row: CaseListItem }) {
  const t = useTranslations('cases')
  const openModal = useUiStore((state) => state.openModal)
  const permissions = useAuthStore((state) => state.permissions)
  const role = useAuthStore((state) => state.role)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteCaseMutation = useDeleteCase()

  const hasWritePermission = hasAllPermissions(permissions, [Permission.CASES_WRITE])
  const isSuperAdmin = role === 'SUPERADMIN'

  const handleDelete = () => {
    deleteCaseMutation.mutate(row.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
      },
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/cases/${row.id}`}>{t('list.rowActions.view')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!hasWritePermission}>
            <Link href={`/cases/${row.id}/edit`}>{t('list.rowActions.edit')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasWritePermission}
            onClick={() => openModal('case-status-transition', { caseId: row.id })}
          >
            {t('list.rowActions.transition')}
          </DropdownMenuItem>
          {isSuperAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                {t('list.rowActions.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteDialogOpen && (
        <DestructiveConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t('detail.actions.deleteConfirmTitle')}
          description={t('detail.actions.deleteConfirmDescription', { caseNumber: row.caseNumber })}
          confirmLabel={t('list.rowActions.delete')}
          cancelLabel={t('status.cancelButton')}
          confirmPhrase={row.caseNumber}
          confirmPrompt={t('detail.actions.deleteConfirmPhrase', { caseNumber: row.caseNumber })}
          onConfirm={handleDelete}
          isConfirming={deleteCaseMutation.isPending}
        />
      )}
    </>
  )
}

export function useCaseColumns(): ColumnDef<CaseListItem>[] {
  const t = useTranslations('cases')

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'caseNumber',
      header: t('list.columns.caseNumber'),
      cell: ({ row }) => (
        <Link
          href={`/cases/${row.original.id}`}
          className="font-mono text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {row.original.caseNumber}
        </Link>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'title',
      header: t('list.columns.title'),
      cell: ({ row }) => {
        const title = row.original.title
        const displayTitle = title.length > 60 ? `${title.slice(0, 60)}...` : title
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[220px] block">{displayTitle}</span>
              </TooltipTrigger>
              <TooltipContent>{title}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: t('list.columns.status'),
      cell: ({ row }) => {
        const status = row.original.status
        const variant = STATUS_VARIANT_MAP[status] ?? 'primary'
        return <StatusBadge status={t(`status.${status}`)} variant={variant} className="w-[140px] text-center" />
      },
      enableSorting: true,
    },
    {
      accessorKey: 'crimeType',
      header: t('list.columns.crimeType'),
      cell: ({ row }) => <span>{row.original.crimeType.name}</span>,
    },
    {
      accessorKey: 'department',
      header: t('list.columns.department'),
      cell: ({ row }) => <span>{row.original.department.name}</span>,
    },
    {
      accessorKey: 'leadOfficer',
      header: t('list.columns.leadOfficer'),
      cell: ({ row }) => {
        const officer = row.original.leadOfficer
        const fullName = `${officer.firstName} ${officer.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{getInitials(officer.firstName, officer.lastName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'reportedDate',
      header: t('list.columns.reportedDate'),
      cell: ({ row }) => <span>{format(new Date(row.original.reportedDate), 'dd MMM yyyy')}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'lastActivityAt',
      header: t('list.columns.lastActivity'),
      cell: ({ row }) => {
        const date = new Date(row.original.lastActivityAt)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </TooltipTrigger>
              <TooltipContent>{format(date, 'yyyy-MM-dd HH:mm:ss O')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionsCell row={row.original} />,
    },
  ]
}
