import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Timeline',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseTimelinePage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Timeline [Skeleton]</h1>
    </div>
  )
}
