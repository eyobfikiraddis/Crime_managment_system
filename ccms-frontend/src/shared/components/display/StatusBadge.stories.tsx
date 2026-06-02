import type { Meta, StoryObj } from '@storybook/react'
import { StatusBadge } from './StatusBadge'

const meta: Meta<typeof StatusBadge> = {
  title: 'Shared/Display/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'warning', 'destructive', 'success', 'accent', 'muted'],
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusBadge>

export const Primary: Story = {
  args: {
    status: 'Active',
    variant: 'primary',
  },
}

export const Success: Story = {
  args: {
    status: 'Completed',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    status: 'Under Investigation',
    variant: 'warning',
  },
}

export const Destructive: Story = {
  args: {
    status: 'Closed',
    variant: 'destructive',
  },
}

export const Muted: Story = {
  args: {
    status: 'Archived',
    variant: 'muted',
  },
}
