import type { Meta, StoryObj } from '@storybook/react'
import { DiffViewer } from './DiffViewer'

const meta: Meta<typeof DiffViewer> = {
  title: 'Shared/Timeline/DiffViewer',
  component: DiffViewer,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DiffViewer>

export const SingleFieldChange: Story = {
  args: {
    diff: {
      fields: [
        {
          field: 'caseStatus',
          before: 'UNDER_INVESTIGATION',
          after: 'REFERRED_TO_COURT',
        },
      ],
    },
  },
}

export const MultipleFieldsChange: Story = {
  args: {
    diff: {
      fields: [
        {
          field: 'caseTitle',
          before: 'Assault at Bole',
          after: 'Aggravated Assault at Bole Metro',
        },
        {
          field: 'priority',
          before: 'MEDIUM',
          after: 'HIGH',
        },
        {
          field: 'assignedOfficerId',
          before: 'BD-0092 (Unassigned)',
          after: 'BD-0124 (Detective Eyob Fikir)',
        },
      ],
    },
  },
}
