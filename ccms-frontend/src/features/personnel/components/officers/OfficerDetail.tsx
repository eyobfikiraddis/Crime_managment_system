'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@shared/stores/auth.store'
import { Permission } from '@shared/constants/permissions'
import { SensitiveField } from '@shared/components/display/SensitiveField'
import { useOfficerDetail } from '@features/personnel/hooks/useOfficerDetail'
import { useActivateOfficer } from '@features/personnel/hooks/useActivateOfficer'
import { useDeactivateOfficer } from '@features/personnel/hooks/useDeactivateOfficer'
import { useResetOfficerPassword } from '@features/personnel/hooks/useResetOfficerPassword'
import { getRecentActivityForEntity } from '@services/domain/audit.service'
import { useEffect, useState } from 'react'

type Props = { officerId: string }

export function OfficerDetail({ officerId }: Props) {
  const t = useTranslations('personnel')
  const hasManage = useAuthStore((s) => s.permissions.includes(Permission.PERSONNEL_MANAGE))

  const { data: officer, isLoading } = useOfficerDetail(officerId)

  const activate = useActivateOfficer(officerId)
  const deactivate = useDeactivateOfficer(officerId)
  const resetPwd = useResetOfficerPassword(officerId)

  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    if (!officerId) return
    void getRecentActivityForEntity('officer', officerId, 5).then((res) => {
      if (mounted) setRecent(res.data ?? [])
    }).catch(() => {})
    return () => { mounted = false }
  }, [officerId])

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!officer) return <div>{t('officers.detail.notFound')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-md p-4">
        <h2 className="text-lg font-semibold">{officer.firstName} {officer.lastName}</h2>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-muted">{t('officers.detail.badgeNumber')}</div>
            <div className="text-sm text-foreground">{officer.badgeNumber}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-muted">{t('officers.detail.phone')}</div>
            <SensitiveField
              value={officer.phone ?? ''}
              maskedValue={officer.phone ? officer.phone.replace(/\d(?=\d{3})/g, '*') : '-'}
              canReveal={hasManage}
              onReveal={() => void getRecentActivityForEntity('officer', officer.id, 5)}
            />
          </div>

          <div className="flex gap-2 mt-3">
            {hasManage && officer.status === 'INACTIVE' && (
              <button className="btn" onClick={() => void activate.mutateAsync()}>
                {t('officers.detail.actions.activate')}
              </button>
            )}
            {hasManage && officer.status === 'ACTIVE' && (
              <button className="btn" onClick={() => { if (confirm(t('officers.detail.actions.deactivateConfirm'))) void deactivate.mutateAsync() }}>
                {t('officers.detail.actions.deactivate')}
              </button>
            )}
            {hasManage && (
              <button className="btn" onClick={() => { if (confirm(t('officers.detail.actions.resetConfirm'))) void resetPwd.mutateAsync() }}>
                {t('officers.detail.actions.resetPassword')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md p-4">
        <h3 className="font-medium">{t('persons.detail.recentActivity')}</h3>
        <ul className="mt-2 list-disc list-inside text-sm text-foreground-muted">
          {recent.length === 0 && <li>{t('common.empty')}</li>}
          {recent.map((r) => (
            <li key={r.id}>{r.eventType} — {r.actorName} — {new Date(r.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default OfficerDetail
