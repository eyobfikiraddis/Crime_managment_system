import type { BadgeVariant } from '@shared/types/ui.types'

import { RiskLevel, OfficerRole, OfficerStatus, PersonRole } from '../types/personnel.types'

export const RISK_LEVEL_VARIANTS: Record<RiskLevel, BadgeVariant> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'destructive',
}

export const OFFICER_STATUS_VARIANTS: Record<OfficerStatus, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
}

export const OFFICER_ROLE_VARIANTS: Record<OfficerRole, BadgeVariant> = {
  INVESTIGATOR: 'primary',
  FORENSIC: 'accent',
  LEGAL_OFFICER: 'accent',
  DEPT_HEAD: 'warning',
  ADMIN: 'destructive',
  SUPERADMIN: 'destructive',
}

export const PERSON_ROLE_VARIANTS: Record<PersonRole, BadgeVariant> = {
  SUSPECT: 'warning',
  VICTIM: 'muted',
  WITNESS: 'primary',
}

export function getFullName(first: string, last: string): string {
  return `${first} ${last}`.trim()
}

export function getOfficerDisplayName(
  firstName: string,
  lastName: string,
  badgeNumber: string,
): string {
  return `${firstName} ${lastName} (${badgeNumber})`
}

export const RISK_LEVEL_ORDINAL: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

export function hasRole(roles: PersonRole[], role: PersonRole): boolean {
  return roles.includes(role)
}

export function getUnassignedRoles(roles: PersonRole[]): PersonRole[] {
  return Object.values(PersonRole).filter((r) => !roles.includes(r))
}
