import { apiClient } from '@services/api/client'

export interface AuditEntry {
  id: string
  eventType: string
  actorName: string
  description: string
  createdAt: string
}

/**
 * Fire-and-forget: log that a PII field was revealed by the current user.
 * Must not surface errors to the UI.
 */
export async function logPIIRevealEvent(
  targetId: string,
  field: string,
  targetType: 'person' | 'officer' = 'person',
): Promise<void> {
  try {
    await apiClient.post('/api/v1/audit/pii-reveal', {
      target_type: targetType,
      target_id: targetId,
      field,
    })
  } catch (err) {
    // Silent failure — audit must not block user action
    // Keep a lightweight console.warn for ops visibility during development
    // Do not rethrow.
    // eslint-disable-next-line no-console
    console.warn('logPIIRevealEvent failed', err)
  }
}

/**
 * Get recent audit events for an entity (compact list for detail pages).
 */
export async function getRecentActivityForEntity(
  targetType: 'person' | 'officer',
  targetId: string,
  limit = 5,
): Promise<{ data: AuditEntry[]; total: number }> {
  const params = new URLSearchParams()
  params.set('target_type', targetType)
  params.set('target_id', targetId)
  params.set('limit', String(limit))

  const raw = await apiClient.get(`/api/v1/audit/recent?${params.toString()}`)
  // Expecting shape: { data: AuditEntry[], total: number }
  return raw.data as { data: AuditEntry[]; total: number }
}
