import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Legal',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CaseLegalPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Legal [Skeleton]</h1>
    </div>
  )
}
