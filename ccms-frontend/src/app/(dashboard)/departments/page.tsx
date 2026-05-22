import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Departments',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function DepartmentsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Departments — List [Skeleton]</h1>
    </div>
  )
}
