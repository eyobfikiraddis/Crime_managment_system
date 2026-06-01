import { getTranslations } from 'next-intl/server'
import { GlobalAuditLog } from '@features/audit/components/GlobalAuditLog'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('audit')
  return { title: t('pageTitle') }
}

export default function AuditLogPage() {
  return <GlobalAuditLog />
}
