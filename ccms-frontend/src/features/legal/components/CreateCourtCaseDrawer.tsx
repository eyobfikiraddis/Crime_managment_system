'use client'

import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'

import { createCourtCaseSchema, type CreateCourtCaseValues } from '../schemas/court-case.schema'
import { HearingType } from '../types/legal.types'
import { useCreateCourtCase } from '../hooks/useCreateCourtCase'

interface CreateCourtCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
}

const MAX_HEARINGS = 20

export function CreateCourtCaseDrawer({
  open,
  onOpenChange,
  caseId,
}: CreateCourtCaseDrawerProps) {
  const t = useTranslations('legal')
  const [discardOpen, setDiscardOpen] = useState(false)

  const createMutation = useCreateCourtCase(caseId)

  const form = useForm<CreateCourtCaseValues>({
    resolver: zodResolver(createCourtCaseSchema) as any,
    defaultValues: {
      court: '',
      filedAt: '',
      presidingJudge: '',
      prosecutor: '',
      defenceCounsel: '',
      hearingDates: [],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'hearingDates',
  })

  useEffect(() => {
    if (open) {
      form.reset({
        court: '',
        filedAt: '',
        presidingJudge: '',
        prosecutor: '',
        defenceCounsel: '',
        hearingDates: [],
        notes: '',
      })
    }
  }, [form, open])

  const handleCloseRequest = () => {
    if (form.formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const onSubmit = async (values: CreateCourtCaseValues) => {
    await createMutation.mutateAsync(values)
    onOpenChange(false)
    form.reset()
  }

  return (
    <>
      <SlideOverDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCloseRequest()
            return
          }
          onOpenChange(true)
        }}
        title={t('courtCase.create.drawerTitle')}
        description={t('courtCase.create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('courtCase.create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {t('courtCase.create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('courtCase.create.section1Title')}>
            <FormField
              label={t('courtCase.create.courtLabel')}
              required
              error={form.formState.errors.court?.message}
            >
              <Input
                {...form.register('court')}
                placeholder={t('courtCase.create.courtPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('courtCase.create.filedAtLabel')}
              required
              error={form.formState.errors.filedAt?.message}
            >
              <Controller
                name="filedAt"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? date.toISOString().slice(0, 10) : '')
                    }
                    placeholder={t('courtCase.create.filedAtLabel')}
                  />
                )}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('courtCase.create.section2Title')}>
            <FormField
              label={t('courtCase.create.presidingJudgeLabel')}
              error={form.formState.errors.presidingJudge?.message}
            >
              <Input
                {...form.register('presidingJudge')}
                placeholder={t('courtCase.create.presidingJudgePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('courtCase.create.prosecutorLabel')}
              error={form.formState.errors.prosecutor?.message}
            >
              <Input
                {...form.register('prosecutor')}
                placeholder={t('courtCase.create.prosecutorPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('courtCase.create.defenceCounselLabel')}
              error={form.formState.errors.defenceCounsel?.message}
            >
              <Input
                {...form.register('defenceCounsel')}
                placeholder={t('courtCase.create.defenceCounselPlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('courtCase.create.section3Title')}>
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
                {t('courtCase.create.addHearingButton')}
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
                        <Input
                          {...form.register(`hearingDates.${index}.notes` as const)}
                        />
                      </FormField>
                    </div>
                  </div>
                )
              })}
            </div>
          </FormSection>

          <FormSection title={t('courtCase.create.section4Title')}>
            <div className="md:col-span-2">
              <FormField
                label={t('courtCase.create.notesLabel')}
                error={form.formState.errors.notes?.message}
              >
                <Textarea
                  rows={4}
                  {...form.register('notes')}
                  placeholder={t('courtCase.create.notesPlaceholder')}
                />
              </FormField>
            </div>
          </FormSection>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title={t('courtCase.create.discardTitle')}
          description={t('courtCase.create.discardDescription')}
          confirmLabel={t('courtCase.create.discardConfirm')}
          cancelLabel={t('courtCase.create.discardCancel')}
          onConfirm={() => {
            setDiscardOpen(false)
            form.reset()
            onOpenChange(false)
          }}
        />
      ) : null}
    </>
  )
}
