'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { DatePicker } from '@shared/components/forms/DatePicker'

import { createPersonSchema, type CreatePersonValues } from '@features/personnel/schemas/person.schema'
import { Gender, CreatePersonPayload } from '@features/personnel/types/personnel.types'
import { useCreatePerson } from '@features/personnel/hooks/useCreatePerson'

interface CreatePersonDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePersonDrawer({ open, onOpenChange }: CreatePersonDrawerProps) {
  const t = useTranslations('personnel')
  const [discardOpen, setDiscardOpen] = useState(false)

  const createPersonMutation = useCreatePerson()

  const form = useForm<CreatePersonValues>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: undefined,
      nationalId: '',
      dateOfBirth: '',
      phone: '',
      address: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        firstName: '',
        lastName: '',
        gender: undefined,
        nationalId: '',
        dateOfBirth: '',
        phone: '',
        address: '',
      })
    }
  }, [open, reset])

  const handleCloseRequest = () => {
    if (formState.isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const onSubmit = async (values: CreatePersonValues) => {
    try {
      const payload: CreatePersonPayload = {
        firstName: values.firstName,
        lastName: values.lastName,
      }
      if (values.gender) payload.gender = values.gender
      if (values.nationalId) payload.nationalId = values.nationalId
      if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth
      if (values.phone) payload.phone = values.phone
      if (values.address) payload.address = values.address

      await createPersonMutation.mutateAsync(payload)
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by mutation hook's error callback
    }
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
        title={t('persons.create.drawerTitle')}
        description={t('persons.create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('persons.create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createPersonMutation.isPending}
            >
              {t('persons.create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('persons.create.section1Title')}>
            <FormField
              label={t('persons.create.firstNameLabel')}
              required
              error={formState.errors.firstName?.message}
            >
              <Input
                {...form.register('firstName')}
                placeholder={t('persons.create.firstNamePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('persons.create.lastNameLabel')}
              required
              error={formState.errors.lastName?.message}
            >
              <Input
                {...form.register('lastName')}
                placeholder={t('persons.create.lastNamePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('persons.create.genderLabel')}
              error={formState.errors.gender?.message}
            >
              <Controller
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('persons.create.genderLabel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Gender).map((gen) => (
                        <SelectItem key={gen} value={gen}>
                          {t(`persons.gender.${gen}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('persons.create.section2Title')}>
            <FormField
              label={t('persons.create.nationalIdLabel')}
              helperText={t('persons.create.nationalIdHint')}
              error={formState.errors.nationalId?.message}
            >
              <Input
                {...form.register('nationalId')}
                placeholder={t('persons.create.nationalIdPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('persons.create.dateOfBirthLabel')}
              error={formState.errors.dateOfBirth?.message}
            >
              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    placeholder={t('persons.create.dateOfBirthLabel')}
                    maxDate={new Date()}
                  />
                )}
              />
            </FormField>

            <FormField
              label={t('persons.create.phoneLabel')}
              error={formState.errors.phone?.message}
            >
              <Input
                {...form.register('phone')}
                placeholder={t('persons.create.phonePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('persons.create.addressLabel')}
              error={formState.errors.address?.message}
            >
              <Input
                {...form.register('address')}
                placeholder={t('persons.create.addressPlaceholder')}
              />
            </FormField>
          </FormSection>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard person record?"
          description="Your unsaved data will be lost."
          confirmLabel="Discard"
          cancelLabel="Cancel"
          onConfirm={() => {
            setDiscardOpen(false)
            reset()
            onOpenChange(false)
          }}
        />
      ) : null}
    </>
  )
}
