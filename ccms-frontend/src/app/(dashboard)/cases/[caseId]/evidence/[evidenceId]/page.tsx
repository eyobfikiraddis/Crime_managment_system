import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence Detail',
}

type PageProps = {
  params: { caseId: string; evidenceId: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function EvidenceDetailPage({ params, searchParams }: PageProps) {
  void params
  void searchParams

  return (
    <div>
      <h1>Evidence — Detail [Skeleton]</h1>
    </div>
  )
}
