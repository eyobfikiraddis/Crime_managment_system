import type { AuditFilters } from '@features/audit/types/audit.types'

export const auditKeys = {
  all: () => ['audit'] as const,

  // Case timeline
  caseTimeline: (caseId: string) =>
    [...auditKeys.all(), 'case', caseId] as const,
  caseTimelineFiltered: (caseId: string, filters: AuditFilters) =>
    [...auditKeys.caseTimeline(caseId), filters] as const,

  // Global audit log (admin+)
  global: () => [...auditKeys.all(), 'global'] as const,
  globalFiltered: (filters: AuditFilters) =>
    [...auditKeys.global(), filters] as const,

  // Officer history (admin+)
  officerHistory: (officerId: string) =>
    [...auditKeys.all(), 'officer', officerId] as const,
  officerHistoryFiltered: (officerId: string, filters: AuditFilters) =>
    [...auditKeys.officerHistory(officerId), filters] as const,

  // Person history (admin+)
  personHistory: (personId: string) =>
    [...auditKeys.all(), 'person', personId] as const,
  personHistoryFiltered: (personId: string, filters: AuditFilters) =>
    [...auditKeys.personHistory(personId), filters] as const,
} as const
