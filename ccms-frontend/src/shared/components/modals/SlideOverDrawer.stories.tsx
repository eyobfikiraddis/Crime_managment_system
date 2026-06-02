import type { Meta, StoryObj } from '@storybook/react'
import { SlideOverDrawer } from './SlideOverDrawer'
import React, { useState } from 'react'

const meta: Meta<typeof SlideOverDrawer> = {
  title: 'Shared/Modals/SlideOverDrawer',
  component: SlideOverDrawer,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SlideOverDrawer>

export const Default: Story = {
  args: {
    open: true,
    title: 'Edit Case Metadata',
    description: 'Update the core classification and status tags for this investigation.',
    children: React.createElement('div', { className: 'space-y-4' },
      React.createElement('p', { className: 'text-sm' }, 'Add your form elements and configurations here.'),
      React.createElement('input', { type: 'text', className: 'w-full px-3 py-2 border rounded-md bg-transparent border-border', placeholder: 'Enter new category name' })
    ),
    footer: React.createElement('div', { className: 'flex justify-end gap-2' },
      React.createElement('button', { className: 'px-3 py-1.5 bg-muted text-foreground rounded-md text-sm' }, 'Reset'),
      React.createElement('button', { className: 'px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm' }, 'Save Changes')
    ),
    onOpenChange: (o) => console.log('Open change:', o),
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
      }, 'Trigger Drawer'),
      React.createElement(SlideOverDrawer, {
        open,
        onOpenChange: setOpen,
        title: 'Review Charge Details',
        description: 'Case: CCMS-2026-0089',
        children: React.createElement('div', { className: 'space-y-3' },
          React.createElement('h3', { className: 'font-semibold text-sm' }, 'Filed Charge: Armed Robbery'),
          React.createElement('p', { className: 'text-xs text-foreground-muted' }, 'Classified under Criminal Code section 390. Felony offenses are tracked under high-priority audit guidelines.')
        ),
        footer: React.createElement('button', {
          className: 'w-full px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm',
          onClick: () => setOpen(false),
        }, 'Close Drawer'),
      })
    )
  },
}
