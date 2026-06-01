import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { CustodyGapBadge } from './CustodyGapBadge'

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, options?: any) => {
    if (options && options.duration) return `Custody Gap of ${options.duration}`
    if (options && options.from && options.to) return `From ${options.from} to ${options.to}`
    return namespace ? `${namespace}.${key}` : key
  },
}))

describe('CustodyGapBadge Component Tests', () => {
  it('correctly formats and renders gap details', () => {
    render(
      <CustodyGapBadge
        gapHours={36}
        fromTimestamp="2026-06-01T08:00:00Z"
        toTimestamp="2026-06-02T20:00:00Z"
      />
    )

    expect(screen.getByText('custodyGap.badgeLabel')).toBeDefined()
    // Should render the formatted gap duration of "1 day, 12 hours"
    expect(screen.getByText(/1 day, 12 hours/)).toBeDefined()
  })
})
