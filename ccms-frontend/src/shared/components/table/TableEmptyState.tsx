import type { ReactNode } from 'react'

import { EmptyState } from '@/shared/components/display/EmptyState'

interface TableEmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function TableEmptyState({ title, description, action }: TableEmptyStateProps) {
  return <EmptyState title={title} description={description ?? 'No data found.'} action={action} />
}
