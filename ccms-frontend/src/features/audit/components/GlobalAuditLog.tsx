'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs'
import { format, subDays } from 'date-fns'

import { PageHeader } from '@shared/components/display/PageHeader'
import { AuditTimeline } from '@shared/components/timeline/AuditTimeline'
import { useGlobalAuditLog } from '@features/audit/hooks/useGlobalAuditLog'
import { AuditEventType, DEFAULT_AUDIT_PAGE_SIZE } from '@features/audit/types/audit.types'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'

export function GlobalAuditLog() {
  const t = useTranslations('audit')

  const [filters, setFilters] = useQueryStates({
    actorSearch:      parseAsString.withDefault(''),
    eventTypes:       parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom:         parseAsString.withDefault(
      format(subDays(new Date(), 6), 'yyyy-MM-dd')
    ),
    dateTo:           parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd')),
    linkedCaseId:     parseAsString.withDefault(''),
    linkedOfficerId:  parseAsString.withDefault(''),
    page:             parseAsInteger.withDefault(1),
    pageSize:         parseAsInteger.withDefault(DEFAULT_AUDIT_PAGE_SIZE),
  })

  // Local state for scope filters to prevent input stuttering
  const [scopeType, setScopeType] = useState<'all' | 'case' | 'officer'>('all')
  const [scopeSearchValue, setScopeSearchValue] = useState('')

  // Sync state if filters change externally (e.g. clear filters)
  useEffect(() => {
    if (!filters.linkedCaseId && !filters.linkedOfficerId) {
      setScopeType('all')
      setScopeSearchValue('')
    } else if (filters.linkedCaseId) {
      setScopeType('case')
      setScopeSearchValue(filters.linkedCaseId)
    } else if (filters.linkedOfficerId) {
      setScopeType('officer')
      setScopeSearchValue(filters.linkedOfficerId)
    }
  }, [filters.linkedCaseId, filters.linkedOfficerId])

  const handleScopeTypeChange = (value: 'all' | 'case' | 'officer') => {
    setScopeType(value)
    setScopeSearchValue('')
    void setFilters({
      linkedCaseId: '',
      linkedOfficerId: '',
      page: 1,
    })
  }

  const handleScopeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (scopeType === 'case') {
      void setFilters({
        linkedCaseId: scopeSearchValue.trim(),
        linkedOfficerId: '',
        page: 1,
      })
    } else if (scopeType === 'officer') {
      void setFilters({
        linkedCaseId: '',
        linkedOfficerId: scopeSearchValue.trim(),
        page: 1,
      })
    }
  }

  // Fetch Global Log
  const { data, isLoading, isError, refetch, isFetching } = useGlobalAuditLog({
    ...filters,
    eventTypes: filters.eventTypes as AuditEventType[],
  })

  const renderEntityScope = () => (
    <PermissionGuard permission={Permission.ADMIN_MANAGE}>
      <div className="flex flex-col gap-1.5 max-w-xl">
        <span className="text-xs font-semibold text-foreground-muted">
          {t('globalLog.entityScope.label') || 'Entity Scope (Optional)'}
        </span>
        <form onSubmit={handleScopeSearchSubmit} className="flex gap-2">
          <Select
            value={scopeType}
            onValueChange={(val) => handleScopeTypeChange(val as any)}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('globalLog.entityScope.allEntities') || 'All Entities'}
              </SelectItem>
              <SelectItem value="case">
                {t('globalLog.entityScope.caseLabel') || 'Case'}
              </SelectItem>
              <SelectItem value="officer">
                {t('globalLog.entityScope.officerLabel') || 'Officer'}
              </SelectItem>
            </SelectContent>
          </Select>

          {scopeType !== 'all' && (
            <div className="flex-1 flex gap-2">
              <Input
                value={scopeSearchValue}
                onChange={(e) => setScopeSearchValue(e.target.value)}
                placeholder={
                  scopeType === 'case'
                    ? t('globalLog.entityScope.casePlaceholder') || 'Enter Case UUID...'
                    : t('globalLog.entityScope.officerPlaceholder') || 'Enter Officer UUID...'
                }
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 text-xs px-3">
                {t('filter.label') || 'Apply'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </PermissionGuard>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('globalLog.heading')}
        description={t('globalLog.description')}
      />

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
        surface="global"
        entityId="all"
        showEntityScope={true}
        renderEntityScopeField={renderEntityScope}
        showNoteForm={false}
        showPollingIndicator={false}
        emptyTitle={t('globalLog.empty.title')}
        emptyDescription={t('globalLog.empty.description')}
      />
    </div>
  )
}
