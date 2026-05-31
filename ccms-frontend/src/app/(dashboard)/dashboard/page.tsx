import { getTranslations } from 'next-intl/server'
import { DashboardPage } from '@features/dashboard/components/DashboardPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard')
  return { title: t('pageTitle') }
}

export default function Dashboard() {
  return <DashboardPage />
}
