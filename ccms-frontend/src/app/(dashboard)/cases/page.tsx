import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { CasesListView } from '@features/cases/components/CasesListView'
import { TableSkeleton } from '@shared/components/table/TableSkeleton'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}

export default async function CasesListPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={8} rows={10} />}>
      <CasesListView />
    </Suspense>
  )
}
