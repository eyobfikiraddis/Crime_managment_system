import {
  AuditEventType,
  AuditEventCategory,
  SecuritySeverity,
  SECURITY_EVENT_TYPES,
  EVENT_TYPE_CATEGORY,
} from '../types/audit.types'
import type { LucideIcon } from 'lucide-react'
import {
  Shield,
  Folder,
  Upload,
  User,
  Gavel,
  MessageSquare,
  AlertTriangle,
  LogIn,
  LogOut,
  Key,
  Eye,
} from 'lucide-react'

// ─── Event icon mapping ───────────────────────────────────────────────────────
export const EVENT_TYPE_ICONS: Record<AuditEventType, LucideIcon> = {
  CASE_CREATED:             Folder,
  CASE_UPDATED:             Folder,
  CASE_STATUS_CHANGED:      Folder,
  CASE_OFFICER_ASSIGNED:    User,
  CASE_OFFICER_REMOVED:     User,
  CASE_PERMISSIONS_CHANGED: Shield,
  CASE_DELETED:             Folder,
  EVIDENCE_ADDED:           Upload,
  EVIDENCE_UPDATED:         Upload,
  EVIDENCE_DELETED:         Upload,
  CUSTODY_TRANSFERRED:      Upload,
  CUSTODY_EXAMINED:         Upload,
  CUSTODY_STORED:           Upload,
  CUSTODY_PRESENTED:        Upload,
  LOGIN_SUCCESS:            LogIn,
  LOGIN_FAILURE:            AlertTriangle,
  LOGOUT:                   LogOut,
  SESSION_EXPIRED:          LogOut,
  FORCED_LOGOUT:            LogOut,
  PERMISSION_GRANTED:       Key,
  PERMISSION_REVOKED:       Key,
  ROLE_CHANGED:             Key,
  PASSWORD_RESET:           Key,
  PII_ACCESSED:             Eye,
  CHARGE_FILED:             Gavel,
  CHARGE_UPDATED:           Gavel,
  CHARGE_DROPPED:           Gavel,
  SENTENCE_RECORDED:        Gavel,
  COURT_CASE_CREATED:       Gavel,
  COURT_CASE_UPDATED:       Gavel,
  HEARING_SCHEDULED:        Gavel,
  PERSON_CREATED:           User,
  PERSON_UPDATED:           User,
  PERSON_ROLE_PROMOTED:     User,
  OFFICER_CREATED:          User,
  OFFICER_UPDATED:          User,
  OFFICER_ACTIVATED:        User,
  OFFICER_DEACTIVATED:      User,
  CASE_NOTE_ADDED:          MessageSquare,
}

// ─── Event icon colour by category ───────────────────────────────────────────
// Returns a Tailwind text colour class for the event icon.
export function getEventIconColour(category: AuditEventCategory): string {
  switch (category) {
    case AuditEventCategory.CASE:       return 'text-primary'
    case AuditEventCategory.EVIDENCE:   return 'text-accent'
    case AuditEventCategory.SECURITY:   return 'text-destructive'
    case AuditEventCategory.LEGAL:      return 'text-warning'
    case AuditEventCategory.PERSONNEL:  return 'text-success'
    case AuditEventCategory.ANNOTATION: return 'text-muted-foreground'
    default: return 'text-muted-foreground'
  }
}

// ─── Security severity badge variant ─────────────────────────────────────────
import type { BadgeVariant } from '@shared/types/ui.types'

export const SECURITY_SEVERITY_VARIANTS: Record<SecuritySeverity, BadgeVariant> = {
  LOW:    'muted',
  MEDIUM: 'warning',
  HIGH:   'destructive',
}

// ─── Security event check ─────────────────────────────────────────────────────
export function isSecurityEvent(eventType: AuditEventType): boolean {
  return SECURITY_EVENT_TYPES.includes(eventType)
}

// ─── Diff-producing event check ───────────────────────────────────────────────
// Returns true when the event type is expected to carry a diff payload.
const DIFF_PRODUCING_TYPES: AuditEventType[] = [
  AuditEventType.CASE_UPDATED,
  AuditEventType.CASE_STATUS_CHANGED,
  AuditEventType.CASE_PERMISSIONS_CHANGED,
  AuditEventType.EVIDENCE_UPDATED,
  AuditEventType.CHARGE_UPDATED,
  AuditEventType.COURT_CASE_UPDATED,
  AuditEventType.PERSON_UPDATED,
  AuditEventType.OFFICER_UPDATED,
  AuditEventType.ROLE_CHANGED,
]

export function isDiffProducingEvent(eventType: AuditEventType): boolean {
  return DIFF_PRODUCING_TYPES.includes(eventType)
}

// ─── Custody event check ─────────────────────────────────────────────────────
const CUSTODY_EVENT_TYPES: AuditEventType[] = [
  AuditEventType.CUSTODY_TRANSFERRED,
  AuditEventType.CUSTODY_EXAMINED,
  AuditEventType.CUSTODY_STORED,
  AuditEventType.CUSTODY_PRESENTED,
  AuditEventType.EVIDENCE_ADDED,
]

export function isCustodyEvent(eventType: AuditEventType): boolean {
  return CUSTODY_EVENT_TYPES.includes(eventType)
}

// ─── Format custody gap duration ─────────────────────────────────────────────
export function formatCustodyGapHours(gapHours: number): string {
  if (gapHours < 24) return `${gapHours} hour${gapHours === 1 ? '' : 's'}`
  const days = Math.floor(gapHours / 24)
  const rem = gapHours % 24
  if (rem === 0) return `${days} day${days === 1 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'}, ${rem} hour${rem === 1 ? '' : 's'}`
}

// ─── Audit CSV filename ───────────────────────────────────────────────────────
import { format } from 'date-fns'

export function buildAuditCsvFilename(
  surface: 'case' | 'officer' | 'person' | 'global',
  entityLabel?: string,
): string {
  const date = format(new Date(), 'yyyy-MM-dd')
  if (entityLabel) return `ccms-audit-${surface}-${entityLabel}-${date}.csv`
  return `ccms-audit-${surface}-${date}.csv`
}

// ─── Event type groups for filter multi-select ────────────────────────────────
// Returns all event types belonging to a category.
export function getEventTypesByCategory(
  category: AuditEventCategory,
): AuditEventType[] {
  return Object.entries(EVENT_TYPE_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([type]) => type as AuditEventType)
}
