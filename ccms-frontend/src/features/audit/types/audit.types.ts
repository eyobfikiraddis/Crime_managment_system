// ─── Audit Event Category enum ───────────────────────────────────────────────
// Used to group event types in the filter multi-select.
export const AuditEventCategory = {
  CASE:       'CASE',
  EVIDENCE:   'EVIDENCE',
  SECURITY:   'SECURITY',
  LEGAL:      'LEGAL',
  PERSONNEL:  'PERSONNEL',
  ANNOTATION: 'ANNOTATION',
} as const
export type AuditEventCategory =
  (typeof AuditEventCategory)[keyof typeof AuditEventCategory]

// ─── Audit Event Type enum ───────────────────────────────────────────────────
// The full list of discrete event types the backend can emit.
export const AuditEventType = {
  // Case events
  CASE_CREATED:            'CASE_CREATED',
  CASE_UPDATED:            'CASE_UPDATED',
  CASE_STATUS_CHANGED:     'CASE_STATUS_CHANGED',
  CASE_OFFICER_ASSIGNED:   'CASE_OFFICER_ASSIGNED',
  CASE_OFFICER_REMOVED:    'CASE_OFFICER_REMOVED',
  CASE_PERMISSIONS_CHANGED:'CASE_PERMISSIONS_CHANGED',
  CASE_DELETED:            'CASE_DELETED',
  // Evidence events
  EVIDENCE_ADDED:          'EVIDENCE_ADDED',
  EVIDENCE_UPDATED:        'EVIDENCE_UPDATED',
  EVIDENCE_DELETED:        'EVIDENCE_DELETED',
  CUSTODY_TRANSFERRED:     'CUSTODY_TRANSFERRED',
  CUSTODY_EXAMINED:        'CUSTODY_EXAMINED',
  CUSTODY_STORED:          'CUSTODY_STORED',
  CUSTODY_PRESENTED:       'CUSTODY_PRESENTED',
  // Security events
  LOGIN_SUCCESS:           'LOGIN_SUCCESS',
  LOGIN_FAILURE:           'LOGIN_FAILURE',
  LOGOUT:                  'LOGOUT',
  SESSION_EXPIRED:         'SESSION_EXPIRED',
  FORCED_LOGOUT:           'FORCED_LOGOUT',
  PERMISSION_GRANTED:      'PERMISSION_GRANTED',
  PERMISSION_REVOKED:      'PERMISSION_REVOKED',
  ROLE_CHANGED:            'ROLE_CHANGED',
  PASSWORD_RESET:          'PASSWORD_RESET',
  PII_ACCESSED:            'PII_ACCESSED',
  // Legal events
  CHARGE_FILED:            'CHARGE_FILED',
  CHARGE_UPDATED:          'CHARGE_UPDATED',
  CHARGE_DROPPED:          'CHARGE_DROPPED',
  SENTENCE_RECORDED:       'SENTENCE_RECORDED',
  COURT_CASE_CREATED:      'COURT_CASE_CREATED',
  COURT_CASE_UPDATED:      'COURT_CASE_UPDATED',
  HEARING_SCHEDULED:       'HEARING_SCHEDULED',
  // Personnel events
  PERSON_CREATED:          'PERSON_CREATED',
  PERSON_UPDATED:          'PERSON_UPDATED',
  PERSON_ROLE_PROMOTED:    'PERSON_ROLE_PROMOTED',
  OFFICER_CREATED:         'OFFICER_CREATED',
  OFFICER_UPDATED:         'OFFICER_UPDATED',
  OFFICER_ACTIVATED:       'OFFICER_ACTIVATED',
  OFFICER_DEACTIVATED:     'OFFICER_DEACTIVATED',
  // Annotation
  CASE_NOTE_ADDED:         'CASE_NOTE_ADDED',
} as const
export type AuditEventType =
  (typeof AuditEventType)[keyof typeof AuditEventType]

