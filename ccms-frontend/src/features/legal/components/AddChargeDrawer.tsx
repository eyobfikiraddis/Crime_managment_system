'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { FormField } from '@/shared/components/forms/FormField'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { getCasePersons } from '@/services/domain/cases.service'
import { getCrimeTypes } from '@/services/domain/admin.service'
import { caseKeys } from '@/services/query/keys/caseKeys'

import { createChargeSchema, type CreateChargeValues } from '../schemas/charge.schema'
import { useCreateCharge } from '../hooks/useCreateCharge'

interface AddChargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courtCaseId: string
  caseId: string
}

export function AddChargeDrawer({
  open,
  onOpenChange,
  courtCaseId,
  caseId,
}: AddChargeDrawerProps) {
  const t = useTranslations('legal')
  const [suspectSearch, setSuspectSearch] = useState('')
  const [crimeTypeSearch, setCrimeTypeSearch] = useState('')

  const createMutation = useCreateCharge(courtCaseId, caseId)

  const { data: suspects, isLoading: isSuspectLoading } = useQuery({
    queryKey: [...caseKeys.detail(caseId), 'persons', { role: 'SUSPECT', search: suspectSearch }],
    queryFn: () => getCasePersons(caseId, { role: 'SUSPECT', search: suspectSearch }),
    enabled: Boolean(caseId),
    staleTime: 2 * 60 * 1000,
  })

  const { data: crimeTypes, isLoading: isCrimeTypeLoading } = useQuery({
    queryKey: [...caseKeys.crimeTypes(), { search: crimeTypeSearch }],
    queryFn: () => getCrimeTypes({ search: crimeTypeSearch }),
    staleTime: 2 * 60 * 1000,
  })

  const form = useForm<CreateChargeValues>({
    resolver: zodResolver(createChargeSchema),
    defaultValues: {
      suspectId: '',
      crimeTypeId: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        suspectId: '',
        crimeTypeId: '',
        notes: '',
      })
      setSuspectSearch('')
      setCrimeTypeSearch('')
    }
  }, [form, open])

  const suspectOptions = useMemo(() => {
    return (
      suspects?.map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName}`,
      })) ?? []
    )
  }, [suspects])

  const crimeTypeOptions = useMemo(() => {
    return (
      crimeTypes?.map((crimeType) => ({
        value: crimeType.id,
        label: crimeType.name,
      })) ?? []
    )
  }, [crimeTypes])

  const noSuspectsLinked = !suspectSearch && (suspects?.length ?? 0) === 0
  const disableSubmit = noSuspectsLinked || createMutation.isPending

  const onSubmit = async (values: CreateChargeValues) => {
    await createMutation.mutateAsync(values)
    onOpenChange(false)
    form.reset()
  }

  const submitButton = (
    <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={disableSubmit}>
      {t('charges.create.submitButton')}
    </Button>
  )

  return (
    <SlideOverDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('charges.create.drawerTitle')}
      description={t('charges.create.drawerDescription')}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('charges.create.cancelButton')}
          </Button>
          {noSuspectsLinked ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{submitButton}</span>
                </TooltipTrigger>
                <TooltipContent>{t('charges.create.suspectEmpty')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            submitButton
          )}
        </div>
      }
    >
      <form className="space-y-4">
        <FormField
          label={t('charges.create.suspectLabel')}
          required
          helperText={t('charges.create.suspectHint')}
          error={form.formState.errors.suspectId?.message}
        >
          <Controller
            name="suspectId"
            control={form.control}
            render={({ field }) => (
              <SearchableSelect
                options={suspectOptions}
                value={field.value}
                onChange={field.onChange}
                onSearch={setSuspectSearch}
                isLoading={isSuspectLoading}
                placeholder={t('charges.create.suspectPlaceholder')}
                emptyMessage={
                  noSuspectsLinked
                    ? t('charges.create.suspectEmpty')
                    : undefined
                }
              />
            )}
          />
        </FormField>

        <FormField
          label={t('charges.create.crimeTypeLabel')}
          required
          error={form.formState.errors.crimeTypeId?.message}
        >
          <Controller
            name="crimeTypeId"
            control={form.control}
            render={({ field }) => (
              <SearchableSelect
                options={crimeTypeOptions}
                value={field.value}
                onChange={field.onChange}
                onSearch={setCrimeTypeSearch}
                isLoading={isCrimeTypeLoading}
                placeholder={t('charges.create.crimeTypePlaceholder')}
              />
            )}
          />
        </FormField>

        <FormField
          label={t('charges.create.notesLabel')}
          error={form.formState.errors.notes?.message}
        >
          <Textarea
            rows={4}
            {...form.register('notes')}
            placeholder={t('charges.create.notesPlaceholder')}
          />
        </FormField>
      </form>
    </SlideOverDrawer>
  )
}
