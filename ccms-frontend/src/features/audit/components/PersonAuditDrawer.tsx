'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { AuditTimeline } from '@shared/components/timeline/AuditTimeline'
import { usePersonAuditHistory } from '@features/audit/hooks/usePersonAuditHistory'
import { AuditFilters, AuditEventType, DEFAULT_AUDIT_PAGE_SIZE } from '@features/audit/types/audit.types'

interface PersonAuditDrawerProps {
  personId: string
  personName: string
  open: boolean
  onClose: () => void
}

const DEFAULT_FILTERS: AuditFilters = {
  actorSearch: '',
  eventTypes: [],
  dateFrom: '',
  dateTo: '',
  page: 1,
  pageSize: DEFAULT_AUDIT_PAGE_SIZE,
}

export function PersonAuditDrawer({
  personId,
  personName,
  open,
  onClose,
}: PersonAuditDrawerProps) {
  const t = useTranslations('audit')
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS)

  // Reset filters when drawer closes
  useEffect(() => {
    if (!open) {
      setFilters(DEFAULT_FILTERS)
    }
  }, [open])

  // Fetch Person Audit History (only when drawer is open)
  const { data, isLoading, isError, refetch, isFetching } = usePersonAuditHistory(
    personId,
    {
      ...filters,
      eventTypes: filters.eventTypes as AuditEventType[],
    },
    open,
  )

  const handleFiltersChange = (partial: Partial<AuditFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: 1, // reset page to 1 on filter changes
    }))
  }

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-[640px] overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{t('personHistory.drawerTitle')}</SheetTitle>
          <SheetDescription>
            {t('personHistory.drawerDescription')} — {personName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <AuditTimeline
            entries={data?.data ?? []}
            total={data?.total ?? 0}
            isLoading={isLoading && open}
            isFetchingNext={isFetching && !isLoading}
            isError={isError}
            onRetry={refetch}
            page={filters.page || 1}
            pageSize={filters.pageSize || DEFAULT_AUDIT_PAGE_SIZE}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
            }
            filters={{
              ...filters,
              eventTypes: filters.eventTypes as AuditEventType[],
            }}
            onFiltersChange={handleFiltersChange}
            surface="person"
            entityId={personId}
            exportPrintTitle={`${t('personHistory.drawerTitle')} — ${personName}`}
            showNoteForm={false}
            showPollingIndicator={false}
            emptyTitle={t('personHistory.empty') || 'No History Available'}
            emptyDescription={t('globalLog.empty.description')}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
