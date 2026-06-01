import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'
import React from 'react'

const meta: Meta<typeof Skeleton> = {
  title: 'Shared/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const SingleLine: Story = {
  args: {
    className: 'h-4 w-48',
  },
}

export const Block: Story = {
  args: {
    className: 'h-24 w-full rounded-md',
  },
}

export const Circle: Story = {
  args: {
    className: 'h-12 w-12 rounded-full',
  },
}

export const ComplexLayout: Story = {
  render: () => (
    React.createElement(
      'div',
      { className: 'flex items-center space-x-4' },
      React.createElement(Skeleton, { className: 'h-12 w-12 rounded-full' }),
      React.createElement(
        'div',
        { className: 'space-y-2' },
        React.createElement(Skeleton, { className: 'h-4 w-40' }),
        React.createElement(Skeleton, { className: 'h-4 w-28' })
      )
    )
  ),
}
