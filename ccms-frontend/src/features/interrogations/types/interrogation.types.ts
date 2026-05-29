export type RoleOnCase = 'SUSPECT' | 'VICTIM' | 'WITNESS'

export interface OfficerRef {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  departmentName: string
}

export interface SubjectRef {
  id: string
  firstName: string
  lastName: string
  roleOnCase: RoleOnCase
}

export interface InterrogationListItem {
  id: string
  interrogationNumber: string
  caseId: string
  subject: SubjectRef
  conductingOfficer: OfficerRef
  interrogationDate: string
  location: string
  durationMinutes: number | null
  legalRepresentativePresent: boolean
  legalRepresentativeName?: string | null | undefined
  summary?: string | undefined
  recordingReference?: string | null | undefined
  createdAt: string
}

export interface Interrogation extends InterrogationListItem {
  legalRepresentativeName: string | null
  summary: string
  recordingReference: string | null
}

export interface InterrogationFilters {
  search?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'interrogationDate' | 'interrogationNumber' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

export interface CreateInterrogationPayload {
  subjectId: string
  conductingOfficerId: string
  interrogationDate: string
  location: string
  durationMinutes?: number | null | undefined
  legalRepresentativePresent?: boolean | undefined
  legalRepresentativeName?: string | undefined
  summary: string
  recordingReference?: string | undefined
}
