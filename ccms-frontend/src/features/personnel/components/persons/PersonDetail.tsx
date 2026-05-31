'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronDown, UserX, Heart, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { usePersonDetail } from '@features/personnel/hooks/usePersonDetail'
import { PersonRole } from '@features/personnel/types/personnel.types'
import { getFullName, hasRole } from '@features/personnel/utils/personnelUtils'

import { PageHeader } from '@shared/components/display/PageHeader'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'
import { ForbiddenState } from '@shared/components/feedback/ForbiddenState'

import { PersonIdentityCard } from './PersonIdentityCard'
import { PersonRoleCards } from './PersonRoleCards'
import { PersonCasesTable } from './PersonCasesTable'

import PromoteToSuspectDrawer from './PromoteToSuspectDrawer'
import PromoteToVictimDrawer from './PromoteToVictimDrawer'
import PromoteToWitnessDrawer from './PromoteToWitnessDrawer'

interface PersonDetailProps {
  personId: string
}

export function PersonDetail({ personId }: PersonDetailProps) {
  const t = useTranslations('personnel')

  const [promoteToSuspectOpen, setPromoteToSuspectOpen] = useState(false)
  const [promoteToVictimOpen, setPromoteToVictimOpen] = useState(false)
  const [promoteToWitnessOpen, setPromoteToWitnessOpen] = useState(false)

  const { data: person, isLoading, isError } = usePersonDetail(personId)

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

  const hasAllRoles = hasSuspect && hasVictim && hasWitness

  const dropdownActions = (
    <PermissionGuard permission={Permission.PERSONNEL_MANAGE}>
      {!hasAllRoles && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {t('persons.detail.rolesSection.promoteSection')} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {!hasSuspect && (
              <DropdownMenuItem onClick={() => setPromoteToSuspectOpen(true)}>
                <UserX className="mr-2 h-4 w-4" />
                {t('persons.detail.actions.promoteToSuspect')}
              </DropdownMenuItem>
            )}
            {!hasVictim && (
              <DropdownMenuItem onClick={() => setPromoteToVictimOpen(true)}>
                <Heart className="mr-2 h-4 w-4" />
                {t('persons.detail.actions.promoteToVictim')}
              </DropdownMenuItem>
            )}
            {!hasWitness && (
              <DropdownMenuItem onClick={() => setPromoteToWitnessOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('persons.detail.actions.promoteToWitness')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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

        <PersonRoleCards person={person} />

        <PersonCasesTable personId={person.id} />

        {promoteToSuspectOpen && (
          <PromoteToSuspectDrawer
            personId={person.id}
            open={promoteToSuspectOpen}
            onClose={() => setPromoteToSuspectOpen(false)}
          />
        )}

        {promoteToVictimOpen && (
          <PromoteToVictimDrawer
            personId={person.id}
            open={promoteToVictimOpen}
            onClose={() => setPromoteToVictimOpen(false)}
          />
        )}

        {promoteToWitnessOpen && (
          <PromoteToWitnessDrawer
            personId={person.id}
            open={promoteToWitnessOpen}
            onClose={() => setPromoteToWitnessOpen(false)}
          />
        )}
      </div>
    </PermissionGuard>
  )
}

export default PersonDetail
