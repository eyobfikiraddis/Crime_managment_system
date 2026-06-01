'use client'

import { useTranslations } from 'next-intl'
import { Search, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@shared/components/forms/DatePicker'
import { parseISO, format, isValid } from 'date-fns'
import {
  AuditEventCategory,
  AuditEventType,
  EVENT_TYPE_CATEGORY,
} from '@features/audit/types/audit.types'
import { getEventTypesByCategory } from '@features/audit/utils/auditUtils'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface AuditFilterBarProps {
  actorSearch: string
  onActorSearchChange: (value: string) => void
  selectedEventTypes: AuditEventType[]
  onEventTypesChange: (types: AuditEventType[]) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearAll: () => void
  activeFilterCount: number
}

export function AuditFilterBar({
  actorSearch,
  onActorSearchChange,
  selectedEventTypes,
  onEventTypesChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearAll,
  activeFilterCount,
}: AuditFilterBarProps) {
  const t = useTranslations('audit')

  const parsedFrom = dateFrom ? parseISO(dateFrom) : undefined
  const parsedTo = dateTo ? parseISO(dateTo) : undefined

  // Groups and checking status
  const categories = Object.values(AuditEventCategory)

  const handleCategoryToggle = (category: AuditEventCategory, checked: boolean) => {
    const types = getEventTypesByCategory(category)
    if (checked) {
      // Add all category types
      const merged = Array.from(new Set([...selectedEventTypes, ...types]))
      onEventTypesChange(merged)
    } else {
      // Remove all category types
      const filtered = selectedEventTypes.filter((t) => !types.includes(t))
      onEventTypesChange(filtered)
    }
  }

  const handleTypeToggle = (type: AuditEventType, checked: boolean) => {
    if (checked) {
      onEventTypesChange([...selectedEventTypes, type])
    } else {
      onEventTypesChange(selectedEventTypes.filter((t) => t !== type))
    }
  }

  const getCategoryCheckState = (category: AuditEventCategory): boolean | 'indeterminate' => {
    const types = getEventTypesByCategory(category)
    const selectedCount = types.filter((t) => selectedEventTypes.includes(t)).length
    if (selectedCount === 0) return false
    if (selectedCount === types.length) return true
    return 'indeterminate'
  }

  const getSelectedCountForCategory = (category: AuditEventCategory): number => {
    const types = getEventTypesByCategory(category)
    return types.filter((t) => selectedEventTypes.includes(t)).length
  }

  // Active filter chip helpers
  const chips: { id: string; label: string; onRemove: () => void }[] = []

  if (actorSearch) {
    chips.push({
      id: 'actor',
      label: `Actor: ${actorSearch}`,
      onRemove: () => onActorSearchChange(''),
    })
  }

  categories.forEach((cat) => {
    const count = getSelectedCountForCategory(cat)
    if (count > 0) {
      chips.push({
        id: `cat-${cat}`,
        label: `Type: ${t(`filter.categories.${cat}`)} (${count})`,
        onRemove: () => handleCategoryToggle(cat, false),
      })
    }
  })

  if (dateFrom) {
    chips.push({
      id: 'dateFrom',
      label: `After: ${dateFrom}`,
      onRemove: () => onDateFromChange(''),
    })
  }

  if (dateTo) {
    chips.push({
      id: 'dateTo',
      label: `Before: ${dateTo}`,
      onRemove: () => onDateToChange(''),
    })
  }

  return (
    <div className="space-y-4 print:hidden" data-filter-bar="">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[240px] space-y-1">
          <span className="text-xs font-semibold text-foreground-muted block">
            {t('filter.label')}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
            <Input
              value={actorSearch}
              onChange={(e) => onActorSearchChange(e.target.value)}
              placeholder={t('filter.actorSearch')}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Event Type Popover Select */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-foreground-muted block">
            {t('filter.eventType')}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-1.5 px-3">
                <span>
                  {selectedEventTypes.length > 0
                    ? `${t('filter.eventType')} (${selectedEventTypes.length})`
                    : t('filter.eventType')}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2.5 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-3.5">
                {categories.map((cat) => {
                  const checkState = getCategoryCheckState(cat)
                  const countTotal = getEventTypesByCategory(cat).length

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={checkState}
                          onCheckedChange={(checked) =>
                            handleCategoryToggle(cat, checked === true)
                          }
                          id={`cat-${cat}-check`}
                        />
                        <label
                          htmlFor={`cat-${cat}-check`}
                          className="text-xs font-bold text-foreground cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{t(`filter.categories.${cat}`)}</span>
                          <span className="text-foreground-muted font-normal">
                            ({countTotal})
                          </span>
                        </label>
                      </div>

                      {/* Sub Items */}
                      <div className="pl-6 space-y-1 border-l border-border ml-2.5">
                        {getEventTypesByCategory(cat).map((type) => (
                          <div key={type} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedEventTypes.includes(type)}
                              onCheckedChange={(checked) =>
                                handleTypeToggle(type, checked === true)
                              }
                              id={`type-${type}-check`}
                            />
                            <label
                              htmlFor={`type-${type}-check`}
                              className="text-xs text-foreground cursor-pointer flex-1"
                            >
                              {t(`eventType.${type}`)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date From */}
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold text-foreground-muted block">
            {t('filter.dateFrom')}
          </span>
          <DatePicker
            value={parsedFrom && isValid(parsedFrom) ? parsedFrom : undefined}
            onChange={(d) => onDateFromChange(d ? format(d, 'yyyy-MM-dd') : '')}
            placeholder={t('filter.dateFrom')}
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold text-foreground-muted block">
            {t('filter.dateTo')}
          </span>
          <DatePicker
            value={parsedTo && isValid(parsedTo) ? parsedTo : undefined}
            onChange={(d) => onDateToChange(d ? format(d, 'yyyy-MM-dd') : '')}
            placeholder={t('filter.dateTo')}
          />
        </div>

        {/* Refresh / Clear Button */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-9">
            <X className="mr-1.5 h-3.5 w-3.5" />
            {t('filter.clearAll')}
          </Button>
        )}
      </div>

      {/* Chips list */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 items-center">
          <span className="text-[10px] text-foreground-muted">
            {t('filter.activeFiltersLabel', { count: activeFilterCount })}:
          </span>
          {chips.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[11px] font-semibold text-foreground border border-border"
            >
              <span>{c.label}</span>
              <button
                type="button"
                onClick={c.onRemove}
                className="text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
