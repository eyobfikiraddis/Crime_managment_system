import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { PersonRoleCards } from './PersonRoleCards'

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    return namespace ? `${namespace}.${key}` : key
  },
}))

vi.mock('@shared/components/display/MetadataCard', () => ({
  MetadataCard: ({ title, actions, items }: any) => (
    <div data-testid="metadata-card">
      <h3>{title}</h3>
      <div data-testid="actions">{actions}</div>
      <ul>
        {items.map((item: any) => (
          <li key={item.label} data-testid="item">
            <span className="label">{item.label}</span>
            <div className="value">{item.value}</div>
          </li>
        ))}
      </ul>
    </div>
  ),
}))

describe('PersonRoleCards Component Tests', () => {
  const basePerson = {
    id: 'person-123',
    firstName: 'Sara',
    lastName: 'Haile',
    gender: 'FEMALE' as any,
    pii: { nationalId: '***-***-1234', dateOfBirth: '1988', phone: '***' },
    address: 'Addis Ababa',
    photoUrl: null,
    roles: [],
    riskLevel: null,
    isProtectedWitness: false,
    suspectProfile: null,
    victimProfile: null,
    witnessProfile: null,
    createdAt: '2026-05-31T08:00:00Z',
    updatedAt: '2026-05-31T08:00:00Z',
  }

  it('renders "No roles assigned" empty state when all profiles are null', () => {
    render(<PersonRoleCards person={basePerson} />)
    expect(screen.getByText('personnel.persons.detail.rolesSection.noRoles')).toBeDefined()
    expect(screen.queryAllByTestId('metadata-card').length).toBe(0)
  })

  it('renders Suspect card with risk badge when suspectProfile is populated', () => {
    const person = {
      ...basePerson,
      suspectProfile: {
        riskLevel: 'HIGH' as any,
        notes: 'Suspect notes here',
        promotedAt: '2026-05-31T08:00:00Z',
        promotedByOfficerId: 'officer-id',
      },
    }

    render(<PersonRoleCards person={person} />)
    expect(screen.queryByText('personnel.persons.detail.suspectCard.title')).toBeDefined()
    expect(screen.queryByText('personnel.persons.role.SUSPECT')).toBeDefined()
    expect(screen.queryByText('personnel.persons.riskLevel.HIGH')).toBeDefined()
    expect(screen.queryByText('Suspect notes here')).toBeDefined()
  })

  it('renders Witness card and Protected Witness accent badge when witnessProfile.isProtected is true', () => {
    const person = {
      ...basePerson,
      witnessProfile: {
        credibilityNotes: 'Very reliable witness',
        isProtected: true,
        protectionLevel: 'HIGH',
        promotedAt: '2026-05-31T08:00:00Z',
        promotedByOfficerId: 'officer-id',
      },
    }

    render(<PersonRoleCards person={person} />)
    expect(screen.queryByText('personnel.persons.detail.witnessCard.title')).toBeDefined()
    expect(screen.queryByText('personnel.persons.promoteToWitness.protectedBadge')).toBeDefined()
    expect(screen.queryByText('personnel.persons.promoteToWitness.isProtectedLabel')).toBeDefined()
    expect(screen.queryByText('Very reliable witness')).toBeDefined()
  })
})
