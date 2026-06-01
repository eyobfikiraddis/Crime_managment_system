import type { Meta, StoryObj } from '@storybook/react'
import { ErrorState } from './ErrorState'

const meta: Meta<typeof ErrorState> = {
  title: 'Shared/Feedback/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ErrorState>

export const Default: Story = {
  args: {
    title: 'Connection Lost',
    description: 'We are unable to establish connection to the primary database. Please check your network.',
  },
}

export const WithRetry: Story = {
  args: {
    title: 'Failed to load case logs',
    description: 'An unexpected API timeout occurred while fetching the audit records.',
    retryLabel: 'Retry Request',
    retry: () => console.log('Retrying case logs fetch...'),
  },
}
