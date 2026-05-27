import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { Info } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: `Locations - ${t('pageTitle')}` }
}

export default async function AdminLocationsPage() {
  const t = await getTranslations('admin')

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('heading')} - Locations</h1>
      <EmptyState
        title="Manage Locations"
        description="This admin tool is scheduled for development in a future release phase."
        icon={Info}
      />
    </div>
  )
}
