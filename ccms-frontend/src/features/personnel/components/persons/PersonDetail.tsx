'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronDown, UserX, Heart, Eye, ClipboardList } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { usePersonDetail } from '@features/personnel/hooks/usePersonDetail'
import { usePersonCases } from '@features/personnel/hooks/usePersonCases'
import { PersonRole } from '@features/personnel/types/personnel.types'
import { getFullName, hasRole } from '@features/personnel/utils/personnelUtils'

import { PageHeader } from '@shared/components/display/PageHeader'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'
import { PersonAuditDrawer } from '@features/audit/components/PersonAuditDrawer'
import { useFocusRestore } from '@shared/utils/focusUtils'

import { PersonIdentityCard } from './PersonIdentityCard'
import { PersonRoleCards } from './PersonRoleCards'
import { PersonCasesTable } from './PersonCasesTable'
import { DemotePersonRoleDialog } from './DemotePersonRoleDialog'

import PromoteToSuspectDrawer from './PromoteToSuspectDrawer'
import PromoteToVictimDrawer from './PromoteToVictimDrawer'
import PromoteToWitnessDrawer from './PromoteToWitnessDrawer'

interface PersonDetailProps {
  personId: string
}

export function PersonDetail({ personId }: PersonDetailProps) {
  const t = useTranslations('personnel')
  const tAudit = useTranslations('audit')

  const [promoteToSuspectOpen, setPromoteToSuspectOpen] = useState(false)
  const [promoteToVictimOpen, setPromoteToVictimOpen] = useState(false)
  const [promoteToWitnessOpen, setPromoteToWitnessOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  
  const [demoteRole, setDemoteRole] = useState<PersonRole | null>(null)
  const [demoteOpen, setDemoteOpen] = useState(false)

  const { data: person, isLoading, isError } = usePersonDetail(personId)
  const { data: casesData } = usePersonCases(personId, { page: 1, pageSize: 100 })
  
  const { openWithFocusRestore, restoreFocusOnClose } = useFocusRestore()

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

  if (isError || !person) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-md border border-border text-center">
        <h3 className="text-lg font-semibold">{t('persons.detail.notFound') ?? 'Person Not Found'}</h3>
        <Button asChild className="mt-4">
          <Link href="/personnel/persons">{t('persons.detail.breadcrumb') ?? 'Back to Persons'}</Link>
        </Button>
      </div>
    )
  }

  const fullName = getFullName(person.firstName, person.lastName)

  const hasSuspect = hasRole(person.roles, PersonRole.SUSPECT)
  const hasVictim = hasRole(person.roles, PersonRole.VICTIM)
  const hasWitness = hasRole(person.roles, PersonRole.WITNESS)

  const activeCasesForRole = demoteRole 
    ? (casesData?.data.filter(
        (c) => c.roleOnCase === demoteRole && c.caseStatus !== 'CLOSED' && c.caseStatus !== 'ARCHIVED'
      ).length ?? 0)
    : 0

  const handleOpenSuspect = () => openWithFocusRestore(() => setPromoteToSuspectOpen(true))
  const handleCloseSuspect = () => {
    setPromoteToSuspectOpen(false)
    restoreFocusOnClose()
  }

  const handleOpenVictim = () => openWithFocusRestore(() => setPromoteToVictimOpen(true))
  const handleCloseVictim = () => {
    setPromoteToVictimOpen(false)
    restoreFocusOnClose()
  }

  const handleOpenWitness = () => openWithFocusRestore(() => setPromoteToWitnessOpen(true))
  const handleCloseWitness = () => {
    setPromoteToWitnessOpen(false)
    restoreFocusOnClose()
  }

  const handleOpenAudit = () => openWithFocusRestore(() => setAuditOpen(true))
  const handleCloseAudit = () => {
    setAuditOpen(false)
    restoreFocusOnClose()
  }

  const handleOpenDemote = (role: PersonRole) => {
    openWithFocusRestore(() => {
      setDemoteRole(role)
      setDemoteOpen(true)
    })
  }

  const handleCloseDemote = () => {
    setDemoteOpen(false)
    setDemoteRole(null)
    restoreFocusOnClose()
  }

  const dropdownActions = (
    <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {t('persons.detail.rolesSection.promoteSection')} <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {!hasSuspect && (
            <DropdownMenuItem onClick={handleOpenSuspect}>
              <UserX className="mr-2 h-4 w-4" />
              {t('persons.detail.actions.promoteToSuspect')}
            </DropdownMenuItem>
          )}
          {!hasVictim && (
            <DropdownMenuItem onClick={handleOpenVictim}>
              <Heart className="mr-2 h-4 w-4" />
              {t('persons.detail.actions.promoteToVictim')}
            </DropdownMenuItem>
          )}
          {!hasWitness && (
            <DropdownMenuItem onClick={handleOpenWitness}>
              <Eye className="mr-2 h-4 w-4" />
              {t('persons.detail.actions.promoteToWitness')}
            </DropdownMenuItem>
          )}
          {(!hasSuspect || !hasVictim || !hasWitness) && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={handleOpenAudit}>
            <ClipboardList className="mr-2 h-4 w-4" />
            {tAudit('personHistory.openButton')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionGuard>
  )

  return (
    <PermissionGuard permission={Permission.PERSONNEL_VIEW} fallback={<ForbiddenState />}>
      <div className="space-y-6">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Link href="/personnel/persons" className="hover:underline hover:text-foreground">
            {t('persons.detail.breadcrumb')}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{fullName}</span>
        </div>

        <PageHeader
          title={fullName}
          actions={dropdownActions}
        />

        <PersonIdentityCard person={person} />

        <PersonRoleCards person={person} onDemote={handleOpenDemote} />

        <PersonCasesTable personId={person.id} />

        {promoteToSuspectOpen && (
          <PromoteToSuspectDrawer
            personId={person.id}
            open={promoteToSuspectOpen}
            onClose={handleCloseSuspect}
          />
        )}

        {promoteToVictimOpen && (
          <PromoteToVictimDrawer
            personId={person.id}
            open={promoteToVictimOpen}
            onClose={handleCloseVictim}
          />
        )}

        {promoteToWitnessOpen && (
          <PromoteToWitnessDrawer
            personId={person.id}
            open={promoteToWitnessOpen}
            onClose={handleCloseWitness}
          />
        )}

        <PersonAuditDrawer
          personId={person.id}
          personName={fullName}
          open={auditOpen}
          onClose={handleCloseAudit}
        />

        {demoteOpen && demoteRole && (
          <DemotePersonRoleDialog
            personId={person.id}
            personName={fullName}
            role={demoteRole}
            open={demoteOpen}
            onClose={handleCloseDemote}
            activeCaseCount={activeCasesForRole}
          />
        )}
      </div>
    </PermissionGuard>
  )
}

export default PersonDetail
