import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Department Detail',
}

type PageProps = {
  params: { departmentId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function DepartmentDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Departments — Detail [Skeleton]</h1>
    </div>
  )
}
