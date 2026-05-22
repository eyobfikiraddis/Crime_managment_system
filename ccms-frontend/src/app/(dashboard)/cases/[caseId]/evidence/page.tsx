import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Evidence',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseEvidencePage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Evidence [Skeleton]</h1>
    </div>
  )
}
