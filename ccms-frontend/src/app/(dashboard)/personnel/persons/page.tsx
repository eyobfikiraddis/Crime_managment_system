import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Persons',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function PersonsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Personnel — Persons [Skeleton]</h1>
    </div>
  )
}
