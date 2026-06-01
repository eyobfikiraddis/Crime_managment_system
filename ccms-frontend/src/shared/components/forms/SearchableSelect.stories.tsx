import type { Meta, StoryObj } from '@storybook/react'
import { SearchableSelect } from './SearchableSelect'
import React, { useState } from 'react'

const meta: Meta<typeof SearchableSelect> = {
  title: 'Shared/Forms/SearchableSelect',
  component: SearchableSelect,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SearchableSelect>

const mockOptions = [
  { value: 'dept-1', label: 'Homicide division' },
  { value: 'dept-2', label: 'Cyber Crime unit' },
  { value: 'dept-3', label: 'Forensics department' },
  { value: 'dept-4', label: 'Traffic police division' },
]

export const Default: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Select a department...',
    onChange: (val) => console.log('Selected:', val),
  },
}

export const Interactive: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>()
    return React.createElement(SearchableSelect, {
      options: mockOptions,
      value: val,
      onChange: setVal,
      placeholder: 'Select a department...',
    })
  },
}

export const Loading: Story = {
  args: {
    options: [],
    isLoading: true,
    placeholder: 'Select department...',
    onChange: () => {},
  },
}

export const Empty: Story = {
  args: {
    options: [],
    isLoading: false,
    emptyMessage: 'No departments found',
    placeholder: 'Select department...',
    onChange: () => {},
  },
}
