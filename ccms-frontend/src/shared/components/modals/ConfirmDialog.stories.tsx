import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDialog } from './ConfirmDialog'
import React, { useState } from 'react'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Shared/Modals/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

export const Default: Story = {
  args: {
    open: true,
    title: 'Archive Case?',
    description: 'Are you sure you want to archive this criminal case? This will freeze editing.',
    confirmLabel: 'Archive',
    cancelLabel: 'Cancel',
    onOpenChange: (o) => console.log('Open change:', o),
    onConfirm: () => console.log('Confirmed archive'),
  },
}

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('button', {
        className: 'px-3 py-1.5 bg-primary text-primary-foreground rounded-md',
        onClick: () => setOpen(true),
      }, 'Trigger Dialog'),
      React.createElement(ConfirmDialog, {
        open,
        onOpenChange: setOpen,
        title: 'Confirm Operation',
        description: 'Do you verify that these records are legally accurate?',
        confirmLabel: 'Verify',
        cancelLabel: 'Go Back',
        onConfirm: () => {
          console.log('Verified!')
          setOpen(false)
        },
      })
    )
  },
}
