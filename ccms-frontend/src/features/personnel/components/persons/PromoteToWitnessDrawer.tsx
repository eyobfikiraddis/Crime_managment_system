'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePromoteToWitness } from '@features/personnel/hooks/usePromoteToWitness'

type Props = { personId: string; onClose?: () => void }

export default function PromoteToWitnessDrawer({ personId, onClose }: Props) {
  const t = useTranslations('personnel')
  const promote = usePromoteToWitness(personId)
  const [credibilityNotes, setCredibilityNotes] = useState('')
  const [isProtected, setIsProtected] = useState(false)
  const [protectionLevel, setProtectionLevel] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await promote.mutateAsync({ credibilityNotes, isProtected, protectionLevel: protectionLevel || null })
      onClose?.()
    } catch (e) {}
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('persons.promoteToWitness.drawerTitle')}</h3>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <textarea value={credibilityNotes} onChange={(e) => setCredibilityNotes(e.target.value)} placeholder={t('persons.promoteToWitness.credibilityPlaceholder') ?? 'Credibility notes'} className="textarea" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isProtected} onChange={(e) => setIsProtected(e.target.checked)} />
          <span>{t('persons.promoteToWitness.protectionLabel') ?? 'Protected witness'}</span>
        </label>
        {isProtected && (
          <input value={protectionLevel} onChange={(e) => setProtectionLevel(e.target.value)} placeholder={t('persons.promoteToWitness.protectionLevelPlaceholder') ?? 'Protection level'} className="input" />
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{t('persons.promoteToWitness.submitButton') ?? 'Promote'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('persons.promoteToWitness.cancelButton') ?? 'Cancel'}</button>
        </div>
      </form>
    </div>
  )
}
