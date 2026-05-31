'use client'

import { useState } from 'react'
import type { RiskLevel } from '@features/personnel/types/personnel.types'
import { useTranslations } from 'next-intl'
import { usePromoteToSuspect } from '@features/personnel/hooks/usePromoteToSuspect'

type Props = { personId: string; onClose?: () => void }

export default function PromoteToSuspectDrawer({ personId, onClose }: Props) {
  const t = useTranslations('personnel')
  const promote = usePromoteToSuspect(personId)
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('MEDIUM')
  const [notes, setNotes] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await promote.mutateAsync({ riskLevel, notes })
      onClose?.()
    } catch (e) {}
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('persons.promoteToSuspect.drawerTitle')}</h3>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as unknown as RiskLevel)} className="input">
          <option value="LOW">{t('riskLevel.LOW')}</option>
          <option value="MEDIUM">{t('riskLevel.MEDIUM')}</option>
          <option value="HIGH">{t('riskLevel.HIGH')}</option>
        </select>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('persons.promoteToSuspect.notesPlaceholder') ?? 'Notes'} className="textarea" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{t('persons.promoteToSuspect.submitButton') ?? 'Promote'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('persons.promoteToSuspect.cancelButton') ?? 'Cancel'}</button>
        </div>
      </form>
    </div>
  )
}
