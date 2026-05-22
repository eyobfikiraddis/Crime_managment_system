import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Reports',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseReportsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Reports [Skeleton]</h1>
    </div>
  )
}
