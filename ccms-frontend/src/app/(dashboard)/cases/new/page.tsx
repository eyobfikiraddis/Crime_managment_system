import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Case',
}

type PageProps = {
  params: Record<string, string>
  searchParams: Record<string, string | string[] | undefined>
}

export default function NewCasePage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — New [Skeleton]</h1>
    </div>
  )
}
