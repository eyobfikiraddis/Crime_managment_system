import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { AuditFilterBar } from './AuditFilterBar'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, options?: any) => {
    return namespace ? `${namespace}.${key}` : key
  },
}))

// Mock DatePicker
vi.mock('@shared/components/forms/DatePicker', () => ({
  DatePicker: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="datepicker"
      placeholder={placeholder}
      value={value ? '2026-06-01' : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}))

// Mock Popover
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}))

// Mock Checkbox
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={!!checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}))

describe('AuditFilterBar Component Tests', () => {
  const defaultProps = {
    actorSearch: '',
    onActorSearchChange: vi.fn(),
    selectedEventTypes: [],
    onEventTypesChange: vi.fn(),
    dateFrom: '',
    dateTo: '',
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onClearAll: vi.fn(),
    activeFilterCount: 0,
  }

  it('updates actor search when text typed', () => {
    render(<AuditFilterBar {...defaultProps} />)
    const input = screen.getByPlaceholderText('filter.actorSearch')
    fireEvent.change(input, { target: { value: 'Sara' } })
    expect(defaultProps.onActorSearchChange).toHaveBeenCalledWith('Sara')
  })

  it('renders active filter chips when filters are set', () => {
    render(
      <AuditFilterBar
        {...defaultProps}
        actorSearch="Sara"
        activeFilterCount={1}
      />
    )
    expect(screen.getByText('Actor: Sara')).toBeDefined()
  })

  it('triggers clear all filters when button clicked', () => {
    render(
      <AuditFilterBar
        {...defaultProps}
        actorSearch="Sara"
        activeFilterCount={1}
      />
    )
    const btn = screen.getByText('filter.clearAll')
    fireEvent.click(btn)
    expect(defaultProps.onClearAll).toHaveBeenCalled()
  })
})
