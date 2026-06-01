'use client'

import { useParams } from 'next/navigation'
import { useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs'
import { AuditTimeline } from '@shared/components/timeline/AuditTimeline'
import { useCaseTimeline } from '@features/audit/hooks'
import { AuditEventType, DEFAULT_AUDIT_PAGE_SIZE } from '@features/audit/types/audit.types'
import { useTranslations } from 'next-intl'

export default function CaseTimelinePage() {
  const params = useParams<{ caseId: string }>()
  const caseId = params.caseId
  const t = useTranslations('audit')

  const [filters, setFilters] = useQueryStates({
    actorSearch:   parseAsString.withDefault(''),
    eventTypes:    parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom:      parseAsString.withDefault(''),
    dateTo:        parseAsString.withDefault(''),
    page:          parseAsInteger.withDefault(1),
    pageSize:      parseAsInteger.withDefault(DEFAULT_AUDIT_PAGE_SIZE),
  })

  const { data, isLoading, isError, refetch, isFetching } = useCaseTimeline(
    caseId,
    {
      ...filters,
      eventTypes: filters.eventTypes as AuditEventType[],
    },
  )

  return (
    <div className="space-y-4">
      <AuditTimeline
        entries={data?.data ?? []}
        total={data?.total ?? 0}
        isLoading={isLoading}
        isFetchingNext={isFetching && !isLoading}
        isError={isError}
        onRetry={refetch}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => setFilters({ page })}
        onPageSizeChange={(pageSize) => setFilters({ pageSize, page: 1 })}
        filters={{
          ...filters,
          eventTypes: filters.eventTypes as AuditEventType[],
        }}
        onFiltersChange={(partial) =>
          setFilters({ ...partial, page: 1 } as any)
        }
        surface="case"
        entityId={caseId}
        showNoteForm={true}
        caseId={caseId}
        showPollingIndicator={true}
        emptyTitle={t('caseTimeline.empty.title')}
        emptyDescription={t('caseTimeline.empty.description')}
      />
    </div>
  )
}
