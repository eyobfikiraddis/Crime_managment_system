'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { useOfficersSearch } from '@/features/cases/hooks/useOfficersSearch'
import { getCasePersons } from '@/services/domain/cases.service'
import { caseKeys } from '@/services/query/keys/caseKeys'
import { cn } from '@/lib/utils'

import {
  createInterrogationSchema,
  type CreateInterrogationValues,
} from '../schemas/create-interrogation.schema'
import { useCreateInterrogation } from '../hooks/useCreateInterrogation'
import type { RoleOnCase } from '../types/interrogation.types'

interface CreateInterrogationDrawerProps {
  caseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInterrogationDrawer({
  caseId,
  open,
  onOpenChange,
}: CreateInterrogationDrawerProps) {
  const t = useTranslations('interrogations')
  const [personSearch, setPersonSearch] = useState('')
  const [officerSearch, setOfficerSearch] = useState('')

  const interrogationMutation = useCreateInterrogation(caseId)
  const { data: officerResults, isLoading: isOfficerLoading } = useOfficersSearch(officerSearch)

  const { data: persons, isLoading: isPersonsLoading } = useQuery({
    queryKey: [...caseKeys.detail(caseId), 'persons', { search: personSearch }],
    queryFn: () => getCasePersons(caseId, { search: personSearch }),
    enabled: Boolean(caseId),
    staleTime: 2 * 60 * 1000,
  })

  const form = useForm<CreateInterrogationValues>({
    resolver: zodResolver(createInterrogationSchema),
    defaultValues: {
      subjectId: '',
      conductingOfficerId: '',
      interrogationDate: '',
      location: '',
      durationMinutes: null,
      legalRepresentativePresent: false,
      legalRepresentativeName: '',
      summary: '',
      recordingReference: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        subjectId: '',
        conductingOfficerId: '',
        interrogationDate: '',
        location: '',
        durationMinutes: null,
        legalRepresentativePresent: false,
        legalRepresentativeName: '',
        summary: '',
        recordingReference: '',
      })
    }
  }, [form, open])

  const legalRepPresent = useWatch({
    control: form.control,
    name: 'legalRepresentativePresent',
  })

  useEffect(() => {
    if (!legalRepPresent) {
      form.setValue('legalRepresentativeName', '')
    }
  }, [form, legalRepPresent])

  const summaryValue = useWatch({
    control: form.control,
    name: 'summary',
  })

  const personOptions = useMemo(() => {
    return (
      persons?.map((person) => {
        const role = person.roleOnCase as RoleOnCase | undefined
        const roleLabel = role ? ` — ${t(`roleOnCase.${role}`)}` : ''
        return {
          value: person.id,
          label: `${person.firstName} ${person.lastName}${roleLabel}`,
        }
      }) ?? []
    )
  }, [persons, t])

  const officerOptions = useMemo(() => {
    return (
      officerResults?.map((officer) => ({
        value: officer.id,
        label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`,
      })) ?? []
    )
  }, [officerResults])

  const onSubmit = async (values: CreateInterrogationValues) => {
    await interrogationMutation.mutateAsync({
      ...values,
      durationMinutes: values.durationMinutes ?? null,
      legalRepresentativeName: values.legalRepresentativePresent
        ? values.legalRepresentativeName
        : undefined,
    })
    onOpenChange(false)
    form.reset()
  }

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.drawerTitle')}
      description={t('create.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('create.cancelButton')}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={interrogationMutation.isPending}
          >
            {t('create.submitButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormSection title={t('create.section1Title')}>
          <FormField
            label={t('create.subjectLabel')}
            required
            error={form.formState.errors.subjectId?.message}
          >
            <Controller
              name="subjectId"
              control={form.control}
              render={({ field }) => (
                <SearchableSelect
                  options={personOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onSearch={setPersonSearch}
                  isLoading={isPersonsLoading}
                  placeholder={t('create.subjectPlaceholder')}
                />
              )}
            />
          </FormField>

          <FormField
            label={t('create.conductingOfficerLabel')}
            required
            error={form.formState.errors.conductingOfficerId?.message}
          >
            <Controller
              name="conductingOfficerId"
              control={form.control}
              render={({ field }) => (
                <SearchableSelect
                  options={officerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onSearch={setOfficerSearch}
                  isLoading={isOfficerLoading}
                  placeholder={t('create.conductingOfficerPlaceholder')}
                />
              )}
            />
          </FormField>

          <FormField
            label={t('create.interrogationDateLabel')}
            required
            error={form.formState.errors.interrogationDate?.message}
          >
            <Input type="datetime-local" {...form.register('interrogationDate')} />
          </FormField>

          <FormField
            label={t('create.locationLabel')}
            required
            error={form.formState.errors.location?.message}
          >
            <Input {...form.register('location')} placeholder={t('create.locationPlaceholder')} />
          </FormField>

          <FormField
            label={t('create.durationLabel')}
            error={form.formState.errors.durationMinutes?.message}
          >
            <Input
              type="number"
              min="1"
              max="1440"
              step="1"
              {...form.register('durationMinutes', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
              placeholder={t('create.durationPlaceholder')}
            />
          </FormField>
        </FormSection>

        <FormSection title={t('create.section2Title')}>
          <FormField label={t('create.legalRepresentativePresentLabel')}>
            <Controller
              name="legalRepresentativePresent"
              control={form.control}
              render={({ field }) => (
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </FormField>

          <div
            className={cn(
              'overflow-hidden transition-[max-height] duration-150 ease-out md:col-span-2',
              legalRepPresent ? 'max-h-40' : 'max-h-0',
            )}
          >
            <FormField
              label={t('create.legalRepresentativeNameLabel')}
              error={form.formState.errors.legalRepresentativeName?.message}
            >
              <Input
                {...form.register('legalRepresentativeName')}
                placeholder={t('create.legalRepresentativeNamePlaceholder')}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title={t('create.section3Title')}>
          <div className="md:col-span-2 space-y-1">
            <FormField
              label={t('create.summaryLabel')}
              required
              error={form.formState.errors.summary?.message}
            >
              <Textarea
                {...form.register('summary')}
                placeholder={t('create.summaryPlaceholder')}
                className="min-h-[160px]"
              />
            </FormField>
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="size-3" />
                {t('create.summaryHint')}
              </span>
              <span>{`${summaryValue?.length ?? 0} / 5000`}</span>
            </div>
          </div>

          <FormField
            label={t('create.recordingReferenceLabel')}
            error={form.formState.errors.recordingReference?.message}
          >
            <Input
              {...form.register('recordingReference')}
              placeholder={t('create.recordingReferencePlaceholder')}
            />
          </FormField>
        </FormSection>
      </form>
    </SlideOverDrawer>
  )
}
