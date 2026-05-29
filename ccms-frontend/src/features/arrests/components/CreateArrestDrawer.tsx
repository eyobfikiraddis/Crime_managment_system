'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { FieldError } from '@/shared/components/forms/FieldError'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { useOfficersSearch } from '@/features/cases/hooks/useOfficersSearch'
import { getCasePersons } from '@/services/domain/cases.service'
import { caseKeys } from '@/services/query/keys/caseKeys'
import { cn } from '@/lib/utils'

import { createArrestSchema, type CreateArrestValues } from '../schemas/create-arrest.schema'
import { BailStatus, type PersonRef } from '../types/arrest.types'
import { useCreateArrest } from '../hooks/useCreateArrest'

interface CreateArrestDrawerProps {
  caseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_CHARGES = 20
const BAIL_STATUSES_WITH_AMOUNT: BailStatus[] = [BailStatus.GRANTED, BailStatus.POSTED]

export function CreateArrestDrawer({ caseId, open, onOpenChange }: CreateArrestDrawerProps) {
  const t = useTranslations('arrests')
  const [suspectSearch, setSuspectSearch] = useState('')
  const [officerSearch, setOfficerSearch] = useState('')
  const [chargeInput, setChargeInput] = useState('')
  const [charges, setCharges] = useState<string[]>([])
  const [discardOpen, setDiscardOpen] = useState(false)

  const arrestMutation = useCreateArrest(caseId)
  const { data: officerResults, isLoading: isOfficerLoading } = useOfficersSearch(officerSearch)

  const { data: suspects, isLoading: isSuspectsLoading } = useQuery({
    queryKey: [...caseKeys.detail(caseId), 'persons', { role: 'SUSPECT', search: suspectSearch }],
    queryFn: () => getCasePersons(caseId, { role: 'SUSPECT', search: suspectSearch }),
    enabled: Boolean(caseId),
    staleTime: 2 * 60 * 1000,
  })

  const form = useForm<CreateArrestValues>({
    resolver: zodResolver(createArrestSchema),
    defaultValues: {
      arrestedPersonId: '',
      arrestingOfficerId: '',
      arrestDate: '',
      location: '',
      warrantNumber: '',
      chargesAtArrest: [],
      bailStatus: BailStatus.NOT_SET,
      bailAmount: null,
      notes: '',
    },
  })

  const selectedBailStatus = useWatch({
    control: form.control,
    name: 'bailStatus',
  })
  const showBailAmount = BAIL_STATUSES_WITH_AMOUNT.includes(selectedBailStatus as BailStatus)

  useEffect(() => {
    if (!showBailAmount) {
      form.setValue('bailAmount', null)
    }
  }, [form, showBailAmount])

  useEffect(() => {
    form.setValue('chargesAtArrest', charges, { shouldValidate: true })
  }, [charges, form])

  useEffect(() => {
    if (open) {
      form.reset({
        arrestedPersonId: '',
        arrestingOfficerId: '',
        arrestDate: '',
        location: '',
        warrantNumber: '',
        chargesAtArrest: [],
        bailStatus: BailStatus.NOT_SET,
        bailAmount: null,
        notes: '',
      })
      setCharges([])
      setChargeInput('')
    }
  }, [form, open])

  const suspectOptions = useMemo(() => {
    return (
      suspects?.map((person: PersonRef) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName}`,
      })) ?? []
    )
  }, [suspects])

  const officerOptions = useMemo(() => {
    return (
      officerResults?.map((officer) => ({
        value: officer.id,
        label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`,
      })) ?? []
    )
  }, [officerResults])

  const chargesInputId = useId()

  const addCharge = (raw: string) => {
    const charge = raw.trim()
    if (!charge || charges.length >= MAX_CHARGES) return
    setCharges((prev) => [...prev, charge])
    setChargeInput('')
  }

  const removeCharge = (index: number) => {
    setCharges((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleChargeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      addCharge(chargeInput)
      return
    }

    if (event.key === 'Backspace' && chargeInput.length === 0 && charges.length > 0) {
      setCharges((prev) => prev.slice(0, -1))
    }
  }

  const handleCloseRequest = () => {
    if (form.formState.isDirty || charges.length > 0) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const onSubmit = async (values: CreateArrestValues) => {
    await arrestMutation.mutateAsync({
      ...values,
      chargesAtArrest: charges,
      bailAmount: values.bailAmount ?? null,
    })
    onOpenChange(false)
    form.reset()
    setCharges([])
    setChargeInput('')
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
        title={t('create.drawerTitle')}
        description={t('create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={arrestMutation.isPending}
            >
              {t('create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('create.section1Title')}>
            <FormField
              label={t('create.arrestedPersonLabel')}
              required
              helperText={t('create.arrestedPersonHint')}
              error={form.formState.errors.arrestedPersonId?.message}
            >
              <Controller
                name="arrestedPersonId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={suspectOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onSearch={setSuspectSearch}
                    isLoading={isSuspectsLoading}
                    placeholder={t('create.arrestedPersonPlaceholder')}
                    emptyMessage={t('create.arrestedPersonEmpty')}
                  />
                )}
              />
            </FormField>

            <FormField
              label={t('create.arrestingOfficerLabel')}
              required
              error={form.formState.errors.arrestingOfficerId?.message}
            >
              <Controller
                name="arrestingOfficerId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={officerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onSearch={setOfficerSearch}
                    isLoading={isOfficerLoading}
                    placeholder={t('create.arrestingOfficerPlaceholder')}
                  />
                )}
              />
            </FormField>

            <FormField
              label={t('create.arrestDateLabel')}
              required
              error={form.formState.errors.arrestDate?.message}
            >
              <Input type="datetime-local" {...form.register('arrestDate')} />
            </FormField>

            <FormField
              label={t('create.locationLabel')}
              required
              error={form.formState.errors.location?.message}
            >
              <Input
                {...form.register('location')}
                placeholder={t('create.locationPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('create.warrantNumberLabel')}
              error={form.formState.errors.warrantNumber?.message}
            >
              <Input
                {...form.register('warrantNumber')}
                placeholder={t('create.warrantNumberPlaceholder')}
              />
            </FormField>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor={chargesInputId} className="text-sm font-medium">
                {t('create.chargesAtArrestLabel')}
                <span className="text-destructive"> *</span>
              </label>
              <div className="rounded-md border border-border p-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {charges.map((charge, index) => (
                    <span
                      key={`${charge}-${index}`}
                      className="flex items-center gap-1 rounded-sm border border-border bg-[var(--color-card-hover)] px-2 py-0.5 text-xs"
                    >
                      {charge}
                      <button
                        type="button"
                        onClick={() => removeCharge(index)}
                        className="text-foreground-muted hover:text-foreground"
                        aria-label={`Remove ${charge}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id={chargesInputId}
                    value={chargeInput}
                    onChange={(event) => setChargeInput(event.target.value)}
                    onKeyDown={handleChargeKeyDown}
                    placeholder={t('create.chargesAtArrestPlaceholder')}
                    disabled={charges.length >= MAX_CHARGES}
                    className="min-w-[160px] flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                {charges.length >= MAX_CHARGES ? (
                  <p className="text-xs text-foreground-muted">Maximum charges reached.</p>
                ) : null}
              </div>
              <p className="text-xs text-foreground-muted">{t('create.chargesAtArrestHint')}</p>
              <FieldError message={form.formState.errors.chargesAtArrest?.message ?? ''} />
            </div>

            <FormField
              label={t('create.notesLabel')}
              error={form.formState.errors.notes?.message}
            >
              <Textarea
                rows={4}
                {...form.register('notes')}
                placeholder={t('create.notesPlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('create.section2Title')}>
            <FormField
              label={t('create.bailStatusLabel')}
              error={form.formState.errors.bailStatus?.message}
            >
              <Controller
                name="bailStatus"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('create.bailStatusLabel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BailStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`bailStatus.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <div
              className={cn(
                'overflow-hidden transition-[max-height] duration-150 ease-out',
                showBailAmount ? 'max-h-40' : 'max-h-0',
              )}
            >
              <FormField
                label={t('create.bailAmountLabel')}
                error={form.formState.errors.bailAmount?.message}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register('bailAmount', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                  placeholder={t('create.bailAmountPlaceholder')}
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
          title={t('create.discardTitle')}
          description={t('create.discardDescription')}
          confirmLabel={t('create.discardConfirm')}
          cancelLabel={t('create.discardCancel')}
          onConfirm={() => {
            setDiscardOpen(false)
            form.reset()
            setCharges([])
            setChargeInput('')
            onOpenChange(false)
          }}
        />
      ) : null}
    </>
  )
}
