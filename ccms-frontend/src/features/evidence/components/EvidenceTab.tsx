'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'
import { LayoutGrid, LayoutList, Plus, RotateCcw, X, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/display/PageHeader'
import { DataTable } from '@/shared/components/table/DataTable'
import { TableFilterBar } from '@/shared/components/table/TableFilterBar'
import { TablePagination } from '@/shared/components/table/TablePagination'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { useOfficersSearch } from '@/features/cases/hooks/useOfficersSearch'
import { Permission } from '@/shared/constants/permissions'
import { cn } from '@/lib/utils'

import { useEvidenceList } from '../hooks/useEvidenceList'
import { useEvidenceColumns } from './evidence-columns'
import { LazyEvidenceGallery as EvidenceGallery } from './LazyEvidenceGallery'
import { LazyLightbox as EvidenceLightbox } from './LazyLightbox'
import { EvidenceUploadDrawer } from './EvidenceUploadDrawer'
import { EvidenceDetailDrawer } from './EvidenceDetailDrawer'
import { RecordCustodyEventDrawer } from './RecordCustodyEventDrawer'
import { EvidenceType, type EvidenceFilters, type EvidenceListItem } from '../types/evidence.types'

import { BulkActionBar } from '@shared/components/table/BulkActionBar'
import { useBulkExportEvidence } from '../hooks/useBulkExportEvidence'
import { useFocusRestore } from '@shared/utils/focusUtils'

interface EvidenceTabProps {
  caseId: string
}

type ViewMode = 'table' | 'gallery'

export function EvidenceTab({ caseId }: EvidenceTabProps) {
  const t = useTranslations('evidence')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [, startTransition] = useTransition()

  // Selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id])
  }, [rowSelection])

  // Drawer & modal states
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [detailEvidenceId, setDetailEvidenceId] = useState<string | null>(null)
  const [custodyEvidenceId, setCustodyEvidenceId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0)

  // Focus restoration hook
  const { openWithFocusRestore, restoreFocusOnClose } = useFocusRestore()

  // Bulk Export Mutation
  const exportMutation = useBulkExportEvidence(caseId)

  // Officer search filter state
  const [officerSearch, setOfficerSearch] = useState('')
  const { data: officerResults, isLoading: isOfficerLoading } = useOfficersSearch(officerSearch)

  // URL-driven query parameters with nuqs
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    evidenceType: parseAsArrayOf(parseAsString).withDefault([]),
    collectedById: parseAsString.withDefault(''),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
    sortField: parseAsString.withDefault('collectedAt'),
    sortDirection: parseAsString.withDefault('desc'),
  })

  // Build query filters object
  const queryFilters: EvidenceFilters = useMemo(() => {
    return {
      search: filters.search || undefined,
      evidenceType:
        filters.evidenceType.length > 0
          ? (filters.evidenceType as EvidenceType[])
          : undefined,
      collectedById: filters.collectedById || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField as any,
      sortDirection: filters.sortDirection as any,
    }
  }, [filters])

  const { data, isLoading } = useEvidenceList(caseId, queryFilters)

  // View Details callback
  const handleViewDetails = (id: string) => {
    openWithFocusRestore(() => {
      setDetailEvidenceId(id)
    })
  }

  // Record Custody callback
  const handleRecordCustody = (id: string) => {
    openWithFocusRestore(() => {
      setCustodyEvidenceId(id)
    })
  }

  const columns = useEvidenceColumns({
    caseId,
    onViewDetails: handleViewDetails,
    onRecordCustody: handleRecordCustody,
  })

  const handlePaginationChange = (page: number, pageSize: number) => {
    startTransition(() => {
      void setFilters({ page, pageSize })
    })
  }

  const handleSortingChange = (sorting: any) => {
    startTransition(() => {
      if (sorting && sorting.length > 0) {
        const field = sorting[0].id
        const direction = sorting[0].desc ? 'desc' : 'asc'
        void setFilters({ sortField: field, sortDirection: direction })
      } else {
        void setFilters({ sortField: 'collectedAt', sortDirection: 'desc' })
      }
    })
  }

  const toggleEvidenceType = (type: string) => {
    startTransition(() => {
      const current = filters.evidenceType
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
      void setFilters({ evidenceType: next.length > 0 ? next : null, page: 1 })
    })
  }

  const clearAllFilters = () => {
    startTransition(() => {
      void setFilters({
        search: null,
        evidenceType: null,
        collectedById: null,
        dateFrom: null,
        dateTo: null,
        page: 1,
      })
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.evidenceType.length > 0 ||
      filters.collectedById ||
      filters.dateFrom ||
      filters.dateTo
  )

  const officerOptions = useMemo(() => {
    return (
      officerResults?.map((officer) => ({
        value: officer.id,
        label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`,
      })) ?? []
    )
  }, [officerResults])

  // Resolve active officer name for the filter chips
  const activeOfficerName = useMemo(() => {
    if (!filters.collectedById) return ''
    const foundInSearch = officerResults?.find((o) => o.id === filters.collectedById)
    if (foundInSearch) return `${foundInSearch.firstName} ${foundInSearch.lastName}`
    const foundInData = data?.data.find((item) => item.collectedBy.id === filters.collectedById)
    if (foundInData) return `${foundInData.collectedBy.firstName} ${foundInData.collectedBy.lastName}`
    return filters.collectedById
  }, [filters.collectedById, officerResults, data])

  // Photos lists for gallery view and lightbox
  const galleryPhotos = useMemo(() => {
    return data?.data.filter((item) => item.evidenceType === 'CRIME_SCENE_PHOTO') ?? []
  }, [data])

  const handleRowClick = (row: EvidenceListItem) => {
    if (row.evidenceType === 'CRIME_SCENE_PHOTO') {
      const index = galleryPhotos.findIndex((photo) => photo.id === row.id)
      if (index !== -1) {
        openWithFocusRestore(() => {
          setLightboxInitialIndex(index)
          setLightboxOpen(true)
        })
      } else {
        handleViewDetails(row.id)
      }
    } else {
      handleViewDetails(row.id)
    }
  }

  const handleOpenUpload = () => {
    openWithFocusRestore(() => {
      setUploadDrawerOpen(true)
    })
  }

  const handleCloseUpload = () => {
    setUploadDrawerOpen(false)
    restoreFocusOnClose()
  }

  const handleCloseDetail = () => {
    setDetailEvidenceId(null)
    restoreFocusOnClose()
  }

  const handleCloseCustody = () => {
    setCustodyEvidenceId(null)
    restoreFocusOnClose()
  }

  const handleCloseLightbox = () => {
    setLightboxOpen(false)
    restoreFocusOnClose()
  }

  const handleBulkExport = () => {
    exportMutation.mutate(selectedIds, {
      onSuccess: () => {
        setRowSelection({})
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tab.heading')}
        description={t('tab.entityCount', { count: data?.total ?? 0 })}
        actions={
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 rounded-md border border-border p-1 bg-card">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-8 rounded-sm',
                  viewMode === 'table' ? 'bg-muted text-[var(--color-primary)]' : 'text-foreground-muted'
                )}
                onClick={() => setViewMode('table')}
                title={t('tab.viewToggle.table')}
              >
                <LayoutList className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-8 rounded-sm',
                  viewMode === 'gallery' ? 'bg-muted text-[var(--color-primary)]' : 'text-foreground-muted'
                )}
                onClick={() => setViewMode('gallery')}
                title={t('tab.viewToggle.gallery')}
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>

            {/* Add Evidence button */}
            <PermissionGuard permission={Permission.EVIDENCE_MANAGE}>
              <Button onClick={handleOpenUpload}>
                <Plus className="mr-2 size-4" />
                {t('tab.addEvidence')}
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Table Filter Bar */}
        <TableFilterBar
          value={filters.search}
          onChange={(val) => void setFilters({ search: val || null, page: 1 })}
          placeholder={t('tab.filters.search')}
        >
          {/* Type Multi-Select Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {t('tab.filters.type')}
                {filters.evidenceType.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {filters.evidenceType.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-2">
                {Object.values(EvidenceType).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.evidenceType.includes(type)}
                      onCheckedChange={() => toggleEvidenceType(type)}
                    />
                    <span className="text-sm font-medium">{t(`types.${type}`)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Collected By Officer SearchableSelect */}
          <SearchableSelect
            options={officerOptions}
            value={filters.collectedById || undefined}
            onChange={(val) => void setFilters({ collectedById: val || null, page: 1 })}
            onSearch={setOfficerSearch}
            isLoading={isOfficerLoading}
            placeholder={t('tab.filters.collectedBy')}
          />

          {/* Date Range DatePickers */}
          <div className="flex items-center gap-2">
            <DatePicker
              value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onChange={(date) =>
                void setFilters({ dateFrom: date ? date.toISOString().slice(0, 10) : null, page: 1 })
              }
              placeholder="From Date"
            />
            <span className="text-foreground-muted text-xs">to</span>
            <DatePicker
              value={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onChange={(date) =>
                void setFilters({ dateTo: date ? date.toISOString().slice(0, 10) : null, page: 1 })
              }
              placeholder="To Date"
            />
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="h-9 px-2 text-foreground-muted"
              onClick={clearAllFilters}
            >
              <RotateCcw className="mr-2 size-4" />
              {t('tab.filters.clearAll')}
            </Button>
          )}
        </TableFilterBar>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-foreground-muted">Active Filters:</span>

            {filters.search && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Search: "{filters.search}"
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => void setFilters({ search: null, page: 1 })}
                />
              </Badge>
            )}

            {filters.evidenceType.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1 pr-1 font-normal">
                Type: {t(`types.${type}`)}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleEvidenceType(type)}
                />
              </Badge>
            ))}

            {filters.collectedById && activeOfficerName && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Collected By: {activeOfficerName}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => void setFilters({ collectedById: null, page: 1 })}
                />
              </Badge>
            )}

            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                Date: {filters.dateFrom || '*'} to {filters.dateTo || '*'}
                <X
                  className="size-3 cursor-pointer hover:text-foreground"
                  onClick={() => void setFilters({ dateFrom: null, dateTo: null, page: 1 })}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main content body */}
      <div className="space-y-4">
        {selectedIds.length > 0 && viewMode === 'table' && (
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setRowSelection({})}
            actions={[
              {
                label: t('bulk.export.actionLabel'),
                icon: Download,
                onClick: handleBulkExport,
                disabled: exportMutation.isPending,
                disabledTooltip: t('bulk.export.downloading'),
              },
            ]}
          />
        )}

        {viewMode === 'table' ? (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              pageIndex: filters.page - 1,
              pageSize: filters.pageSize,
            }}
            onPaginationChange={(state) => handlePaginationChange(state.pageIndex + 1, state.pageSize)}
            sorting={[{ id: filters.sortField, desc: filters.sortDirection === 'desc' }]}
            onSortingChange={handleSortingChange}
            onRowClick={handleRowClick}
            enableRowSelection={true}
            onRowSelectionChange={setRowSelection as any}
            rowSelection={rowSelection}
            emptyTitle={hasActiveFilters ? t('tab.emptyFiltered') : t('tab.empty')}
            emptyMessage={hasActiveFilters ? '' : t('tab.emptyDescription')}
          />
        ) : (
          <EvidenceGallery
            items={galleryPhotos}
            onView={(index) => {
              openWithFocusRestore(() => {
                setLightboxInitialIndex(index)
                setLightboxOpen(true)
              })
            }}
            onDetails={handleViewDetails}
          />
        )}

        {data && data.total > 0 && (
          <TablePagination
            total={data.total}
            page={filters.page}
            pageSize={filters.pageSize}
            onChange={handlePaginationChange}
          />
        )}
      </div>

      {/* Upload Drawer */}
      {uploadDrawerOpen && (
        <EvidenceUploadDrawer
          open={uploadDrawerOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseUpload()
          }}
          caseId={caseId}
        />
      )}

      {/* Detail Drawer */}
      {detailEvidenceId && (
        <EvidenceDetailDrawer
          evidenceId={detailEvidenceId}
          open={Boolean(detailEvidenceId)}
          onOpenChange={(open) => {
            if (!open) handleCloseDetail()
          }}
          onRecordCustody={handleRecordCustody}
          onViewImage={(id) => {
            const index = galleryPhotos.findIndex((photo) => photo.id === id)
            if (index !== -1) {
              openWithFocusRestore(() => {
                setLightboxInitialIndex(index)
                setLightboxOpen(true)
              })
            }
          }}
        />
      )}

      {/* Record Custody Event Drawer */}
      {custodyEvidenceId && (
        <RecordCustodyEventDrawer
          evidenceId={custodyEvidenceId}
          open={Boolean(custodyEvidenceId)}
          onOpenChange={(open) => {
            if (!open) handleCloseCustody()
          }}
        />
      )}

      {/* Lightbox Viewer */}
      {lightboxOpen && galleryPhotos.length > 0 && (
        <EvidenceLightbox
          photos={galleryPhotos}
          initialIndex={lightboxInitialIndex}
          open={lightboxOpen}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  )
}
export default EvidenceTab
