import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('departments')
  return { title: t('pageTitle') }
}

type PageProps = {
  params: { departmentId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function DepartmentDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  const t = await getTranslations('departments')

  return (
    <div>
      <h1>{t('detail.heading')}</h1>
    </div>
  )
}
