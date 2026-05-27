import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { Info } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings')
  return { title: `Profile Settings - ${t('pageTitle')}` }
}

export default async function SettingsProfilePage() {
  const t = await getTranslations('settings')

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('heading')} - Profile</h1>
      <EmptyState
        title="Profile Settings"
        description="This profile management page is scheduled for development in a future release phase."
        icon={Info}
      />
    </div>
  )
}
