'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import Link from 'next/link'
import { Building2, Tag, User, Calendar, FileText, CheckCircle, ChevronDown, MoreVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { DestructiveConfirmDialog } from '@/shared/components/modals/DestructiveConfirmDialog'
import { useCase } from '../hooks/useCase'
import { useDeleteCase } from '../hooks/useDeleteCase'
import { useUiStore } from '@/shared/stores/ui.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Permission } from '@/shared/constants/permissions'
import type { CaseStatus } from '../types/case.types'

const STATUS_VARIANT_MAP: Record<CaseStatus, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

interface CaseHeaderCardProps {
  caseId: string
}

export function CaseHeaderCard({ caseId }: CaseHeaderCardProps) {
  const t = useTranslations('cases')
  const openModal = useUiStore((state) => state.openModal)
  const permissions = useAuthStore((state) => state.permissions)
  const role = useAuthStore((state) => state.role)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const deleteMutation = useDeleteCase()

  const { data: caseDetail, isLoading } = useCase(caseId)

  if (isLoading) {
    return <CaseHeaderCardSkeleton />
  }

  if (!caseDetail) {
    return null
  }

  const hasWritePermission = permissions.includes(Permission.CASES_WRITE) || role === 'ADMIN' || role === 'SUPERADMIN'
  const isSuperAdmin = role === 'SUPERADMIN'
  const isAdminPlus = role === 'ADMIN' || role === 'SUPERADMIN' || role === 'DEPT_HEAD'

  const handleDelete = () => {
    deleteMutation.mutate(caseDetail.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
      },
    })
  }

  const statusVariant = STATUS_VARIANT_MAP[caseDetail.status] ?? 'primary'

  return (
    <div className="border-b border-border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Case Info */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-foreground-muted">{caseDetail.caseNumber}</span>
            {hasWritePermission ? (
              <button
                type="button"
                onClick={() => openModal('case-status-transition', { caseId: caseDetail.id })}
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition"
              >
                <StatusBadge
                  status={t(`status.${caseDetail.status}`)}
                  variant={statusVariant}
                  className="hover:opacity-85 cursor-pointer shadow-sm"
                />
              </button>
            ) : (
              <StatusBadge status={t(`status.${caseDetail.status}`)} variant={statusVariant} />
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {caseDetail.title}
          </h1>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-y-2 text-sm text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {caseDetail.department.name}
            </span>
            <span className="mx-2 text-muted select-none">·</span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {caseDetail.crimeType.name}
            </span>
            <span className="mx-2 text-muted select-none">·</span>
            <Link
              href={`/personnel/officers/${caseDetail.leadOfficer.id}`}
              className="flex items-center gap-1.5 hover:text-foreground hover:underline transition"
            >
              <User className="h-4 w-4" />
              {`${caseDetail.leadOfficer.firstName} ${caseDetail.leadOfficer.lastName}`}
            </Link>
          </div>

          {/* Dates section */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t('detail.headerCard.incidentDateLabel')}: {format(new Date(caseDetail.incidentDate), 'dd MMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {t('detail.headerCard.reportedDateLabel')}: {format(new Date(caseDetail.reportedDate), 'dd MMM yyyy')}
            </span>
            {caseDetail.closedDate && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('detail.headerCard.closedDateLabel')}: {format(new Date(caseDetail.closedDate), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button variant="outline" disabled className="text-xs">
            {t('detail.actions.edit')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAdminPlus && (
                <DropdownMenuItem asChild>
                  <Link href={`/cases/${caseId}/permissions`}>
                    {t('detail.actions.managePermissions')}
                  </Link>
                </DropdownMenuItem>
              )}
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
        </div>
      </div>

      {isDeleteDialogOpen && (
        <DestructiveConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t('detail.actions.deleteConfirmTitle')}
          description={t('detail.actions.deleteConfirmDescription', { caseNumber: caseDetail.caseNumber })}
          confirmLabel={t('list.rowActions.delete')}
          cancelLabel={t('status.cancelButton')}
          confirmPhrase={caseDetail.caseNumber}
          confirmPrompt={t('detail.actions.deleteConfirmPhrase', { caseNumber: caseDetail.caseNumber })}
          onConfirm={handleDelete}
          isConfirming={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

function CaseHeaderCardSkeleton() {
  return (
    <div className="border-b border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-8 w-2/3" />
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  )
}
