'use client'

import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'

import { updateCourtCaseSchema, type UpdateCourtCaseValues } from '../schemas/court-case.schema'
import {
  CourtCaseStatus,
  CourtCaseOutcome,
  HearingType,
  type CourtCase,
} from '../types/legal.types'
import { useUpdateCourtCase } from '../hooks/useUpdateCourtCase'

interface UpdateCourtCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courtCase: CourtCase
  caseId: string
}

const MAX_HEARINGS = 20

export function UpdateCourtCaseDrawer({
  open,
  onOpenChange,
  courtCase,
  caseId,
}: UpdateCourtCaseDrawerProps) {
  const t = useTranslations('legal')

  const updateMutation = useUpdateCourtCase(courtCase.id, caseId)

  const form = useForm<UpdateCourtCaseValues>({
    resolver: zodResolver(updateCourtCaseSchema) as any,
    defaultValues: {
      court: courtCase.court,
      status: courtCase.status,
      outcome: courtCase.outcome ?? null,
      presidingJudge: courtCase.presidingJudge ?? '',
      prosecutor: courtCase.prosecutor ?? '',
      defenceCounsel: courtCase.defenceCounsel ?? '',
      hearingDates: courtCase.hearingDates.map((hearing) => ({
        date: hearing.date,
        type: hearing.type,
        location: hearing.location,
        notes: hearing.notes ?? '',
      })),
      notes: courtCase.notes ?? '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'hearingDates',
  })

  useEffect(() => {
    if (open) {
      form.reset({
        court: courtCase.court,
        status: courtCase.status,
        outcome: courtCase.outcome ?? null,
        presidingJudge: courtCase.presidingJudge ?? '',
        prosecutor: courtCase.prosecutor ?? '',
        defenceCounsel: courtCase.defenceCounsel ?? '',
        hearingDates: courtCase.hearingDates.map((hearing) => ({
          date: hearing.date,
          type: hearing.type,
          location: hearing.location,
          notes: hearing.notes ?? '',
        })),
        notes: courtCase.notes ?? '',
      })
    }
  }, [courtCase, form, open])

  const onSubmit = async (values: UpdateCourtCaseValues) => {
    await updateMutation.mutateAsync(values)
    onOpenChange(false)
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('courtCase.update.drawerTitle')}
      description={t('courtCase.update.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('courtCase.update.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            {t('courtCase.update.submitButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormSection title={t('courtCase.create.section1Title')}>
          <FormField
            label={t('courtCase.update.courtLabel')}
            error={form.formState.errors.court?.message}
          >
            <Input {...form.register('court')} />
          </FormField>

          <FormField
            label={t('courtCase.update.statusLabel')}
            error={form.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('courtCase.update.statusLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CourtCaseStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`courtCase.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            label={t('courtCase.update.outcomeLabel')}
            helperText={t('courtCase.update.outcomeHint')}
            error={form.formState.errors.outcome?.message}
          >
            <Controller
              name="outcome"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(value) => field.onChange(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('courtCase.update.outcomeLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CourtCaseOutcome).map((outcome) => (
                      <SelectItem key={outcome} value={outcome}>
                        {t(`courtCase.outcome.${outcome}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </FormSection>

        <FormSection title={t('courtCase.create.section2Title')}>
          <FormField
            label={t('courtCase.update.presidingJudgeLabel')}
            error={form.formState.errors.presidingJudge?.message}
          >
            <Input {...form.register('presidingJudge')} />
          </FormField>

          <FormField
            label={t('courtCase.update.prosecutorLabel')}
            error={form.formState.errors.prosecutor?.message}
          >
            <Input {...form.register('prosecutor')} />
          </FormField>

          <FormField
            label={t('courtCase.update.defenceCounselLabel')}
            error={form.formState.errors.defenceCounsel?.message}
          >
            <Input {...form.register('defenceCounsel')} />
          </FormField>
        </FormSection>

        <FormSection title={t('courtCase.update.hearingsSectionTitle')}>
          <div className="md:col-span-2 space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  date: '',
                  type: HearingType.PRELIMINARY,
                  location: '',
                  notes: '',
                })
              }
              disabled={fields.length >= MAX_HEARINGS}
            >
              <Plus className="mr-2 size-4" />
              {t('courtCase.update.addHearingButton')}
            </Button>

            {fields.map((field, index) => {
              const hearingError = form.formState.errors.hearingDates?.[index]
              return (
                <div
                  key={field.id}
                  className="rounded-md border border-border bg-card p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {t('courtCase.create.hearingTypeLabel')} #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="mr-2 size-3" />
                      {t('courtCase.create.removeHearingButton')}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label={t('courtCase.create.hearingDateLabel')}
                      required
                      error={hearingError?.date?.message as string | undefined}
                    >
                      <Controller
                        name={`hearingDates.${index}.date`}
                        control={form.control}
                        render={({ field: dateField }) => (
                          <DatePicker
                            value={dateField.value ? new Date(dateField.value) : undefined}
                            onChange={(date) =>
                              dateField.onChange(date ? date.toISOString().slice(0, 10) : '')
                            }
                            placeholder={t('courtCase.create.hearingDateLabel')}
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t('courtCase.create.hearingTypeLabel')}
                      required
                      error={hearingError?.type?.message as string | undefined}
                    >
                      <Controller
                        name={`hearingDates.${index}.type`}
                        control={form.control}
                        render={({ field: typeField }) => (
                          <Select
                            value={typeField.value ?? ''}
                            onValueChange={typeField.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('courtCase.create.hearingTypeLabel')} />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(HearingType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {t(`courtCase.hearingType.${type}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t('courtCase.create.hearingLocationLabel')}
                      required
                      error={hearingError?.location?.message as string | undefined}
                    >
                      <Input
                        {...form.register(`hearingDates.${index}.location` as const)}
                        placeholder={t('courtCase.create.hearingLocationPlaceholder')}
                      />
                    </FormField>

                    <FormField
                      label={t('courtCase.create.hearingNotesLabel')}
                      error={hearingError?.notes?.message as string | undefined}
                    >
                      <Input {...form.register(`hearingDates.${index}.notes` as const)} />
                    </FormField>
                  </div>
                </div>
              )
            })}
          </div>
        </FormSection>

        <FormSection title={t('courtCase.update.notesLabel')}>
          <div className="md:col-span-2">
            <FormField
              label={t('courtCase.update.notesLabel')}
              error={form.formState.errors.notes?.message}
            >
              <Textarea rows={4} {...form.register('notes')} />
            </FormField>
          </div>
        </FormSection>
      </form>
    </SlideOverDrawer>
  )
}
