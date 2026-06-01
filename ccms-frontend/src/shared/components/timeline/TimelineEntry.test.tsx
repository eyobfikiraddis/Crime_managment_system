import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { TimelineEntry } from './TimelineEntry'
import type { AuditEntry } from '@features/audit/types/audit.types'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    return namespace ? `${namespace}.${key}` : key
  },
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock Tooltip primitives
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}))

// Mock PermissionGuard
vi.mock('@shared/components/permission/PermissionGuard', () => ({
  PermissionGuard: ({ children, fallback, permission }: any) => {
    // Treat as admin with all permissions
    return <>{children}</>
  },
}))

describe('TimelineEntry Component Tests', () => {
  const baseEntry: AuditEntry = {
    id: '8b189e75-c243-4c86-ba0a-69dd607a5fe5',
    eventType: 'CASE_CREATED',
    category: 'CASE',
    actor: {
      officerId: 'officer-123',
      fullName: 'Sara Haile',
      badgeNumber: 'BD-082',
      departmentName: 'Criminal Investigations',
    },
    timestamp: '2026-06-01T10:00:00Z',
    description: 'Case created successfully',
    diff: null,
    noteText: null,
    securitySeverity: null,
    custodyGap: null,
    isImmutable: true,
    linkedCaseId: null,
    linkedCaseNumber: null,
  }

  it('renders standard fields correctly', () => {
    render(<TimelineEntry entry={baseEntry} />)
    expect(screen.getByText('eventType.CASE_CREATED')).toBeDefined()
    expect(screen.getByText('Sara Haile')).toBeDefined()
    expect(screen.getByText('(BD-082)')).toBeDefined()
    expect(screen.getByText('— Criminal Investigations')).toBeDefined()
    expect(screen.getByText('Case created successfully')).toBeDefined()
  })

  it('renders diff viewer when diff is present', () => {
    const entryWithDiff = {
      ...baseEntry,
      diff: {
        fields: [{ field: 'Title', before: 'Old Title', after: 'New Title' }],
      },
    }
    render(<TimelineEntry entry={entryWithDiff} />)
    expect(screen.getByText('Title')).toBeDefined()
  })

  it('renders note content when noteText is present', () => {
    const entryWithNote = {
      ...baseEntry,
      noteText: 'Special confidential note',
    }
    render(<TimelineEntry entry={entryWithNote} />)
    expect(screen.getByText(/Special confidential note/)).toBeDefined()
  })

  it('renders security badge for security events', () => {
    const securityEntry = {
      ...baseEntry,
      category: 'SECURITY' as any,
      eventType: 'LOGIN_FAILURE' as any,
      securitySeverity: 'HIGH' as any,
    }
    render(<TimelineEntry entry={securityEntry} />)
    expect(screen.getByText('entry.securityBadge.HIGH')).toBeDefined()
  })
})
