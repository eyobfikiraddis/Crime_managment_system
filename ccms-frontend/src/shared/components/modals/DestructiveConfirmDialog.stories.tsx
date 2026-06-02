import type { Meta, StoryObj } from '@storybook/react'
import { DestructiveConfirmDialog } from './DestructiveConfirmDialog'
import React, { useState } from 'react'

const meta: Meta<typeof DestructiveConfirmDialog> = {
  title: 'Shared/Modals/DestructiveConfirmDialog',
  component: DestructiveConfirmDialog,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DestructiveConfirmDialog>

export const Default: Story = {
  args: {
    open: true,
    title: 'Delete Evidence Item?',
    description: 'This evidence item will be permanently deleted from the chain of custody. This action is irreversible.',
    confirmLabel: 'Permanently Delete',
    cancelLabel: 'Cancel',
    onOpenChange: (o) => console.log('Open change:', o),
    onConfirm: () => console.log('Confirmed delete'),
  },
}

export const PhraseConfirmation: Story = {
  args: {
    open: true,
    title: 'Drop Charges?',
    description: 'This will drop the criminal charges filed against the suspect. This action logs a terminal legal record.',
    warning: 'You are dropping felony charges which cannot be reopened.',
    confirmPrompt: 'Type "CONFIRM DROP" to authorize this action:',
    confirmPhrase: 'CONFIRM DROP',
    confirmLabel: 'Drop Charges',
    cancelLabel: 'Cancel',
    onOpenChange: (o) => console.log('Open change:', o),
    onConfirm: () => console.log('Charges dropped'),
  },
}

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('button', {
        className: 'px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md',
        onClick: () => setOpen(true),
      }, 'Trigger Destructive Dialog'),
      React.createElement(DestructiveConfirmDialog, {
        open,
        onOpenChange: setOpen,
        title: 'Delete Profile Data?',
        description: 'Permanently remove this person profile from the system.',
        confirmPrompt: 'Type "DELETE" to confirm:',
        confirmPhrase: 'DELETE',
        confirmLabel: 'Delete Profile',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          console.log('Profile Deleted!')
          setOpen(false)
        },
      })
    )
  },
}
