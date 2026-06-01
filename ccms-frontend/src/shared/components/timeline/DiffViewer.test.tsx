import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DiffViewer } from './DiffViewer'

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, options?: any) => {
    if (options && options.count) return `Show ${options.count} more changes`
    return namespace ? `${namespace}.${key}` : key
  },
}))

describe('DiffViewer Component Tests', () => {
  const threeFieldsDiff = {
    fields: [
      { field: 'Title', before: 'Old Title', after: 'New Title' },
      { field: 'Status', before: 'OPEN', after: 'UNDER_INVESTIGATION' },
      { field: 'Description', before: null, after: 'Newly Added Description' },
    ],
  }

  const eightFieldsDiff = {
    fields: [
      { field: 'F1', before: 'B1', after: 'A1' },
      { field: 'F2', before: 'B2', after: 'A2' },
      { field: 'F3', before: 'B3', after: 'A3' },
      { field: 'F4', before: 'B4', after: 'A4' },
      { field: 'F5', before: 'B5', after: 'A5' },
      { field: 'F6', before: 'B6', after: 'A6' },
      { field: 'F7', before: 'B7', after: 'A7' },
      { field: 'F8', before: 'B8', after: 'A8' },
    ],
  }

  it('renders one row per diff field correctly', () => {
    render(<DiffViewer diff={threeFieldsDiff} />)
    expect(screen.getByText('Title')).toBeDefined()
    expect(screen.getByText('Status')).toBeDefined()
    expect(screen.getByText('Description')).toBeDefined()
  })

  it('renders null before value as —', () => {
    render(<DiffViewer diff={threeFieldsDiff} />)
    // Description field before value is null, so it should render entry.diffNoChange ("—")
    expect(screen.getByText('entry.diffNoChange')).toBeDefined()
  })

  it('does not render expand button when length <= 5', () => {
    render(<DiffViewer diff={threeFieldsDiff} />)
    expect(screen.queryByText(/Show/i)).toBeNull()
  })

  it('renders expand button and hides surplus fields when length > 5', () => {
    render(<DiffViewer diff={eightFieldsDiff} />)
    // Renders first 5 fields
    expect(screen.getByText('F1')).toBeDefined()
    expect(screen.getByText('F5')).toBeDefined()
    // Does not render F6 initially
    expect(screen.queryByText('F6')).toBeNull()

    // Expand button is present
    const btn = screen.getByText('Show 3 more changes')
    expect(btn).toBeDefined()

    // Click to expand
    fireEvent.click(btn)
    expect(screen.getByText('F6')).toBeDefined()
    expect(screen.getByText('F8')).toBeDefined()
  })
})
