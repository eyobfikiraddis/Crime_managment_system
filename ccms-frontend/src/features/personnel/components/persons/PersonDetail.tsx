'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@shared/stores/auth.store'
import { Permission } from '@shared/constants/permissions'
import { SensitiveField } from '@shared/components/display/SensitiveField'
import { usePersonDetail } from '@features/personnel/hooks/usePersonDetail'
import { logPIIRevealEvent } from '@services/domain/audit.service'

type Props = { personId: string }

function maskNationalId(value: string | null) {
  if (!value) return '-'
  // If already masked (contains '*'), return as-is
  if (value.includes('*')) return value
  const last = value.slice(-4)
  return `***-***-${last}`
}

export function PersonDetail({ personId }: Props) {
  const t = useTranslations('personnel')
  const canReveal = useAuthStore((s) => s.permissions.includes(Permission.PII_REVEAL))

  const { data: person, isLoading } = usePersonDetail(personId)

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!person) return <div>{t('persons.detail.notFound')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-md p-4">
        <h2 className="text-lg font-semibold">{person.firstName} {person.lastName}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-muted">{t('persons.detail.identity.nationalId')}</div>
            <SensitiveField
              value={person.pii.nationalId ?? ''}
              maskedValue={maskNationalId(person.pii.nationalId)}
              canReveal={canReveal}
              onReveal={() => void logPIIRevealEvent(person.id, 'nationalId', 'person')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-muted">{t('persons.detail.identity.dateOfBirth')}</div>
            <SensitiveField
              value={person.pii.dateOfBirth ?? ''}
              maskedValue={person.pii.dateOfBirth ? new Date(person.pii.dateOfBirth).getFullYear().toString() : '-'}
              canReveal={canReveal}
              onReveal={() => void logPIIRevealEvent(person.id, 'dateOfBirth', 'person')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-muted">{t('persons.detail.identity.phone')}</div>
            <SensitiveField
              value={person.pii.phone ?? ''}
              maskedValue={person.pii.phone ? person.pii.phone.replace(/\d(?=\d{3})/g, '*') : '-'}
              canReveal={canReveal}
              onReveal={() => void logPIIRevealEvent(person.id, 'phone', 'person')}
            />
          </div>
        </div>
      </div>

      {/* Role cards and cases table will be implemented in further steps */}
    </div>
  )
}

export default PersonDetail
