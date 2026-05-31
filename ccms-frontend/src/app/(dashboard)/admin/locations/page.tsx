import { getTranslations } from 'next-intl/server'
import { LocationsList } from '@features/admin'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('locations.pageTitle') }
}

export default function LocationsPage() {
  return <LocationsList />
}
