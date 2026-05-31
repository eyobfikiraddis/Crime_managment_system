'use client'

import { useEffect, useState, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'

import { createDepartmentSchema, type CreateDepartmentValues } from '../schemas/department.schema'
import { useCreateDepartment } from '../hooks/useCreateDepartment'
import { useLocationList } from '@/features/admin/hooks/useLocationList'

interface CreateDepartmentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDepartmentDrawer({ open, onOpenChange }: CreateDepartmentDrawerProps) {
  const t = useTranslations('departments')
  const [discardOpen, setDiscardOpen] = useState(false)

  const createMutation = useCreateDepartment()
  
  const { data: locations, isLoading: isLocLoading } = useLocationList({
    pageSize: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const locationOptions = useMemo(() => {
    return (
      locations?.data.map((loc) => ({
        value: loc.id,
        label: loc.region ? `${loc.name}, ${loc.region}` : loc.name,
      })) ?? []
    )
  }, [locations])

  const form = useForm<CreateDepartmentValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      code: '',
      locationId: '',
      description: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        code: '',
        locationId: '',
        description: '',
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

  const onSubmit = async (values: CreateDepartmentValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        code: values.code || undefined,
        locationId: values.locationId || undefined,
        description: values.description || undefined,
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
            return
          }
          onOpenChange(true)
        }}
        title={t('create.drawerTitle')}
        description={t('create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {t('create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('create.section1Title')}>
            <FormField
              label={t('create.nameLabel')}
              required
              error={formState.errors.name?.message}
            >
              <Input
                {...form.register('name')}
                placeholder={t('create.namePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('create.codeLabel')}
              helperText={t('create.codeHint')}
              error={formState.errors.code?.message}
            >
              <Input
                {...form.register('code')}
                placeholder={t('create.codePlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('create.section2Title')}>
            <FormField
              label={t('create.locationLabel')}
              error={formState.errors.locationId?.message}
            >
              <Controller
                name="locationId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={locationOptions}
                    value={field.value}
                    onChange={field.onChange}
                    isLoading={isLocLoading}
                    placeholder={t('create.locationPlaceholder')}
                  />
                )}
              />
            </FormField>

            <FormField
              label={t('create.descriptionLabel')}
              error={formState.errors.description?.message}
            >
              <Textarea
                {...form.register('description')}
                placeholder={t('create.descriptionPlaceholder')}
                rows={4}
              />
            </FormField>
          </FormSection>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard unsaved changes?"
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
