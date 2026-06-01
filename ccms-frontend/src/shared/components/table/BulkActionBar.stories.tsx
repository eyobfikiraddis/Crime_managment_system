import type { Meta, StoryObj } from '@storybook/react'
import { BulkActionBar } from './BulkActionBar'
import { Trash2, Download, CheckCircle } from 'lucide-react'

const meta: Meta<typeof BulkActionBar> = {
  title: 'Shared/Table/BulkActionBar',
  component: BulkActionBar,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof BulkActionBar>

export const Default: Story = {
  args: {
    selectedCount: 3,
    onClearSelection: () => console.log('Selection cleared'),
    actions: [
      {
        label: 'Download Metadata',
        icon: Download,
        onClick: () => console.log('Metadata export'),
      },
      {
        label: 'Approve Selected',
        icon: CheckCircle,
        onClick: () => console.log('Approving...'),
      },
      {
        label: 'Drop Charges',
        icon: Trash2,
        variant: 'destructive',
        onClick: () => console.log('Dropping...'),
      },
    ],
  },
}
