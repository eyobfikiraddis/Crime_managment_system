'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreatePerson } from '@features/personnel/hooks/useCreatePerson'

type Props = { onClose?: () => void }

export default function CreatePersonDrawer({ onClose }: Props) {
  const t = useTranslations('personnel')
  const create = useCreatePerson()

  const [form, setForm] = useState({ firstName: '', lastName: '', gender: '', nationalId: '', dateOfBirth: '', phone: '', address: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // @ts-expect-error relaxed cast
      await create.mutateAsync(form)
      onClose?.()
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('persons.create.drawerTitle')}</h3>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={t('persons.create.firstNamePlaceholder') ?? 'First name'} className="input" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder={t('persons.create.lastNamePlaceholder') ?? 'Last name'} className="input" />
        <input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder={t('persons.create.nationalIdPlaceholder') ?? 'National ID'} className="input" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('persons.create.phonePlaceholder') ?? 'Phone'} className="input" />
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('persons.create.addressPlaceholder') ?? 'Address'} className="textarea" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{t('persons.create.submitButton') ?? 'Add Person'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('persons.create.cancelButton') ?? 'Cancel'}</button>
        </div>
      </form>
    </div>
  )
}
