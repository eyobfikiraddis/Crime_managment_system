'use client'

import { useTranslations } from 'next-intl'
import { useResetOfficerPassword } from '@features/personnel/hooks/useResetOfficerPassword'

type Props = { officerId: string; onClose?: () => void }

export default function ResetPasswordDialog({ officerId, onClose }: Props) {
  const t = useTranslations('personnel')
  const reset = useResetOfficerPassword(officerId)

  const confirm = async () => {
    try {
      await reset.mutateAsync()
      onClose?.()
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('officers.resetPassword.title')}</h3>
      <p className="text-sm text-foreground-muted mt-2">{t('officers.resetPassword.description')}</p>
      <div className="flex gap-2 mt-4">
        <button className="btn-primary" onClick={confirm}>{t('officers.resetPassword.confirmButton')}</button>
        <button className="btn-ghost" onClick={onClose}>{t('officers.resetPassword.cancelButton')}</button>
      </div>
    </div>
  )
}
