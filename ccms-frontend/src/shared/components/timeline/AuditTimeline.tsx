'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

import type { AuditEntry, AuditFilters, AuditEventType } from '@features/audit/types/audit.types'
import { AuditFilterBar } from './AuditFilterBar'
import { AuditExportPanel } from './AuditExportPanel'
import { CustodyGapBadge } from './CustodyGapBadge'
import { TimelineConnector } from './TimelineConnector'
import { TimelineEntry } from './TimelineEntry'
import { AddCaseNoteForm } from './AddCaseNoteForm'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { TablePagination } from '@shared/components/table/TablePagination'

interface AuditTimelineProps {
  // Data
  entries: AuditEntry[]
  total: number
  isLoading: boolean
  isFetchingNext: boolean
  isError: boolean
  onRetry: () => void

  // Pagination
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void

  // Filters (managed externally)
  filters: AuditFilters
  onFiltersChange: (filters: Partial<AuditFilters>) => void

  // Export
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string
  exportPrintTitle?: string

  // Case note form (case timeline only)
  showNoteForm?: boolean
  caseId?: string

  // Entity scope (global audit log only)
  showEntityScope?: boolean
  renderEntityScopeField?: () => React.ReactNode

  // Polling indicator (case timeline only)
  showPollingIndicator?: boolean

  // Empty state customisation
  emptyTitle?: string
  emptyDescription?: string
}

export function AuditTimeline({
  entries,
  total,
  isLoading,
  isFetchingNext,
  isError,
  onRetry,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  filters,
  onFiltersChange,
  surface,
  entityId,
  exportPrintTitle,
  showNoteForm = false,
  caseId,
  showEntityScope = false,
  renderEntityScopeField,
  showPollingIndicator = false,
  emptyTitle,
  emptyDescription,
}: AuditTimelineProps) {
  const t = useTranslations('audit')

  // Calculate active filter count
  let activeFilterCount = 0
  if (filters.actorSearch) activeFilterCount++
  if (filters.eventTypes?.length) activeFilterCount += filters.eventTypes.length
  if (filters.dateFrom) activeFilterCount++
  if (filters.dateTo) activeFilterCount++
  if (filters.linkedCaseId) activeFilterCount++
  if (filters.linkedOfficerId) activeFilterCount++

  const handleClearAll = () => {
    onFiltersChange({
      actorSearch: '',
      eventTypes: [],
      dateFrom: '',
      dateTo: '',
      linkedCaseId: '',
      linkedOfficerId: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Top Header Actions (Screen Only) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        {/* Polling Indicator */}
        {showPollingIndicator ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            {t('caseTimeline.pollingIndicator')}
          </div>
        ) : (
          <div />
        )}

        {/* Export Buttons */}
        {!isLoading && !isError && entries.length > 0 && (
          <AuditExportPanel
            surface={surface}
            entityId={entityId}
            filters={filters}
            printTitle={exportPrintTitle || undefined}
          />
        )}
      </div>

      {/* Main Filter Bar */}
      <div className="print:hidden">
        <AuditFilterBar
          actorSearch={filters.actorSearch || ''}
          onActorSearchChange={(actorSearch) => onFiltersChange({ actorSearch })}
          selectedEventTypes={filters.eventTypes || []}
          onEventTypesChange={(eventTypes) => onFiltersChange({ eventTypes })}
          dateFrom={filters.dateFrom || ''}
          dateTo={filters.dateTo || ''}
          onDateFromChange={(dateFrom) => onFiltersChange({ dateFrom })}
          onDateToChange={(dateTo) => onFiltersChange({ dateTo })}
          onClearAll={handleClearAll}
          activeFilterCount={activeFilterCount}
        />

        {/* Global Scope injection */}
        {showEntityScope && renderEntityScopeField && (
          <div className="mt-3 border-t border-border pt-3">
            {renderEntityScopeField()}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {isLoading && entries.length === 0 ? (
          /* 5 skeleton cards */
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-3 w-48 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title={t('globalLog.error') || 'Error Loading Log'}
            description={t('caseTimeline.error') || 'Failed to fetch the requested timeline.'}
            retry={onRetry}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            title={emptyTitle || t('globalLog.empty.title') || 'No Audit Entries'}
            description={emptyDescription || t('globalLog.empty.description') || 'No audit events match current filters.'}
          />
        ) : (
          /* Timeline Cards Stack */
          <div className="flex flex-col">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex flex-col">
                {/* Custody Gap Badge above this entry */}
                {entry.custodyGap !== null && (
                  <CustodyGapBadge
                    gapHours={entry.custodyGap.gapHours}
                    fromTimestamp={entry.custodyGap.fromTimestamp}
                    toTimestamp={entry.custodyGap.toTimestamp}
                  />
                )}

                <TimelineEntry entry={entry} />

                {/* Connector line underneath the entry (except last card) */}
                {index < entries.length - 1 && (
                  <TimelineConnector
                    isGap={!!entries[index + 1]?.custodyGap}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Strip (Screen Only) */}
      {!isLoading && !isError && entries.length > 0 && (
        <div className="pt-2 border-t border-border print:hidden" data-pagination="">
          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onChange={(newPage, newPageSize) => {
              onPageChange(newPage)
              if (newPageSize !== pageSize) {
                onPageSizeChange(newPageSize)
              }
            }}
          />
        </div>
      )}

      {/* Add Case Note Form (bottom, case timeline only) */}
      {showNoteForm && caseId && (
        <AddCaseNoteForm caseId={caseId} />
      )}
    </div>
  )
}
