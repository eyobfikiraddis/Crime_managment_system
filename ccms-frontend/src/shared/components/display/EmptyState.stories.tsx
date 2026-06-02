import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'
import { FolderOpen } from 'lucide-react'
import React from 'react'

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: 'No documents found',
    description: 'There are no files uploaded for this section yet.',
    icon: FolderOpen,
  },
}

export const WithAction: Story = {
  args: {
    title: 'No physical evidence logged',
    description: 'Begin logging physical evidence items for chain of custody verification.',
    icon: FolderOpen,
    action: React.createElement('button', { className: 'px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md' }, 'Log New Evidence'),
  },
}
