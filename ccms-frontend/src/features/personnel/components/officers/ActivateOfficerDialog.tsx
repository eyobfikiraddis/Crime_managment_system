'use client'

import { useTranslations } from 'next-intl'
import { useActivateOfficer } from '@features/personnel/hooks/useActivateOfficer'

type Props = { officerId: string; onClose?: () => void }

export default function ActivateOfficerDialog({ officerId, onClose }: Props) {
  const t = useTranslations('personnel')
  const activate = useActivateOfficer(officerId)

  const confirm = async () => {
    try {
      await activate.mutateAsync()
      onClose?.()
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('officers.activate.title')}</h3>
      <p className="text-sm text-foreground-muted mt-2">{t('officers.activate.description')}</p>
      <div className="flex gap-2 mt-4">
        <button className="btn-primary" onClick={confirm}>{t('officers.activate.confirmButton')}</button>
        <button className="btn-ghost" onClick={onClose}>{t('officers.activate.cancelButton')}</button>
      </div>
    </div>
  )
}
