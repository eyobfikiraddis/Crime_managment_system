import { getTranslations } from 'next-intl/server'
import { DepartmentReports } from '@features/reports/components/departments/DepartmentReports'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports')
  return { title: `${t('departments.pageTitle')} | ${t('pageTitle')}` }
}

export default function DepartmentReportsPage() {
  return <DepartmentReports />
}
