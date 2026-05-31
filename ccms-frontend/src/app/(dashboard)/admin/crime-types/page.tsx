import { getTranslations } from 'next-intl/server'
import { CrimeTypesList } from '@features/admin'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('crimeTypes.pageTitle') }
}

export default function CrimeTypesPage() {
  return <CrimeTypesList />
}
