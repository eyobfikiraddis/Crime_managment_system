import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { PersonsList } from './PersonsList'
import { usePersonList } from '@features/personnel/hooks/usePersonList'
import { useAuthStore } from '@shared/stores/auth.store'

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, options?: any) => {
    if (key === 'entityCount') return `${options?.count ?? 0} person(s)`
    return namespace ? `${namespace}.${key}` : key
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('nuqs', () => ({
  useQueryStates: () => [
    {
      search: '',
      roles: [],
      riskLevel: [],
      isProtectedWitness: '',
      page: 1,
      pageSize: 25,
      sortField: 'lastName',
      sortDirection: 'asc',
    },
    vi.fn(),
  ],
  parseAsString: {
    withDefault: (val: any) => ({ default: val }),
  },
  parseAsArrayOf: () => ({
    withDefault: (val: any) => ({ default: val }),
  }),
  parseAsInteger: {
    withDefault: (val: any) => ({ default: val }),
  },
}))

vi.mock('@features/personnel/hooks/usePersonList', () => ({
  usePersonList: vi.fn(),
}))

vi.mock('@shared/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

describe('PersonsList Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        permissions: ['personnel:view'],
        role: 'INVESTIGATOR',
      })
    )

    vi.mocked(usePersonList).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    render(<PersonsList />)
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('renders empty state when no persons found', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        permissions: ['personnel:view'],
        role: 'INVESTIGATOR',
      })
    )

    vi.mocked(usePersonList).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
    } as any)

    render(<PersonsList />)
    expect(screen.getByText('personnel.persons.list.empty.title')).toBeDefined()
  })

  it('renders Add Person button only when PERSONNEL_MANAGE permission is present', () => {
    // Scenario 1: personnel:manage present
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        permissions: ['personnel:view', 'personnel:manage'],
        role: 'DEPT_HEAD',
      })
    )

    vi.mocked(usePersonList).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
    } as any)

    const { rerender } = render(<PersonsList />)
    expect(screen.queryByText('personnel.persons.list.addPersonButton')).not.toBeNull()

    // Scenario 2: personnel:manage absent
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        permissions: ['personnel:view'],
        role: 'INVESTIGATOR',
      })
    )

    rerender(<PersonsList />)
    expect(screen.queryByText('personnel.persons.list.addPersonButton')).toBeNull()
  })

  it('renders persons table columns, role badges, risk level, and protection badge correctly', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        permissions: ['personnel:view', 'personnel:manage'],
        role: 'DEPT_HEAD',
      })
    )

    const mockPerson = {
      id: 'person-1',
      firstName: 'Alem',
      lastName: 'Tadesse',
      nationalIdMasked: '***-***-1234',
      gender: 'MALE',
      roles: ['SUSPECT', 'WITNESS'],
      riskLevel: 'HIGH',
      isProtectedWitness: true,
      createdAt: '2026-05-31T08:00:00.000Z',
    }

    vi.mocked(usePersonList).mockReturnValue({
      data: { data: [mockPerson], total: 1 },
      isLoading: false,
    } as any)

    render(<PersonsList />)

    // Name link and masked National ID
    expect(screen.getByText('Alem Tadesse')).toBeDefined()
    expect(screen.getByText('***-***-1234')).toBeDefined()

    // Role Badges and Risk Badge
    expect(screen.getByText('personnel.persons.role.SUSPECT')).toBeDefined()
    expect(screen.getByText('personnel.persons.role.WITNESS')).toBeDefined()
    expect(screen.getByText('personnel.persons.riskLevel.HIGH')).toBeDefined()

    // Protected witness badge
    expect(screen.getByText('personnel.persons.list.protectedYes')).toBeDefined()
  })
})
