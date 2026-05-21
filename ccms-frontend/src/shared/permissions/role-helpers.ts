import { OfficerRole } from '../constants/roles'

const ROLE_HIERARCHY = [
  OfficerRole.INVESTIGATOR,
  OfficerRole.FORENSIC,
  OfficerRole.LEGAL_OFFICER,
  OfficerRole.DEPT_HEAD,
  OfficerRole.ADMIN,
  OfficerRole.SUPERADMIN,
] as const

export function hasRole(currentRole: OfficerRole, required: OfficerRole) {
  return currentRole === required
}

export function hasMinRole(currentRole: OfficerRole, minimum: OfficerRole) {
  return ROLE_HIERARCHY.indexOf(currentRole) >= ROLE_HIERARCHY.indexOf(minimum)
}

export function isAdminOrAbove(role: OfficerRole) {
  return hasMinRole(role, OfficerRole.ADMIN)
}
