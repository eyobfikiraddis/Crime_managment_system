import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cases',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function CasesListPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — List [Skeleton]</h1>
    </div>
  )
}
