import type { BadgeVariant } from '@shared/types/ui.types'

// ─── Officer role badge variants (local to departments module) ─────────────────
// Identical values to OFFICER_ROLE_VARIANTS in personnel module.
// Defined locally to respect module boundary import rules.
export const DEPT_OFFICER_ROLE_VARIANTS: Record<string, BadgeVariant> = {
  INVESTIGATOR:  'primary',
  FORENSIC:      'accent',
  LEGAL_OFFICER: 'accent',
  DEPT_HEAD:     'warning',
  ADMIN:         'destructive',
  SUPERADMIN:    'destructive',
}

// ─── Officer status badge variants (local to departments module) ──────────────
export const DEPT_OFFICER_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE:   'success',
  INACTIVE: 'muted',
}

// ─── Department display name ──────────────────────────────────────────────────
// Returns: "Homicide Unit (HOM)" or "Homicide Unit" if no code
export function getDepartmentDisplayName(name: string, code: string | null): string {
  if (code) return `${name} (${code})`
  return name
}

// ─── Head officer full name ───────────────────────────────────────────────────
export function getHeadOfficerLabel(
  firstName: string,
  lastName: string,
  badgeNumber: string,
): string {
  return `${firstName} ${lastName} (${badgeNumber})`
}

// ─── Check if department has a head officer ───────────────────────────────────
export function hasHeadOfficer(dept: { headOfficer: unknown }): boolean {
  return dept.headOfficer !== null && dept.headOfficer !== undefined
}
