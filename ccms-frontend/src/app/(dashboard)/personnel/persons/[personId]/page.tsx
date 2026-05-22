import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Person Detail',
}

type PageProps = {
  params: { personId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function PersonDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Personnel — Person Detail [Skeleton]</h1>
    </div>
  )
}
