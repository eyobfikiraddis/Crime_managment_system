'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useOfficerDetail } from '@features/personnel/hooks/useOfficerDetail'
import { getFullName } from '@features/personnel/utils/personnelUtils'

import { PageHeader } from '@shared/components/display/PageHeader'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'

import { OfficerIdentityCard } from './OfficerIdentityCard'
import { OfficerCasesSummary } from './OfficerCasesSummary'

import ActivateOfficerDialog from './ActivateOfficerDialog'
import DeactivateOfficerDialog from './DeactivateOfficerDialog'
import ResetPasswordDialog from './ResetPasswordDialog'

interface OfficerDetailProps {
  officerId: string
}

export function OfficerDetail({ officerId }: OfficerDetailProps) {
  const t = useTranslations('personnel')

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)

  const { data: officer, isLoading, isError } = useOfficerDetail(officerId)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-muted/20 rounded-md w-1/3" />
        <div className="h-48 bg-muted/20 rounded-md" />
        <div className="h-64 bg-muted/20 rounded-md" />
      </div>
    )
  }

  if (isError || !officer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-md border border-border text-center">
        <h3 className="text-lg font-semibold">{t('officers.detail.notFound') ?? 'Officer Not Found'}</h3>
        <Button asChild className="mt-4">
          <Link href="/personnel/officers">{t('officers.detail.breadcrumb') ?? 'Back to Officers'}</Link>
        </Button>
      </div>
    )
  }

  const fullName = getFullName(officer.firstName, officer.lastName)

  const headerActions = (
    <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setResetPasswordOpen(true)}>
          {t('officers.detail.actions.resetPassword')}
        </Button>
        {officer.status === 'ACTIVE' ? (
          <Button variant="destructive" onClick={() => setDeactivateOpen(true)}>
            {t('officers.detail.actions.deactivate')}
          </Button>
        ) : (
          <Button onClick={() => setActivateOpen(true)}>
            {t('officers.detail.actions.activate')}
          </Button>
        )}
      </div>
    </PermissionGuard>
  )

  return (
    <PermissionGuard permission={Permission.PERSONNEL_VIEW} fallback={<ForbiddenState />}>
      <div className="space-y-6">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Link href="/personnel/officers" className="hover:underline hover:text-foreground">
            {t('officers.detail.breadcrumb')}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{fullName}</span>
        </div>

        <PageHeader
          title={`${fullName} (Badge: ${officer.badgeNumber})`}
          actions={headerActions}
        />

        <OfficerIdentityCard officer={officer} />

        <OfficerCasesSummary officerId={officer.id} />

        {deactivateOpen && (
          <DeactivateOfficerDialog
            open={deactivateOpen}
            officer={officer}
            onClose={() => setDeactivateOpen(false)}
          />
        )}

        {activateOpen && (
          <ActivateOfficerDialog
            open={activateOpen}
            officer={officer}
            onClose={() => setActivateOpen(false)}
          />
        )}

        {resetPasswordOpen && (
          <ResetPasswordDialog
            open={resetPasswordOpen}
            officer={officer}
            onClose={() => setResetPasswordOpen(false)}
          />
        )}
      </div>
    </PermissionGuard>
  )
}

export default OfficerDetail
