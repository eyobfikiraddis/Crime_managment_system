import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Permissions',
}

type PageProps = {
  params: { caseId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function CasePermissionsPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Cases — Permissions [Skeleton]</h1>
    </div>
  )
}
