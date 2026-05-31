import { getTranslations } from 'next-intl/server'
import { DepartmentsList } from '@features/departments'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('departments')
  return { title: t('pageTitle') }
}

export default function DepartmentsPage() {
  return <DepartmentsList />
}
