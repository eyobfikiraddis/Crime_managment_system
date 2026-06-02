import type { Meta, StoryObj } from '@storybook/react'
import { MetadataCard } from './MetadataCard'
import React from 'react'

const meta: Meta<typeof MetadataCard> = {
  title: 'Shared/Display/MetadataCard',
  component: MetadataCard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MetadataCard>

export const Default: Story = {
  args: {
    title: 'Case Overview',
    items: [
      { label: 'Case ID', value: 'CCMS-2026-0089' },
      { label: 'Date Filed', value: '2026-06-01' },
      { label: 'Priority', value: 'High' },
      { label: 'Assigned Officer', value: 'Detective Eyob Fikir' },
    ],
  },
}

export const WithActions: Story = {
  args: {
    title: 'Investigator Details',
    items: [
      { label: 'Name', value: 'Sara Haile' },
      { label: 'Badge Number', value: 'BD-8902' },
      { label: 'Department', value: 'Homicide Division' },
      { label: 'Status', value: 'Active' },
    ],
    actions: React.createElement('button', { className: 'text-xs text-primary font-medium hover:underline' }, 'Edit Profile'),
  },
}
