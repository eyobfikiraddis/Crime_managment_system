import { getTranslations } from 'next-intl/server'
import { SystemHealthPanel } from '@features/admin'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin')
  return { title: t('health.pageTitle') }
}

export default function HealthPage() {
  return <SystemHealthPanel />
}
