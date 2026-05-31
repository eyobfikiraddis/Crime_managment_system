'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SensitiveField } from '@/shared/components/display/SensitiveField'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Permission } from '@/shared/constants/permissions'
import { apiClient } from '@services/api/client'
import { RISK_LEVEL_VARIANTS } from '@features/personnel/utils/personnelUtils'
import type { Person } from '@features/personnel/types/personnel.types'

interface PersonIdentityCardProps {
  person: Person
}

function logPIIRevealEvent(personId: string, field: string): void {
  void apiClient
    .post(`/api/v1/personnel/persons/${personId}/pii-access`, { field })
    .catch(() => {
      // Silent fail — audit failure must not block the reveal UX
    })
}

function getMaskedNationalId(value: string | null): string {
  if (!value) return '—'
  if (value.includes('*')) return value
  const last = value.slice(-4)
  return `***-***-${last}`
}

function getMaskedDOB(value: string | null): string {
  if (!value) return '—'
  if (value.length <= 4) return value // Already year only
  try {
    return new Date(value).getFullYear().toString()
  } catch {
    return value
  }
}

function getMaskedPhone(value: string | null): string {
  if (!value) return '—'
  if (value.includes('*')) return value
  const last = value.slice(-3)
  return `+251 *** *** ${last}`
}

export function PersonIdentityCard({ person }: PersonIdentityCardProps) {
  const t = useTranslations('personnel')
  const permissions = useAuthStore((state) => state.permissions)
  const canReveal = permissions.includes(Permission.PII_REVEAL)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t('persons.detail.identityCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.firstName')}
              </p>
              <p className="text-sm font-medium text-foreground">{person.firstName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.lastName')}
              </p>
              <p className="text-sm font-medium text-foreground">{person.lastName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.nationalId')}
              </p>
              <SensitiveField
                value={person.pii.nationalId ?? '—'}
                maskedValue={getMaskedNationalId(person.pii.nationalId)}
                canReveal={canReveal}
                onReveal={() => logPIIRevealEvent(person.id, 'nationalId')}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.dateOfBirth')}
              </p>
              <SensitiveField
                value={person.pii.dateOfBirth ? format(new Date(person.pii.dateOfBirth), 'dd MMM yyyy') : '—'}
                maskedValue={getMaskedDOB(person.pii.dateOfBirth)}
                canReveal={canReveal}
                onReveal={() => logPIIRevealEvent(person.id, 'dateOfBirth')}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.gender')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {person.gender ? t(`persons.gender.${person.gender}`) : '—'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.riskLevel')}
              </p>
              <div>
                {person.riskLevel ? (
                  <StatusBadge
                    status={t(`persons.riskLevel.${person.riskLevel}`)}
                    variant={RISK_LEVEL_VARIANTS[person.riskLevel]}
                  />
                ) : (
                  <span className="text-sm text-foreground-muted">—</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.phone')}
              </p>
              <SensitiveField
                value={person.pii.phone ?? '—'}
                maskedValue={getMaskedPhone(person.pii.phone)}
                canReveal={canReveal}
                onReveal={() => logPIIRevealEvent(person.id, 'phone')}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase text-foreground-muted">
                {t('persons.detail.identityCard.address')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {person.address ?? (
                  <span className="text-foreground-muted italic">
                    {t('persons.detail.identityCard.noAddress')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 flex flex-wrap justify-between gap-4 border-t border-border pt-4 text-xs text-foreground-muted">
          <div>
            <span>{t('persons.detail.identityCard.createdAt')}: </span>
            <span className="font-medium text-foreground">
              {format(new Date(person.createdAt), 'dd MMM yyyy HH:mm')}
            </span>
          </div>
          <div>
            <span>{t('persons.detail.identityCard.updatedAt')}: </span>
            <span className="font-medium text-foreground">
              {format(new Date(person.updatedAt), 'dd MMM yyyy HH:mm')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
