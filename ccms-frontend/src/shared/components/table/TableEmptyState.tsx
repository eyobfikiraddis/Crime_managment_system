import type { ReactNode } from 'react'

import { EmptyState } from '@/shared/components/display/EmptyState'

interface TableEmptyStateProps {
  message?: string
  action?: ReactNode
}

export function TableEmptyState({
  message = 'No records match your filters.',
  action,
}: TableEmptyStateProps) {
  return <EmptyState title="No results" description={message} action={action} />
}
