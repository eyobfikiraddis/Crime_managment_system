'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useAuthStore } from '@/shared/stores/auth.store'
import { hasAllPermissions } from '@/shared/permissions'
import { Permission } from '@/shared/constants/permissions'
import { useDeleteArrest } from '../hooks/useDeleteArrest'
import type { ArrestListItem, DetentionStatus, BailStatus } from '../types/arrest.types'

type BadgeVariant = 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'

const DETENTION_STATUS_VARIANTS: Record<DetentionStatus, BadgeVariant> = {
  IN_CUSTODY: 'warning',
  RELEASED_ON_BAIL: 'accent',
  RELEASED: 'success',
  TRANSFERRED: 'primary',
}

const BAIL_STATUS_VARIANTS: Record<BailStatus, BadgeVariant> = {
  NOT_SET: 'muted',
  DENIED: 'destructive',
  GRANTED: 'success',
  POSTED: 'accent',
}

interface ArrestColumnsOptions {
  caseId: string
  onViewDetails: (arrestId: string) => void
  onUpdateStatus: (arrestId: string) => void
}

function ActionsCell({
  row,
  caseId,
  onViewDetails,
  onUpdateStatus,
}: {
  row: ArrestListItem
  caseId: string
  onViewDetails: (arrestId: string) => void
  onUpdateStatus: (arrestId: string) => void
}) {
  const t = useTranslations('arrests')
  const permissions = useAuthStore((state) => state.permissions)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteArrestMutation = useDeleteArrest(caseId)
  const hasManagePermission = hasAllPermissions(permissions, [Permission.ARRESTS_MANAGE])
  const hasDeletePermission = hasAllPermissions(permissions, [Permission.ARRESTS_DELETE])

  const handleDelete = () => {
    deleteArrestMutation.mutate(row.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
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
          <DropdownMenuItem onClick={() => onViewDetails(row.id)}>
            {t('tab.rowActions.view')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasManagePermission}
            onClick={() => onUpdateStatus(row.id)}
          >
            {t('tab.rowActions.updateStatus')}
          </DropdownMenuItem>
          {hasDeletePermission ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                {t('tab.rowActions.delete')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteDialogOpen ? (
        <DestructiveConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t('delete.confirmTitle')}
          description={t('delete.confirmDescription', { arrestNumber: row.arrestNumber })}
          confirmLabel={t('tab.rowActions.delete')}
          cancelLabel={t('create.cancelButton')}
          confirmPhrase={t('delete.confirmPhrase', { arrestNumber: row.arrestNumber })}
          confirmPrompt={t('delete.confirmPhrase', { arrestNumber: row.arrestNumber })}
          onConfirm={handleDelete}
          isConfirming={deleteArrestMutation.isPending}
        />
      ) : null}
    </>
  )
}

export function useArrestColumns({
  caseId,
  onViewDetails,
  onUpdateStatus,
}: ArrestColumnsOptions): ColumnDef<ArrestListItem>[] {
  const t = useTranslations('arrests')

  return [
    {
      accessorKey: 'arrestNumber',
      header: t('tab.columns.arrestNumber'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-[var(--color-primary)]">
          {row.original.arrestNumber}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'arrestedPerson',
      header: t('tab.columns.arrestedPerson'),
      cell: ({ row }) => {
        const person = row.original.arrestedPerson
        return <span>{`${person.firstName} ${person.lastName}`}</span>
      },
    },
    {
      accessorKey: 'arrestingOfficer',
      header: t('tab.columns.arrestingOfficer'),
      cell: ({ row }) => {
        const officer = row.original.arrestingOfficer
        return <span>{`${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`}</span>
      },
    },
    {
      accessorKey: 'arrestDate',
      header: t('tab.columns.arrestDate'),
      cell: ({ row }) => (
        <span>{format(new Date(row.original.arrestDate), 'dd MMM yyyy HH:mm')}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'location',
      header: t('tab.columns.location'),
      cell: ({ row }) => {
        const location = row.original.location
        const display = location.length > 40 ? `${location.slice(0, 40)}...` : location
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[180px] block">{display}</span>
              </TooltipTrigger>
              <TooltipContent>{location}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'detentionStatus',
      header: t('tab.columns.detentionStatus'),
      cell: ({ row }) => {
        const status = row.original.detentionStatus
        const variant = DETENTION_STATUS_VARIANTS[status] ?? 'muted'
        return (
          <StatusBadge
            status={t(`detentionStatus.${status}`)}
            variant={variant}
            className="w-[120px] text-center"
          />
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'bailStatus',
      header: t('tab.columns.bailStatus'),
      cell: ({ row }) => {
        const status = row.original.bailStatus
        const variant = BAIL_STATUS_VARIANTS[status] ?? 'muted'
        return (
          <StatusBadge
            status={t(`bailStatus.${status}`)}
            variant={variant}
            className="w-[100px] text-center"
          />
        )
      },
    },
    {
      id: 'actions',
      header: t('tab.columns.actions'),
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          caseId={caseId}
          onViewDetails={onViewDetails}
          onUpdateStatus={onUpdateStatus}
        />
      ),
    },
  ]
}
