import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Officers',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseOfficersPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Officers [Skeleton]</h1>
    </div>
  )
}
