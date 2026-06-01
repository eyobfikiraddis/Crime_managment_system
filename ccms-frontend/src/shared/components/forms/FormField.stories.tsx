import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from './FormField'
import React from 'react'

const meta: Meta<typeof FormField> = {
  title: 'Shared/Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FormField>

export const Default: Story = {
  args: {
    label: 'Case Title',
    required: true,
    helperText: 'Provide a brief, descriptive name for the investigation.',
    children: React.createElement('input', {
      type: 'text',
      placeholder: 'e.g. Bank Heist Investigation',
      className: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    }),
  },
}

export const WithError: Story = {
  args: {
    label: 'Email Address',
    required: true,
    error: 'Please enter a valid police.gov.et email address.',
    children: React.createElement('input', {
      type: 'email',
      defaultValue: 'invalid-email@gmail.com',
      className: 'flex h-10 w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    }),
  },
}
