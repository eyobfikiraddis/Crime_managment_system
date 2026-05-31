export const PersonRole = {
  SUSPECT: 'SUSPECT',
  VICTIM: 'VICTIM',
  WITNESS: 'WITNESS',
} as const
export type PersonRole = (typeof PersonRole)[keyof typeof PersonRole]

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

export const OfficerRole = {
  INVESTIGATOR: 'INVESTIGATOR',
  FORENSIC: 'FORENSIC',
  LEGAL_OFFICER: 'LEGAL_OFFICER',
  DEPT_HEAD: 'DEPT_HEAD',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const
export type OfficerRole = (typeof OfficerRole)[keyof typeof OfficerRole]

export const OfficerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type OfficerStatus = (typeof OfficerStatus)[keyof typeof OfficerStatus]

export interface SuspectProfile {
  riskLevel: RiskLevel
  notes: string | null
  promotedAt: string
  promotedByOfficerId: string
}

export interface VictimProfile {
  notes: string | null
  promotedAt: string
  promotedByOfficerId: string
}

export interface WitnessProfile {
  credibilityNotes: string | null
  isProtected: boolean
  protectionLevel: string | null
  promotedAt: string
  promotedByOfficerId: string
}

export interface PersonPII {
  nationalId: string | null
  dateOfBirth: string | null
  phone: string | null
}

export interface PersonListItem {
  id: string
  firstName: string
  lastName: string
  nationalIdMasked: string | null
  gender: Gender | null
  roles: PersonRole[]
  riskLevel: RiskLevel | null
  isProtectedWitness: boolean
  createdAt: string
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  gender: Gender | null
  pii: PersonPII
  address: string | null
  photoUrl: string | null
  roles: PersonRole[]
  riskLevel: RiskLevel | null
  isProtectedWitness: boolean
  suspectProfile: SuspectProfile | null
  victimProfile: VictimProfile | null
  witnessProfile: WitnessProfile | null
  createdAt: string
  updatedAt: string
}

export interface PersonCaseSummary {
  caseId: string
  caseNumber: string
  title: string
  roleOnCase: PersonRole
  caseStatus: string
  createdAt: string
}

export interface PersonFilters {
  search?: string
  roles?: PersonRole[]
  riskLevel?: RiskLevel[]
  isProtectedWitness?: boolean
  page?: number
  pageSize?: number
  sortField?: 'firstName' | 'lastName' | 'createdAt' | 'riskLevel'
  sortDirection?: 'asc' | 'desc'
}

export interface CreatePersonPayload {
  firstName: string
  lastName: string
  gender?: Gender
  nationalId?: string
  dateOfBirth?: string
  phone?: string
  address?: string
}

export interface UpdatePersonPayload {
  firstName?: string
  lastName?: string
  gender?: Gender | null
  phone?: string | null
  address?: string | null
}

export interface PromoteToSuspectPayload {
  riskLevel: RiskLevel
  notes?: string
}

export interface PromoteToVictimPayload {
  notes?: string
}

export interface PromoteToWitnessPayload {
  credibilityNotes?: string
  isProtected: boolean
  protectionLevel?: string | null
}

export interface OfficerListItem {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  role: OfficerRole
  status: OfficerStatus
  departmentId: string
  departmentName: string
  lastActivityAt: string | null
  createdAt: string
}

export interface Officer extends OfficerListItem {
  phone: string | null
  activeCaseCount: number
  totalCaseCount: number
}

export interface OfficerCaseSummary {
  caseId: string
  caseNumber: string
  title: string
  status: string
  assignedAt: string
}

export interface OfficerFilters {
  search?: string
  status?: OfficerStatus[]
  role?: OfficerRole[]
  departmentId?: string
  page?: number
  pageSize?: number
  sortField?: 'badgeNumber' | 'firstName' | 'lastName' | 'status' | 'lastActivityAt'
  sortDirection?: 'asc' | 'desc'
}

export interface CreateOfficerPayload {
  badgeNumber: string
  firstName: string
  lastName: string
  email: string
  role: OfficerRole
  departmentId: string
  phone?: string
}

export interface UpdateOfficerPayload {
  role?: OfficerRole
  departmentId?: string
  phone?: string | null
}

export interface ResetPasswordPayload {}
