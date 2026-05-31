'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@shared/components/display/PageHeader'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { useAuthStore } from '@shared/stores/auth.store'

import { useDepartmentDetail } from '../hooks/useDepartmentDetail'
import { getDepartmentDisplayName } from '../utils/departmentUtils'
import { DepartmentMetadataCard } from './DepartmentMetadataCard'
import { DepartmentHeadCard } from './DepartmentHeadCard'
import { DepartmentOfficersTable } from './DepartmentOfficersTable'

import { UpdateDepartmentDrawer } from './UpdateDepartmentDrawer'
import { AssignHeadOfficerDrawer } from './AssignHeadOfficerDrawer'
import { RemoveHeadOfficerDialog } from './RemoveHeadOfficerDialog'
import { DeleteDepartmentDialog } from './DeleteDepartmentDialog'

interface DepartmentDetailProps {
  departmentId: string
}

export function DepartmentDetail({ departmentId }: DepartmentDetailProps) {
  const t = useTranslations('departments')
  const permissions = useAuthStore((state) => state.permissions)
  const canManage = permissions.includes(Permission.DEPARTMENTS_MANAGE)

  const [updateOpen, setUpdateOpen] = useState(false)
  const [assignHeadOpen, setAssignHeadOpen] = useState(false)
  const [removeHeadOpen, setRemoveHeadOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: department, isLoading, isError } = useDepartmentDetail(departmentId)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-muted/20 rounded-md w-1/3" />
        <div className="h-48 bg-muted/20 rounded-md" />
        <div className="h-48 bg-muted/20 rounded-md" />
        <div className="h-64 bg-muted/20 rounded-md" />
      </div>
    )
  }

  if (isError || !department) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-md border border-border text-center">
        <AlertCircle className="size-12 text-destructive mb-3" />
        <h3 className="text-lg font-semibold">Department Not Found</h3>
        <p className="text-sm text-foreground-muted mt-1 mb-4">
          This department may have been deleted or the ID is invalid.
        </p>
        <Button asChild>
          <Link href="/departments">{t('detail.breadcrumb')}</Link>
        </Button>
      </div>
    )
  }

  const displayName = getDepartmentDisplayName(department.name, department.code)

  const headerActions = (
    <PermissionGuard permission={Permission.DEPARTMENTS_MANAGE}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setUpdateOpen(true)}>
          {t('detail.actions.edit')}
        </Button>

        {department.headOfficer ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setAssignHeadOpen(true)}>
              {t('detail.actions.changeHead')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRemoveHeadOpen(true)}>
              {t('detail.actions.removeHead')}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAssignHeadOpen(true)}>
            {t('detail.actions.assignHead')}
          </Button>
        )}

        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          {t('detail.actions.delete')}
        </Button>
      </div>
    </PermissionGuard>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/departments" className="hover:underline hover:text-foreground">
          {t('detail.breadcrumb')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">{displayName}</span>
      </div>

      <PageHeader
        title={displayName}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DepartmentMetadataCard department={department} />
          <DepartmentOfficersTable departmentId={department.id} />
        </div>
        <div className="lg:col-span-1">
          <DepartmentHeadCard
            department={department}
            onAssignHead={() => setAssignHeadOpen(true)}
            canManage={canManage}
          />
        </div>
      </div>

      {updateOpen && (
        <UpdateDepartmentDrawer
          open={updateOpen}
          department={department}
          onClose={() => setUpdateOpen(false)}
        />
      )}

      {assignHeadOpen && (
        <AssignHeadOfficerDrawer
          open={assignHeadOpen}
          departmentId={department.id}
          currentHead={department.headOfficer}
          onClose={() => setAssignHeadOpen(false)}
        />
      )}

      {removeHeadOpen && (
        <RemoveHeadOfficerDialog
          open={removeHeadOpen}
          department={department}
          onClose={() => setRemoveHeadOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteDepartmentDialog
          open={deleteOpen}
          department={department}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}
