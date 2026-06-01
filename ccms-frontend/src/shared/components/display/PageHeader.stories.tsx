import type { Meta, StoryObj } from '@storybook/react'
import { PageHeader } from './PageHeader'
import React from 'react'

const meta: Meta<typeof PageHeader> = {
  title: 'Shared/Display/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    title: 'Cases Dashboard',
    description: 'Monitor active criminal investigations, court proceedings, and assigned departments.',
  },
}

export const WithActionsAndBreadcrumbs: Story = {
  args: {
    title: 'Case Detail #CCMS-2026-0089',
    description: 'Suspect: John Doe | Assault & Robbery Case file',
    breadcrumb: React.createElement(
      'nav',
      { className: 'flex space-x-2 text-xs text-foreground-muted' },
      React.createElement('span', null, 'Cases'),
      React.createElement('span', null, '/'),
      React.createElement('span', null, 'CCMS-2026-0089')
    ),
    actions: React.createElement(
      'div',
      { className: 'flex gap-2' },
      React.createElement('button', { className: 'px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-md' }, 'Export PDF'),
      React.createElement('button', { className: 'px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md' }, 'Assign Investigator')
    ),
  },
}
