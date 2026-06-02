import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker } from './DatePicker'
import React, { useState } from 'react'

const meta: Meta<typeof DatePicker> = {
  title: 'Shared/Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Empty: Story = {
  args: {
    placeholder: 'Select offense date',
    onChange: (d) => console.log('Selected date:', d),
  },
}

export const SelectedDate: Story = {
  args: {
    value: new Date('2026-06-01'),
    onChange: (d) => console.log('Selected date:', d),
  },
}

export const Interactive: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date())
    return React.createElement(DatePicker, {
      value: date,
      onChange: setDate,
    })
  },
}
