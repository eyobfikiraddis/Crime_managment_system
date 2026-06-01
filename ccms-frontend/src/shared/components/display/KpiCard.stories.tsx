import type { Meta, StoryObj } from '@storybook/react'
import { KpiCard } from './KpiCard'
import { ShieldAlert, FileText, Users, DollarSign } from 'lucide-react'

const meta: Meta<typeof KpiCard> = {
  title: 'Shared/Display/KpiCard',
  component: KpiCard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof KpiCard>

export const Default: Story = {
  args: {
    icon: FileText,
    label: 'Total Cases',
    value: 1248,
    changePercent: 12.5,
    changeIsPositiveWhenUp: true,
    isLoading: false,
  },
}

export const NegativeTrend: Story = {
  args: {
    icon: ShieldAlert,
    label: 'Unassigned Incidents',
    value: 42,
    changePercent: -5.4,
    changeIsPositiveWhenUp: false, // decrease is positive
    isLoading: false,
  },
}

export const Currency: Story = {
  args: {
    icon: DollarSign,
    label: 'Total Fines Collected',
    value: 15420,
    valueFormatter: (v) => `$${Number(v).toLocaleString()}`,
    changePercent: 0.8,
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    icon: Users,
    label: 'Active Investigators',
    value: null,
    isLoading: true,
  },
}
