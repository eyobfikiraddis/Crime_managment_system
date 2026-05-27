'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { useOfficersSearch } from '@/features/cases/hooks/useOfficersSearch'
import {
  recordCustodyEventSchema,
  type RecordCustodyEventValues,
} from '../schemas/custody-event.schema'
import { CustodyEventType } from '../types/evidence.types'
import { useRecordCustodyEvent } from '../hooks/useRecordCustodyEvent'

interface RecordCustodyEventDrawerProps {
  evidenceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordCustodyEventDrawer({
  evidenceId,
  open,
  onOpenChange,
}: RecordCustodyEventDrawerProps) {
  const t = useTranslations('evidence')
  const [officerSearch, setOfficerSearch] = useState('')

  const { data: officerResults, isLoading: isOfficerLoading } = useOfficersSearch(officerSearch)
  const custodyMutation = useRecordCustodyEvent(evidenceId ?? '')

  const form = useForm<RecordCustodyEventValues>({
    resolver: zodResolver(recordCustodyEventSchema),
    defaultValues: {
      eventType: undefined as any,
      toOfficerId: '',
      location: '',
      reason: '',
      notes: '',
    },
  })

  const onSubmit = (values: RecordCustodyEventValues) => {
    if (!evidenceId) return
    custodyMutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  const officerOptions = officerResults?.map((officer) => ({
    value: officer.id,
    label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`,
  })) ?? []

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('custody.recordDrawerTitle')}
      description={t('custody.recordDrawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('upload.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={custodyMutation.isPending}
          >
            {custodyMutation.isPending ? t('upload.uploadPhase.recording') : t('custody.submitButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField
          label={t('custody.eventTypeLabel')}
          required
          error={form.formState.errors.eventType?.message}
        >
          <Controller
            name="eventType"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('custody.eventTypeLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CustodyEventType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`custody.eventTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label={t('custody.toOfficerLabel')}
          required
          error={form.formState.errors.toOfficerId?.message}
        >
          <Controller
            name="toOfficerId"
            control={form.control}
            render={({ field }) => (
              <SearchableSelect
                options={officerOptions}
                value={field.value}
                onChange={field.onChange}
                onSearch={setOfficerSearch}
                isLoading={isOfficerLoading}
                placeholder={t('custody.toOfficerPlaceholder')}
              />
            )}
          />
        </FormField>

        <FormField
          label={t('custody.locationLabel')}
          required
          error={form.formState.errors.location?.message}
        >
          <Input {...form.register('location')} placeholder={t('custody.locationPlaceholder')} />
        </FormField>

        <FormField
          label={t('custody.reasonLabel')}
          error={form.formState.errors.reason?.message}
        >
          <Textarea rows={4} {...form.register('reason')} />
        </FormField>
      </form>
    </SlideOverDrawer>
  )
}
