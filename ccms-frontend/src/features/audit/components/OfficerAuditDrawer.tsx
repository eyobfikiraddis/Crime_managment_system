'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { AuditTimeline } from '@shared/components/timeline/AuditTimeline'
import { useOfficerAuditHistory } from '@features/audit/hooks/useOfficerAuditHistory'
import { AuditFilters, AuditEventType, DEFAULT_AUDIT_PAGE_SIZE } from '@features/audit/types/audit.types'

interface OfficerAuditDrawerProps {
  officerId: string
  officerName: string
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

export function OfficerAuditDrawer({
  officerId,
  officerName,
  open,
  onClose,
}: OfficerAuditDrawerProps) {
  const t = useTranslations('audit')
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS)

  // Reset filters when drawer closes
  useEffect(() => {
    if (!open) {
      setFilters(DEFAULT_FILTERS)
    }
  }, [open])

  // Fetch Officer Audit History (only when drawer is open)
  const { data, isLoading, isError, refetch, isFetching } = useOfficerAuditHistory(
    officerId,
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
          <SheetTitle>{t('officerHistory.drawerTitle')}</SheetTitle>
          <SheetDescription>
            {t('officerHistory.drawerDescription')} — {officerName}
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
            surface="officer"
            entityId={officerId}
            exportPrintTitle={`${t('officerHistory.drawerTitle')} — ${officerName}`}
            showNoteForm={false}
            showPollingIndicator={false}
            emptyTitle={t('officerHistory.empty') || 'No History Available'}
            emptyDescription={t('globalLog.empty.description')}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
