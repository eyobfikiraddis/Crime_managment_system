'use client'

import { useEffect, useState, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { FormSection } from '@/shared/components/forms/FormSection'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'

import { createOfficerSchema, type CreateOfficerValues } from '@features/personnel/schemas/officer.schema'
import { OfficerRole, CreateOfficerPayload } from '@features/personnel/types/personnel.types'
import { useCreateOfficer } from '@features/personnel/hooks/useCreateOfficer'
import { getDepartments } from '@services/domain/departments.service'
import { useAuthStore } from '@shared/stores/auth.store'

interface CreateOfficerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const OFFICER_ROLES: OfficerRole[] = ['INVESTIGATOR', 'FORENSIC', 'LEGAL_OFFICER', 'DEPT_HEAD', 'ADMIN', 'SUPERADMIN']

export function CreateOfficerDrawer({ open, onOpenChange }: CreateOfficerDrawerProps) {
  const t = useTranslations('personnel')
  const [discardOpen, setDiscardOpen] = useState(false)

  const currentUserRole = useAuthStore((state) => state.role)
  const createOfficerMutation = useCreateOfficer()

  const { data: departments, isLoading: isDeptLoading } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: getDepartments,
    enabled: open,
    staleTime: 10 * 60 * 1000,
  })

  const departmentOptions = useMemo(() => {
    return (
      departments?.map((dept) => ({
        value: dept.id,
        label: dept.name,
      })) ?? []
    )
  }, [departments])

  const form = useForm<CreateOfficerValues>({
    resolver: zodResolver(createOfficerSchema),
    defaultValues: {
      badgeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      role: undefined as any,
      departmentId: '',
      phone: '',
    },
  })

  const { formState, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        badgeNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        role: undefined as any,
        departmentId: '',
        phone: '',
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

  const onSubmit = async (values: CreateOfficerValues) => {
    try {
      const payload: CreateOfficerPayload = {
        badgeNumber: values.badgeNumber,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        departmentId: values.departmentId,
      }
      if (values.phone) {
        payload.phone = values.phone
      }
      await createOfficerMutation.mutateAsync(payload)
      onOpenChange(false)
      reset()
    } catch (err) {
      // Handled by hook
    }
  }

  const filteredRoles = useMemo(() => {
    return OFFICER_ROLES.filter((role) => role !== 'SUPERADMIN' || currentUserRole === 'SUPERADMIN')
  }, [currentUserRole])

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
        title={t('officers.create.drawerTitle')}
        description={t('officers.create.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 w-full">
            <Button type="button" variant="outline" onClick={handleCloseRequest}>
              {t('officers.create.cancelButton')}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createOfficerMutation.isPending}
            >
              {t('officers.create.submitButton')}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <FormSection title={t('officers.create.section1Title')}>
            <FormField
              label={t('officers.create.badgeNumberLabel')}
              required
              helperText={t('officers.create.badgeNumberHint')}
              error={formState.errors.badgeNumber?.message}
            >
              <Input
                {...form.register('badgeNumber')}
                placeholder={t('officers.create.badgeNumberPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('officers.create.firstNameLabel')}
              required
              error={formState.errors.firstName?.message}
            >
              <Input
                {...form.register('firstName')}
                placeholder={t('officers.create.firstNamePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('officers.create.lastNameLabel')}
              required
              error={formState.errors.lastName?.message}
            >
              <Input
                {...form.register('lastName')}
                placeholder={t('officers.create.lastNamePlaceholder')}
              />
            </FormField>

            <FormField
              label={t('officers.create.phoneLabel')}
              error={formState.errors.phone?.message}
            >
              <Input
                {...form.register('phone')}
                placeholder={t('officers.create.phonePlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('officers.create.section2Title')}>
            <FormField
              label={t('officers.create.emailLabel')}
              required
              error={formState.errors.email?.message}
            >
              <Input
                type="email"
                {...form.register('email')}
                placeholder={t('officers.create.emailPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('officers.create.roleLabel')}
              required
              error={formState.errors.role?.message}
            >
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('officers.create.roleLabel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`officers.officerRole.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label={t('officers.create.departmentLabel')}
              required
              error={formState.errors.departmentId?.message}
            >
              <Controller
                name="departmentId"
                control={form.control}
                render={({ field }) => (
                  <SearchableSelect
                    options={departmentOptions}
                    value={field.value}
                    onChange={field.onChange}
                    isLoading={isDeptLoading}
                    placeholder={t('officers.create.departmentPlaceholder')}
                  />
                )}
              />
            </FormField>
          </FormSection>
        </form>
      </SlideOverDrawer>

      {discardOpen ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard officer record?"
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

export default CreateOfficerDrawer
