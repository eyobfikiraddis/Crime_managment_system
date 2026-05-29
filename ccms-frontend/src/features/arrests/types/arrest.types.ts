export const DetentionStatus = {
  IN_CUSTODY: 'IN_CUSTODY',
  RELEASED_ON_BAIL: 'RELEASED_ON_BAIL',
  RELEASED: 'RELEASED',
  TRANSFERRED: 'TRANSFERRED',
} as const
export type DetentionStatus = (typeof DetentionStatus)[keyof typeof DetentionStatus]

export const BailStatus = {
  NOT_SET: 'NOT_SET',
  DENIED: 'DENIED',
  GRANTED: 'GRANTED',
  POSTED: 'POSTED',
} as const
export type BailStatus = (typeof BailStatus)[keyof typeof BailStatus]

export type RoleOnCase = 'SUSPECT' | 'VICTIM' | 'WITNESS'

export interface PersonRef {
  id: string
  firstName: string
  lastName: string
  nationalId: string
  roleOnCase?: RoleOnCase | undefined
}

export interface OfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

export interface ArrestListItem {
  id: string
  arrestNumber: string
  caseId: string
  arrestedPerson: PersonRef
  arrestingOfficer: OfficerRef
  arrestDate: string
  location: string
  detentionStatus: DetentionStatus
  bailStatus: BailStatus
  bailAmount: number | null
  warrantNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface Arrest extends ArrestListItem {
  chargesAtArrest: string[]
  notes: string | null
  courtAppearanceDate: string | null
}

export interface ArrestFilters {
  search?: string | undefined
  detentionStatus?: DetentionStatus[] | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'arrestDate' | 'arrestNumber' | 'detentionStatus' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface CreateArrestPayload {
  arrestedPersonId: string
  arrestingOfficerId: string
  arrestDate: string
  location: string
  warrantNumber?: string | undefined
  chargesAtArrest: string[]
  bailStatus?: BailStatus | undefined
  bailAmount?: number | null | undefined
  notes?: string | undefined
}

export interface UpdateArrestPayload {
  detentionStatus?: DetentionStatus | undefined
  bailStatus?: BailStatus | undefined
  bailAmount?: number | null | undefined
  notes?: string | undefined
}
