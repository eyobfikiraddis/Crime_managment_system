import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Officers',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function OfficersPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Personnel — Officers [Skeleton]</h1>
    </div>
  )
}
