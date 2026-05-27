import { differenceInMinutes } from 'date-fns'
import type { CustodyEvent, CustodyGap } from '../types/evidence.types'

export function detectCustodyGaps(events: CustodyEvent[]): CustodyGap[] {
  if (events.length < 2) return []

  const gaps: CustodyGap[] = []
  for (let i = 0; i < events.length - 1; i += 1) {
    const currentEvent = events[i]
    const nextEvent = events[i + 1]
    if (!currentEvent || !nextEvent) continue

    const current = new Date(currentEvent.timestamp)
    const next = new Date(nextEvent.timestamp)
    const diffMinutes = Math.abs(differenceInMinutes(next, current))
    const diffHours = Math.ceil(diffMinutes / 60)

    if (diffHours > 24) {
      gaps.push({ afterEventId: currentEvent.id, gapHours: diffHours })
    }
  }

  return gaps
}
