'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Shield, ShieldAlert, ShieldCheck, UserMinus, Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetadataCard } from '@/shared/components/display/MetadataCard'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'
import { PersonRole } from '@features/personnel/types/personnel.types'
import type { Person } from '@features/personnel/types/personnel.types'
import { RISK_LEVEL_VARIANTS } from '@features/personnel/utils/personnelUtils'

interface PersonRoleCardsProps {
  person: Person
  onDemote?: (role: PersonRole) => void
}

export function PersonRoleCards({ person, onDemote }: PersonRoleCardsProps) {
  const t = useTranslations('personnel')

  const hasSuspect = person.suspectProfile !== null
  const hasVictim = person.victimProfile !== null
  const hasWitness = person.witnessProfile !== null
  const hasAnyRole = hasSuspect || hasVictim || hasWitness

  if (!hasAnyRole) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-muted/10 p-3 text-foreground-muted mb-3">
            <UserMinus className="size-6 text-foreground-muted opacity-60" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('persons.detail.rolesSection.noRoles')}
          </h4>
          <p className="text-xs text-foreground-muted max-w-sm mt-1">
            {t('persons.detail.rolesSection.noRolesDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-base font-semibold text-foreground border-b border-border pb-2">
        {t('persons.detail.rolesSection.title')}
      </div>

      {person.suspectProfile && (
        <MetadataCard
          title={t('persons.detail.suspectCard.title')}
          actions={
            <StatusBadge
              status={t('persons.role.SUSPECT')}
              variant="warning"
            />
          }
          items={[
            {
              label: t('persons.detail.suspectCard.riskLevel'),
              value: (
                <StatusBadge
                  status={t(`persons.riskLevel.${person.suspectProfile.riskLevel}`)}
                  variant={RISK_LEVEL_VARIANTS[person.suspectProfile.riskLevel]}
                />
              ),
            },
            {
              label: t('persons.detail.suspectCard.notes'),
              value: (
                <p className="text-sm text-foreground">
                  {person.suspectProfile.notes || (
                    <span className="text-foreground-muted italic">
                      {t('persons.detail.suspectCard.noNotes')}
                    </span>
                  )}
                </p>
              ),
            },
            {
              label: t('persons.detail.suspectCard.promotedAt'),
              value: format(new Date(person.suspectProfile.promotedAt), 'dd MMM yyyy HH:mm'),
            },
            {
              label: t('persons.detail.suspectCard.promotedBy'),
              value: (
                <span className="font-mono text-xs">
                  {person.suspectProfile.promotedByOfficerId}
                </span>
              ),
            },
          ]}
        >
          <PermissionGuard permission={Permission.ADMIN_MANAGE}>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                onClick={() => onDemote?.(PersonRole.SUSPECT)}
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                {t('persons.demoteRole.buttonLabel')}
              </Button>
            </div>
          </PermissionGuard>
        </MetadataCard>
      )}

      {person.victimProfile && (
        <MetadataCard
          title={t('persons.detail.victimCard.title')}
          actions={
            <StatusBadge
              status={t('persons.role.VICTIM')}
              variant="muted"
            />
          }
          items={[
            {
              label: t('persons.detail.victimCard.notes'),
              value: (
                <p className="text-sm text-foreground">
                  {person.victimProfile.notes || (
                    <span className="text-foreground-muted italic">
                      {t('persons.detail.victimCard.noNotes')}
                    </span>
                  )}
                </p>
              ),
            },
            {
              label: t('persons.detail.victimCard.promotedAt'),
              value: format(new Date(person.victimProfile.promotedAt), 'dd MMM yyyy HH:mm'),
            },
            {
              label: t('persons.detail.victimCard.promotedBy'),
              value: (
                <span className="font-mono text-xs">
                  {person.victimProfile.promotedByOfficerId}
                </span>
              ),
            },
          ]}
        >
          <PermissionGuard permission={Permission.ADMIN_MANAGE}>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                onClick={() => onDemote?.(PersonRole.VICTIM)}
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                {t('persons.demoteRole.buttonLabel')}
              </Button>
            </div>
          </PermissionGuard>
        </MetadataCard>
      )}

      {person.witnessProfile && (
        <MetadataCard
          title={t('persons.detail.witnessCard.title')}
          actions={
            <div className="flex gap-2">
              {person.witnessProfile.isProtected && (
                <StatusBadge
                  status={t('persons.promoteToWitness.protectedBadge')}
                  variant="accent"
                />
              )}
              <StatusBadge
                status={t('persons.role.WITNESS')}
                variant="primary"
              />
            </div>
          }
          items={[
            {
              label: t('persons.detail.witnessCard.isProtected'),
              value: (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {person.witnessProfile.isProtected ? (
                    <>
                      <ShieldCheck className="size-4 text-success" />
                      <span className="text-success">{t('persons.promoteToWitness.isProtectedLabel')}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="size-4 text-foreground-muted opacity-50" />
                      <span className="text-foreground-muted">{t('persons.detail.witnessCard.notProtected')}</span>
                    </>
                  )}
                </div>
              ),
            },
            {
              label: t('persons.detail.witnessCard.protectionLevel'),
              value: person.witnessProfile.protectionLevel || '—',
            },
            {
              label: t('persons.detail.witnessCard.credibilityNotes'),
              value: (
                <p className="text-sm text-foreground">
                  {person.witnessProfile.credibilityNotes || (
                    <span className="text-foreground-muted italic">
                      {t('persons.detail.witnessCard.noNotes')}
                    </span>
                  )}
                </p>
              ),
            },
            {
              label: t('persons.detail.witnessCard.promotedAt'),
              value: format(new Date(person.witnessProfile.promotedAt), 'dd MMM yyyy HH:mm'),
            },
            {
              label: t('persons.detail.witnessCard.promotedBy'),
              value: (
                <span className="font-mono text-xs">
                  {person.witnessProfile.promotedByOfficerId}
                </span>
              ),
            },
          ]}
        >
          <PermissionGuard permission={Permission.ADMIN_MANAGE}>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                onClick={() => onDemote?.(PersonRole.WITNESS)}
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                {t('persons.demoteRole.buttonLabel')}
              </Button>
            </div>
          </PermissionGuard>
        </MetadataCard>
      )}
    </div>
  )
}
export default PersonRoleCards
