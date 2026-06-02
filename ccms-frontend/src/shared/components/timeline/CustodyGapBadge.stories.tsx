import type { Meta, StoryObj } from '@storybook/react'
import { CustodyGapBadge } from './CustodyGapBadge'

const meta: Meta<typeof CustodyGapBadge> = {
  title: 'Shared/Timeline/CustodyGapBadge',
  component: CustodyGapBadge,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CustodyGapBadge>

export const Default: Story = {
  args: {
    gapHours: 2.5,
    fromTimestamp: '2026-06-01T08:00:00Z',
    toTimestamp: '2026-06-01T10:30:00Z',
  },
}

export const LargeGap: Story = {
  args: {
    gapHours: 48,
    fromTimestamp: '2026-05-30T09:00:00Z',
    toTimestamp: '2026-06-01T09:00:00Z',
  },
}
