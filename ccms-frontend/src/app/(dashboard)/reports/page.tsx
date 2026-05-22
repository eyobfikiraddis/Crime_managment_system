import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function ReportsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Reports — Overview [Skeleton]</h1>
    </div>
  )
}
