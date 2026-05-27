import type { OfficerRole } from '@shared/constants/roles'

// ─── Status ────────────────────────────────────────────────────────────────
export const CaseStatus = {
  OPEN: 'OPEN',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  REFERRED_TO_COURT: 'REFERRED_TO_COURT',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus]

// ─── State machine: which statuses can follow which ───────────────────────
export const CASE_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['UNDER_INVESTIGATION', 'CLOSED'],
  UNDER_INVESTIGATION: ['REFERRED_TO_COURT', 'CLOSED'],
  REFERRED_TO_COURT: ['CLOSED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
}

// Roles that can execute each type of transition
export const STATUS_TRANSITION_MIN_ROLE: Partial<Record<CaseStatus, OfficerRole>> = {
  ARCHIVED: 'DEPT_HEAD',
}

// ─── Core entities ─────────────────────────────────────────────────────────
export interface CaseOfficer {
  id: string
  badgeNumber: string
  firstName: string
  lastName: string
  role: OfficerRole
  departmentId: string
  departmentName: string
}

export interface CaseMember {
  officer: CaseOfficer
  accessLevel: 'READ' | 'WRITE' | 'ADMIN'
  assignedAt: string
  assignedBy: string
}

export interface CrimeType {
  id: string
  name: string
  code: string
}

export interface Location {
  id: string
  name: string
  address?: string | undefined
}

export interface Department {
  id: string
  name: string
}

// ─── Case ─────────────────────────────────────────────────────────────────
export interface Case {
  id: string
  caseNumber: string // e.g. "CASE-2026-00142"
  title: string
  description: string
  status: CaseStatus
  crimeType: CrimeType
  location: Location | null
  department: Department
  leadOfficer: Pick<CaseOfficer, 'id' | 'badgeNumber' | 'firstName' | 'lastName'>
  incidentDate: string         // ISO 8601 date string
  reportedDate: string         // ISO 8601 date string
  closedDate: string | null
  lastActivityAt: string
  evidenceCount: number
  arrestCount: number
  chargeCount: number
  memberCount: number
  createdAt: string
  updatedAt: string
}

// A lighter shape returned in list responses
export interface CaseListItem {
  id: string
  caseNumber: string
  title: string
  status: CaseStatus
  crimeType: CrimeType
  department: Department
  leadOfficer: Pick<CaseOfficer, 'id' | 'badgeNumber' | 'firstName' | 'lastName'>
  incidentDate: string
  reportedDate: string
  evidenceCount: number
  arrestCount: number
  lastActivityAt: string
}

// ─── Case summary (for overview panels) ───────────────────────────────────
export interface CaseSummary {
  evidenceCount: number
  arrestCount: number
  interrogationCount: number
  chargeCount: number
  officerCount: number
  openTaskCount: number
}

// ─── Case filters ──────────────────────────────────────────────────────────
export interface CaseFilters {
  search?: string | undefined
  status?: CaseStatus[] | undefined
  crimeTypeId?: string | undefined
  departmentId?: string | undefined
  leadOfficerId?: string | undefined
  dateFrom?: string | undefined  // ISO 8601 date
  dateTo?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
  sortField?: 'caseNumber' | 'title' | 'status' | 'reportedDate' | 'lastActivityAt' | undefined
  sortDirection?: 'asc' | 'desc' | undefined
}

// ─── Timeline ──────────────────────────────────────────────────────────────
export const TimelineEventType = {
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  EVIDENCE_ADDED: 'EVIDENCE_ADDED',
  EVIDENCE_UPDATED: 'EVIDENCE_UPDATED',
  OFFICER_ASSIGNED: 'OFFICER_ASSIGNED',
  OFFICER_REMOVED: 'OFFICER_REMOVED',
  ARREST_RECORDED: 'ARREST_RECORDED',
  INTERROGATION_RECORDED: 'INTERROGATION_RECORDED',
  LEGAL_ACTION: 'LEGAL_ACTION',
  NOTE_ADDED: 'NOTE_ADDED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
} as const
export type TimelineEventType = (typeof TimelineEventType)[keyof typeof TimelineEventType]

export interface TimelineDiff {
  fieldName: string
  before: unknown
  after: unknown
}

export interface TimelineEntry {
  id: string
  eventType: TimelineEventType
  eventLabel: string          // Human-readable string from backend
  actor: CaseOfficer
  description: string
  diff: TimelineDiff[] | null
  securitySeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  createdAt: string           // ISO 8601, immutable
}

export interface TimelineFilters {
  actorSearch?: string
  eventTypes?: TimelineEventType[]
  dateFrom?: string
  dateTo?: string
}

// ─── Status transition ─────────────────────────────────────────────────────
export interface StatusTransitionPayload {
  toStatus: CaseStatus
  reason?: string | undefined
}

// ─── Create case ──────────────────────────────────────────────────────────
export interface CreateCaseStep1 {
  title: string
  description: string
  incidentDate: string
  locationId?: string | undefined
}

export interface CreateCaseStep2 {
  crimeTypeId: string
  departmentId: string
}

export interface CreateCaseStep3 {
  leadOfficerId: string
  additionalOfficerIds?: string[] | undefined
}

export type CreateCasePayload = CreateCaseStep1 & CreateCaseStep2 & CreateCaseStep3
