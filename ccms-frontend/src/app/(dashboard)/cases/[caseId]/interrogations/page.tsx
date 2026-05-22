import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Interrogations',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseInterrogationsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Interrogations [Skeleton]</h1>
    </div>
  )
}
