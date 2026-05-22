import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function DashboardPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Dashboard [Skeleton]</h1>
    </div>
  )
}
