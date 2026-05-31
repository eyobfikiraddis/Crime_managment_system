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

import { createCrimeTypeSchema, type CreateCrimeTypeValues } from '../../schemas/crime-type.schema'
import { useCreateCrimeType } from '../../hooks/useCreateCrimeType'
import { CrimeSeverity } from '../../types/admin.types'

interface CreateCrimeTypeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCrimeTypeDrawer({ open, onOpenChange }: CreateCrimeTypeDrawerProps) {
  const t = useTranslations('admin')
  const [discardOpen, setDiscardOpen] = useState(false)
  const createMutation = useCreateCrimeType()

  const form = useForm<CreateCrimeTypeValues>({
    resolver: zodResolver(createCrimeTypeSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      severity: undefined,
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        code: '',
        category: '',
        severity: undefined,
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

  const onSubmit = async (values: CreateCrimeTypeValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        code: values.code,
        category: values.category || undefined,
        severity: values.severity || undefined,
      })
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by hook toast
    }
  }

  return (
    <>
      <SlideOverDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCloseRequest()
          }
        }}
        title={t('crimeTypes.create.drawerTitle')}
        description={t('crimeTypes.create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('crimeTypes.create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {t('crimeTypes.create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormField
            label={t('crimeTypes.create.nameLabel')}
            required
            error={formState.errors.name?.message}
          >
            <Input
              {...form.register('name')}
              placeholder={t('crimeTypes.create.namePlaceholder')}
            />
          </FormField>

          <FormField
            label={t('crimeTypes.create.codeLabel')}
            required
            helperText={t('crimeTypes.create.codeHint')}
            error={formState.errors.code?.message}
          >
            <Input
              {...form.register('code')}
              placeholder={t('crimeTypes.create.codePlaceholder')}
            />
          </FormField>

          <FormField
            label={t('crimeTypes.create.categoryLabel')}
            error={formState.errors.category?.message}
          >
            <Input
              {...form.register('category')}
              placeholder={t('crimeTypes.create.categoryPlaceholder')}
            />
          </FormField>

          <FormField
            label={t('crimeTypes.create.severityLabel')}
            error={formState.errors.severity?.message}
          >
            <Controller
              name="severity"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={(val) => field.onChange(val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select severity...</SelectItem>
                    <SelectItem value={CrimeSeverity.MISDEMEANOR}>{t('crimeTypes.severity.MISDEMEANOR')}</SelectItem>
                    <SelectItem value={CrimeSeverity.FELONY}>{t('crimeTypes.severity.FELONY')}</SelectItem>
                    <SelectItem value={CrimeSeverity.CAPITAL}>{t('crimeTypes.severity.CAPITAL')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard crime type record?"
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
