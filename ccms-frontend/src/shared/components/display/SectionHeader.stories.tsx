import type { Meta, StoryObj } from '@storybook/react'
import { SectionHeader } from './SectionHeader'
import React from 'react'

const meta: Meta<typeof SectionHeader> = {
  title: 'Shared/Display/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SectionHeader>

export const Default: Story = {
  args: {
    title: 'Evidence Log',
    description: 'All recorded physical and digital evidence associated with this investigation.',
  },
}

export const WithActions: Story = {
  args: {
    title: 'Charges List',
    description: 'Current filed offenses and conviction records.',
    actions: React.createElement('button', { className: 'px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded' }, '+ Add Charge'),
  },
}