// ─── Category membership ──────────────────────────────────────────────────────
// Maps each event type to its parent category for filter grouping.
export const EVENT_TYPE_CATEGORY: Record<AuditEventType, AuditEventCategory> = {
  CASE_CREATED:             AuditEventCategory.CASE,
  CASE_UPDATED:             AuditEventCategory.CASE,
  CASE_STATUS_CHANGED:      AuditEventCategory.CASE,
  CASE_OFFICER_ASSIGNED:    AuditEventCategory.CASE,
  CASE_OFFICER_REMOVED:     AuditEventCategory.CASE,
  CASE_PERMISSIONS_CHANGED: AuditEventCategory.CASE,
  CASE_DELETED:             AuditEventCategory.CASE,
  EVIDENCE_ADDED:           AuditEventCategory.EVIDENCE,
  EVIDENCE_UPDATED:         AuditEventCategory.EVIDENCE,
  EVIDENCE_DELETED:         AuditEventCategory.EVIDENCE,
  CUSTODY_TRANSFERRED:      AuditEventCategory.EVIDENCE,
  CUSTODY_EXAMINED:         AuditEventCategory.EVIDENCE,
  CUSTODY_STORED:           AuditEventCategory.EVIDENCE,
  CUSTODY_PRESENTED:        AuditEventCategory.EVIDENCE,
  LOGIN_SUCCESS:            AuditEventCategory.SECURITY,
  LOGIN_FAILURE:            AuditEventCategory.SECURITY,
  LOGOUT:                   AuditEventCategory.SECURITY,
  SESSION_EXPIRED:          AuditEventCategory.SECURITY,
  FORCED_LOGOUT:            AuditEventCategory.SECURITY,
  PERMISSION_GRANTED:       AuditEventCategory.SECURITY,
  PERMISSION_REVOKED:       AuditEventCategory.SECURITY,
  ROLE_CHANGED:             AuditEventCategory.SECURITY,
  PASSWORD_RESET:           AuditEventCategory.SECURITY,
  PII_ACCESSED:             AuditEventCategory.SECURITY,
  CHARGE_FILED:             AuditEventCategory.LEGAL,
  CHARGE_UPDATED:           AuditEventCategory.LEGAL,
  CHARGE_DROPPED:           AuditEventCategory.LEGAL,
  SENTENCE_RECORDED:        AuditEventCategory.LEGAL,
  COURT_CASE_CREATED:       AuditEventCategory.LEGAL,
  COURT_CASE_UPDATED:       AuditEventCategory.LEGAL,
  HEARING_SCHEDULED:        AuditEventCategory.LEGAL,
  PERSON_CREATED:           AuditEventCategory.PERSONNEL,
  PERSON_UPDATED:           AuditEventCategory.PERSONNEL,
  PERSON_ROLE_PROMOTED:     AuditEventCategory.PERSONNEL,
  OFFICER_CREATED:          AuditEventCategory.PERSONNEL,
  OFFICER_UPDATED:          AuditEventCategory.PERSONNEL,
  OFFICER_ACTIVATED:        AuditEventCategory.PERSONNEL,
  OFFICER_DEACTIVATED:      AuditEventCategory.PERSONNEL,
  CASE_NOTE_ADDED:          AuditEventCategory.ANNOTATION,
}

// Security-level event types — displayed with a severity badge
export const SECURITY_EVENT_TYPES: AuditEventType[] = [
  AuditEventType.LOGIN_FAILURE,
  AuditEventType.FORCED_LOGOUT,
  AuditEventType.PERMISSION_GRANTED,
  AuditEventType.PERMISSION_REVOKED,
  AuditEventType.ROLE_CHANGED,
  AuditEventType.PII_ACCESSED,
]

// ─── Diff types ───────────────────────────────────────────────────────────────
export interface AuditDiffField {
  field: string            // Human-readable field name (server-generated)
  before: string | null    // String representation of the old value; null if new
  after: string | null     // String representation of the new value; null if deleted
}

export interface AuditDiff {
  fields: AuditDiffField[]
}

// ─── Actor reference ──────────────────────────────────────────────────────────
export interface AuditActor {
  officerId: string
  fullName: string
  badgeNumber: string
  departmentName: string
}

// ─── Custody gap ─────────────────────────────────────────────────────────────
// The backend populates this when consecutive custody events have a gap > 24h.
export interface CustodyGap {
  gapHours: number                // Rounded to nearest hour
  fromTimestamp: string           // ISO 8601 — end of previous custody event
  toTimestamp: string             // ISO 8601 — start of this event
}

// ─── Security severity ────────────────────────────────────────────────────────
export const SecuritySeverity = {
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
} as const
export type SecuritySeverity =
  (typeof SecuritySeverity)[keyof typeof SecuritySeverity]

// ─── Audit Entry ──────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string
  eventType: AuditEventType
  category: AuditEventCategory
  actor: AuditActor
  timestamp: string               // ISO 8601
  description: string             // Human-readable summary from the server
  // Present only for data-modified event types (CASE_UPDATED, PERSON_UPDATED, etc.)
  diff: AuditDiff | null
  // Present only for CASE_NOTE_ADDED events
  noteText: string | null
  // Present only for SECURITY event category
  securitySeverity: SecuritySeverity | null
  // Present when this entry is part of a chain of custody with a detected gap before it
  custodyGap: CustodyGap | null
  // Always true — immutability indicator for UI rendering
  isImmutable: boolean
  // Optional entity links for global audit log context
  linkedCaseId: string | null
  linkedCaseNumber: string | null
}

// ─── Audit Entry List Item (lighter version for list rendering) ───────────────
// Identical to AuditEntry in this implementation — the backend returns full entries.
export type AuditEntryListItem = AuditEntry

// ─── Audit Filters ────────────────────────────────────────────────────────────
export interface AuditFilters {
  actorSearch?: string           // Officer name or badge number
  eventTypes?: AuditEventType[]
  dateFrom?: string              // 'YYYY-MM-DD'
  dateTo?: string                // 'YYYY-MM-DD'
  // Global audit log only:
  linkedCaseId?: string
  linkedOfficerId?: string
  page?: number
  pageSize?: number
}

// Default filter: last 7 days, all event types
export const DEFAULT_AUDIT_PAGE_SIZE = 25

// ─── Add Case Note ────────────────────────────────────────────────────────────
export interface AddCaseNotePayload {
  text: string
}

// ─── Audit Export ─────────────────────────────────────────────────────────────
export interface AuditExportParams {
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string       // caseId, officerId, personId, or 'all' for global
  filters: AuditFilters
}
