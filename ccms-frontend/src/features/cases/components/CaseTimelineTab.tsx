'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { 
  Clock, FileText, ArrowRightLeft, Upload, UserPlus, UserMinus, Shield, Eye, 
  Gavel, KeyRound, AlertTriangle, Printer, Search, RefreshCw, X 
} from 'lucide-react'

import { useCaseTimeline } from '../hooks/useCaseTimeline'
import { useAddCaseNote } from '../hooks/useAddCaseNote'
import { CaseTimelineEntry } from './CaseTimelineEntry'
import type { TimelineEventType, TimelineFilters } from '../types/case.types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { Timeline } from '@/shared/components/timeline/Timeline'

const EVENT_ICON_MAP: Record<TimelineEventType, any> = {
  CASE_CREATED: Clock,
  CASE_UPDATED: FileText,
  STATUS_CHANGED: ArrowRightLeft,
  EVIDENCE_ADDED: Upload,
  EVIDENCE_UPDATED: Upload,
  OFFICER_ASSIGNED: UserPlus,
  OFFICER_REMOVED: UserMinus,
  ARREST_RECORDED: Shield,
  INTERROGATION_RECORDED: Eye,
  LEGAL_ACTION: Gavel,
  NOTE_ADDED: FileText,
  PERMISSION_CHANGED: KeyRound,
  LOGIN_FAILURE: AlertTriangle,
}

// Custom hook to detect if window/tab is active
function useIsWindowActive() {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible')
    }
    const handleFocus = () => setIsActive(true)
    const handleBlur = () => setIsActive(false)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return isActive
}

interface CaseTimelineTabProps {
  caseId: string
}

export function CaseTimelineTab({ caseId }: CaseTimelineTabProps) {
  const t = useTranslations('cases')
  const isWindowActive = useIsWindowActive()

  // Filter States
  const [actorSearch, setActorSearch] = useState('')
  const [selectedEventType, setSelectedEventType] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)

  // Note State
  const [noteContent, setNoteContent] = useState('')

  // Build Filters Payload
  const filters: TimelineFilters & { page: number; pageSize: number } = {
    page,
    pageSize: 50,
  }

  if (actorSearch.trim()) {
    filters.actorSearch = actorSearch.trim()
  }
  if (selectedEventType) {
    filters.eventTypes = [selectedEventType as TimelineEventType]
  }
  if (dateFrom) {
    filters.dateFrom = dateFrom.toISOString()
  }
  if (dateTo) {
    filters.dateTo = dateTo.toISOString()
  }

  // Fetch Timeline Data
  const { data: timelineData, isLoading, refetch, isFetching } = useCaseTimeline({
    caseId,
    filters,
    enabled: isWindowActive,
  })

  // Add Note Mutation
  const addNoteMutation = useAddCaseNote(caseId)

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return

    addNoteMutation.mutate(noteContent, {
      onSuccess: () => {
        setNoteContent('')
        refetch()
      },
    })
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleResetFilters = () => {
    setActorSearch('')
    setSelectedEventType('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setPage(1)
  }

  // Check if custody gap exists (> 24 hours between consecutive events)
  const checkGap = (currentDateStr: string, nextDateStr: string) => {
    const current = new Date(currentDateStr).getTime()
    const next = new Date(nextDateStr).getTime()
    const diffMs = Math.abs(current - next)
    return diffMs > 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-6">
      {/* Note Creation Card - Hidden when printing */}
      <Card className="border-border bg-card print:hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('timeline.addNote')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="space-y-3">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('timeline.notePlaceholder')}
              className="min-h-[80px]"
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!noteContent.trim() || addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? t('detail.loading') : t('timeline.noteSubmit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter Bar and Actions Card - Hidden when printing */}
      <Card className="border-border bg-card print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Actor Search */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <span className="text-xs font-semibold text-foreground-muted block">
                {t('timeline.filterActor')}
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
                <Input
                  value={actorSearch}
                  onChange={(e) => setActorSearch(e.target.value)}
                  placeholder={t('timeline.filterActor')}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Event Type Select */}
            <div className="min-w-[180px] space-y-1">
              <span className="text-xs font-semibold text-foreground-muted block">
                {t('timeline.filterEventType')}
              </span>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{t('list.filterStatus')}</option>
                {Object.keys(EVENT_ICON_MAP).map((type) => (
                  <option key={type} value={type}>
                    {t(`timeline.eventTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-foreground-muted block">
                {t('list.filterDateRange')} (From)
              </span>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="From date"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-foreground-muted block">
                {t('list.filterDateRange')} (To)
              </span>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                placeholder="To date"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {(actorSearch || selectedEventType || dateFrom || dateTo) && (
                <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Clear Filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh Timeline">
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1.5">
                <Printer className="h-4 w-4" />
                {t('timeline.printButton')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Display Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between print:mb-4">
          <CardTitle className="text-base font-semibold">{t('timeline.pageTitle')}</CardTitle>
          <div className="hidden print:block text-xs font-mono text-foreground-muted">
            Printed on: {format(new Date(), 'dd MMM yyyy HH:mm')}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !timelineData || timelineData.data.length === 0 ? (
            <EmptyState title={t('timeline.empty')} />
          ) : (
            <Timeline>
              <div className="relative border-l border-border pl-6 ml-5 space-y-6">
                {timelineData.data.map((entry, index) => {
                  const Icon = EVENT_ICON_MAP[entry.eventType] ?? Clock
                  
                  // Chronological gap check with next entry in array
                  const nextEntry = timelineData.data[index + 1]
                  const hasGap = nextEntry ? checkGap(entry.createdAt, nextEntry.createdAt) : false

                  return (
                    <div key={entry.id} className="relative group">
                      {/* Vertical line indicator */}
                      <span className="absolute -left-[31px] top-5 h-full w-px bg-border group-last:h-0" />
                      
                      {/* Badge marker positioning */}
                      <span className="absolute -left-[45px] top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background border border-border">
                        <Icon className="h-4 w-4 text-foreground-muted" />
                      </span>

                      {/* Content panel */}
                      <CaseTimelineEntry entry={entry} icon={Icon} />

                      {/* Gap message alert if difference exceeds 24 hrs */}
                      {hasGap && (
                        <div className="my-4 flex items-center justify-center print:hidden">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 text-xs font-semibold rounded-full border border-amber-500/20 shadow-sm animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{t('timeline.custodyGap')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Timeline>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
