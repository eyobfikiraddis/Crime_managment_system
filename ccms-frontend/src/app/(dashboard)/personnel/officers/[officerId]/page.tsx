import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Officer Detail',
}

type PageProps = {
  params: { officerId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function OfficerDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Personnel — Officer Detail [Skeleton]</h1>
    </div>
  )
}
