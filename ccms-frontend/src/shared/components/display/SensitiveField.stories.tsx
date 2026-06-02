import type { Meta, StoryObj } from '@storybook/react'
import { SensitiveField } from './SensitiveField'

const meta: Meta<typeof SensitiveField> = {
  title: 'Shared/Display/SensitiveField',
  component: SensitiveField,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SensitiveField>

export const Redacted: Story = {
  args: {
    value: 'Witness Phone: +251 91 123 4567',
    maskedValue: 'Witness Phone: +251 91 *** ****',
    canReveal: false,
  },
}

export const Revealable: Story = {
  args: {
    value: 'National ID: 1234567890-AM',
    maskedValue: 'National ID: **********',
    canReveal: true,
  },
}
