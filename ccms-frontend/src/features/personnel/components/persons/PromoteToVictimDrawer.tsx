'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePromoteToVictim } from '@features/personnel/hooks/usePromoteToVictim'

type Props = { personId: string; onClose?: () => void }

export default function PromoteToVictimDrawer({ personId, onClose }: Props) {
  const t = useTranslations('personnel')
  const promote = usePromoteToVictim(personId)
  const [notes, setNotes] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await promote.mutateAsync({ notes })
      onClose?.()
    } catch (e) {}
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('persons.promoteToVictim.drawerTitle')}</h3>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('persons.promoteToVictim.notesPlaceholder') ?? 'Notes'} className="textarea" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{t('persons.promoteToVictim.submitButton') ?? 'Promote'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('persons.promoteToVictim.cancelButton') ?? 'Cancel'}</button>
        </div>
      </form>
    </div>
  )
}
