import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Overview',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseOverviewPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Overview [Skeleton]</h1>
    </div>
  )
}
