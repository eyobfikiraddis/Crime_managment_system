import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Court Cases',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function CourtCasesPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Legal — Court Cases [Skeleton]</h1>
    </div>
  )
}
