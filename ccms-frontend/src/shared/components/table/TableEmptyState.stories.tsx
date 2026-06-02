import type { Meta, StoryObj } from '@storybook/react'
import { TableEmptyState } from './TableEmptyState'
import React from 'react'

const meta: Meta<typeof TableEmptyState> = {
  title: 'Shared/Table/TableEmptyState',
  component: TableEmptyState,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TableEmptyState>

export const Default: Story = {
  args: {
    title: 'No Active Investigations',
    description: 'No cases are currently assigned to your department.',
  },
}

export const WithAction: Story = {
  args: {
    title: 'No Court Schedules Found',
    description: 'Create a new court hearing entry to begin tracking.',
    action: React.createElement('button', { className: 'px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md' }, 'Add Hearing'),
  },
}
