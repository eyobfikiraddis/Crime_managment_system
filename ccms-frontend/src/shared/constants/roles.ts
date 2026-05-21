export const OfficerRole = {
  INVESTIGATOR: 'INVESTIGATOR',
  FORENSIC: 'FORENSIC',
  LEGAL_OFFICER: 'LEGAL_OFFICER',
  DEPT_HEAD: 'DEPT_HEAD',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const

export type OfficerRole = (typeof OfficerRole)[keyof typeof OfficerRole]
