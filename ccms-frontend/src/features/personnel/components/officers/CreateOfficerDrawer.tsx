'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateOfficer } from '@features/personnel/hooks/useCreateOfficer'

type Props = { onClose?: () => void }

export default function CreateOfficerDrawer({ onClose }: Props) {
  const t = useTranslations('personnel')
  const create = useCreateOfficer()

  const [form, setForm] = useState({ badgeNumber: '', firstName: '', lastName: '', email: '', role: '', departmentId: '', phone: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // @ts-expect-error allow partial casting
      await create.mutateAsync(form)
      onClose?.()
    } catch (e) {
      // handled by hook
    }
  }

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-medium">{t('officers.create.drawerTitle')}</h3>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <input value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} placeholder={t('officers.create.badgeNumberPlaceholder') ?? 'Badge'} className="input" />
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={t('officers.create.firstNamePlaceholder') ?? 'First name'} className="input" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder={t('officers.create.lastNamePlaceholder') ?? 'Last name'} className="input" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('officers.create.emailPlaceholder') ?? 'email@example.com'} className="input" />
        <div className="flex gap-2">
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={t('officers.create.rolePlaceholder') ?? 'Role'} className="input" />
          <input value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} placeholder={t('officers.create.departmentPlaceholder') ?? 'Dept ID'} className="input" />
        </div>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('officers.create.phonePlaceholder') ?? 'Phone'} className="input" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{t('officers.create.submitButton') ?? 'Create'}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('officers.create.cancelButton') ?? 'Cancel'}</button>
        </div>
      </form>
    </div>
  )
}
