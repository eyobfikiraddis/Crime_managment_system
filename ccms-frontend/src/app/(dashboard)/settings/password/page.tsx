import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { Info } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings')
  return { title: `Change Password - ${t('pageTitle')}` }
}

export default async function SettingsPasswordPage() {
  const t = await getTranslations('settings')

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('heading')} - Security</h1>
      <EmptyState
        title="Change Password"
        description="This change password utility is scheduled for development in a future release phase."
        icon={Info}
      />
    </div>
  )
}
