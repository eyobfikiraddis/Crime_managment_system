import type { Meta, StoryObj } from '@storybook/react'
import { ForbiddenState } from './ForbiddenState'
import React from 'react'

const meta: Meta<typeof ForbiddenState> = {
  title: 'Shared/Feedback/ForbiddenState',
  component: ForbiddenState,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ForbiddenState>

export const Default: Story = {
  args: {
    title: 'Access Restricted',
    description: 'You do not have the required permissions to view this legal evidence file. Superadmin privileges required.',
  },
}

export const WithAction: Story = {
  args: {
    title: 'Unauthorized Action',
    description: 'Your user profile (Investigator) is not authorized to edit case sentences.',
    action: React.createElement('button', { className: 'px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md' }, 'Request Promotion'),
  },
}
