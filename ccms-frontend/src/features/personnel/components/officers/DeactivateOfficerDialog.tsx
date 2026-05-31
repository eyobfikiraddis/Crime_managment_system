'use client'

import { useTranslations } from 'next-intl'
import { useDeactivateOfficer } from '@features/personnel/hooks/useDeactivateOfficer'

type Props = { officerId: string; onClose?: () => void }

export default function DeactivateOfficerDialog({ officerId, onClose }: Props) {
  const t = useTranslations('personnel')
  const deactivate = useDeactivateOfficer(officerId)

  const confirm = async () => {
    try {
      await deactivate.mutateAsync()
      onClose?.()
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('officers.deactivate.title')}</h3>
      <p className="text-sm text-foreground-muted mt-2">{t('officers.deactivate.description')}</p>
      <div className="flex gap-2 mt-4">
        <button className="btn-destructive" onClick={confirm}>{t('officers.deactivate.confirmButton')}</button>
        <button className="btn-ghost" onClick={onClose}>{t('officers.deactivate.cancelButton')}</button>
      </div>
    </div>
  )
}
