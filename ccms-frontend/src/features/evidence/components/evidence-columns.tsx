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
import { useDeleteEvidence } from '../hooks/useDeleteEvidence'
import type { EvidenceListItem, EvidenceType, CustodyEventType } from '../types/evidence.types'

const EVIDENCE_TYPE_VARIANTS: Record<EvidenceType, 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'> = {
  CRIME_SCENE_PHOTO: 'accent',
  DIGITAL: 'primary',
  PHYSICAL: 'muted',
  DOCUMENT: 'muted',
  BIOLOGICAL: 'warning',
  FORENSIC_REPORT: 'success',
  WEAPON: 'destructive',
  VEHICLE: 'warning',
  WITNESS_STATEMENT: 'primary',
  AUDIO: 'accent',
  VIDEO: 'accent',
  OTHER: 'muted',
}

const CUSTODY_STATUS_VARIANTS: Record<CustodyEventType, 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'> = {
  COLLECTED: 'muted',
  TRANSFERRED: 'warning',
  EXAMINED: 'primary',
  STORED: 'muted',
  PRESENTED_IN_COURT: 'accent',
  RETURNED: 'success',
  DESTROYED: 'destructive',
}

interface EvidenceColumnsOptions {
  caseId: string
  onViewDetails: (evidenceId: string) => void
  onRecordCustody: (evidenceId: string) => void
}

function ActionsCell({
  row,
  caseId,
  onViewDetails,
  onRecordCustody,
}: {
  row: EvidenceListItem
  caseId: string
  onViewDetails: (evidenceId: string) => void
  onRecordCustody: (evidenceId: string) => void
}) {
  const t = useTranslations('evidence')
  const permissions = useAuthStore((state) => state.permissions)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteEvidenceMutation = useDeleteEvidence(caseId)
  const hasManagePermission = hasAllPermissions(permissions, [Permission.EVIDENCE_MANAGE])

  const handleDelete = () => {
    deleteEvidenceMutation.mutate(row.id, {
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
          <DropdownMenuItem onClick={() => onViewDetails(row.id)}>
            {t('tab.rowActions.view')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasManagePermission}
            onClick={() => onRecordCustody(row.id)}
          >
            {t('tab.rowActions.recordCustody')}
          </DropdownMenuItem>
          {hasManagePermission ? (
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
          description={t('delete.confirmDescription', { evidenceNumber: row.evidenceNumber })}
          confirmLabel={t('tab.rowActions.delete')}
          cancelLabel={t('upload.cancelButton')}
          confirmPhrase={t('delete.confirmPhrase', { evidenceNumber: row.evidenceNumber })}
          confirmPrompt={t('delete.confirmPhrase', { evidenceNumber: row.evidenceNumber })}
          onConfirm={handleDelete}
          isConfirming={deleteEvidenceMutation.isPending}
        />
      ) : null}
    </>
  )
}

export function useEvidenceColumns({
  caseId,
  onViewDetails,
  onRecordCustody,
}: EvidenceColumnsOptions): ColumnDef<EvidenceListItem>[] {
  const t = useTranslations('evidence')

  return [
    {
      accessorKey: 'evidenceNumber',
      header: t('tab.columns.evidenceNumber'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-[var(--color-primary)]">
          {row.original.evidenceNumber}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: t('tab.columns.description'),
      cell: ({ row }) => {
        const description = row.original.description
        const display = description.length > 80 ? `${description.slice(0, 80)}...` : description
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[240px] block">{display}</span>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'evidenceType',
      header: t('tab.columns.type'),
      cell: ({ row }) => {
        const type = row.original.evidenceType
        const variant = EVIDENCE_TYPE_VARIANTS[type] ?? 'muted'
        return <StatusBadge status={t(`types.${type}`)} variant={variant} className="w-[150px] text-center" />
      },
      enableSorting: true,
    },
    {
      accessorKey: 'collectedBy',
      header: t('tab.columns.collectedBy'),
      cell: ({ row }) => {
        const officer = row.original.collectedBy
        return (
          <span>{`${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`}</span>
        )
      },
    },
    {
      accessorKey: 'collectedAt',
      header: t('tab.columns.collectedAt'),
      cell: ({ row }) => <span>{format(new Date(row.original.collectedAt), 'dd MMM yyyy HH:mm')}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'storageLocation',
      header: t('tab.columns.storageLocation'),
      cell: ({ row }) => (
        <span className="truncate max-w-[160px] block">{row.original.storageLocation}</span>
      ),
    },
    {
      accessorKey: 'custodyStatus',
      header: t('tab.columns.custodyStatus'),
      cell: ({ row }) => {
        const status = row.original.custodyStatus
        const variant = CUSTODY_STATUS_VARIANTS[status] ?? 'muted'
        return <StatusBadge status={t(`custodyStatus.${status}`)} variant={variant} className="w-[120px] text-center" />
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: t('tab.columns.actions'),
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          caseId={caseId}
          onViewDetails={onViewDetails}
          onRecordCustody={onRecordCustody}
        />
      ),
    },
  ]
}
