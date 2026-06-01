import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from './DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface MockData {
  id: string
  title: string
  status: string
}

const mockColumns: ColumnDef<MockData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

const mockData: MockData[] = [
  { id: '1', title: 'Case Alpha', status: 'Open' },
  { id: '2', title: 'Case Beta', status: 'Closed' },
  { id: '3', title: 'Case Gamma', status: 'Under Investigation' },
]

const meta: Meta<typeof DataTable> = {
  title: 'Shared/Table/DataTable',
  component: DataTable as any,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  args: {
    data: mockData,
    columns: mockColumns as any,
    isLoading: false,
    emptyTitle: 'No Cases Found',
    emptyMessage: 'Try adjusting filters.',
  } as any,
}

export const Loading: Story = {
  args: {
    data: [],
    columns: mockColumns as any,
    isLoading: true,
    emptyTitle: 'No Cases Found',
    emptyMessage: 'Try adjusting filters.',
  } as any,
}

export const Empty: Story = {
  args: {
    data: [],
    columns: mockColumns as any,
    isLoading: false,
    emptyTitle: 'No Cases Found',
    emptyMessage: 'Try adjusting filters.',
  } as any,
}
