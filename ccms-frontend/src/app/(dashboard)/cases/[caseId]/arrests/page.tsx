import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Arrests',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseArrestsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Arrests [Skeleton]</h1>
    </div>
  )
}
