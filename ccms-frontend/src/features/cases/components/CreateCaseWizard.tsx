'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, Loader2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import {
  createCaseStep1Schema,
  createCaseStep2Schema,
  createCaseStep3Schema,
  type CreateCaseStep1Values,
  type CreateCaseStep2Values,
  type CreateCaseStep3Values,
} from '../schemas/create-case.schema'
import { useCrimeTypes } from '../hooks/useCrimeTypes'
import { useLocations } from '../hooks/useLocations'
import { useDepartments } from '../hooks/useDepartments'
import { useOfficersSearch } from '../hooks/useOfficersSearch'
import { useCreateCase } from '../hooks/useCreateCase'
import type { CreateCasePayload } from '../types/case.types'

import { DatePicker } from '@shared/components/forms/DatePicker'
import { SearchableSelect } from '@shared/components/forms/SearchableSelect'
import { FormSection } from '@shared/components/forms/FormSection'
import { ConfirmDialog } from '@shared/components/modals/ConfirmDialog'
import { useAuthStore } from '@shared/stores/auth.store'

export function CreateCaseWizard() {
  const t = useTranslations('cases')
  const router = useRouter()
  const createCaseMutation = useCreateCase()

  const officer = useAuthStore((state) => state.officer)
  const role = useAuthStore((state) => state.role)
  const isPrivileged = role === 'ADMIN' || role === 'SUPERADMIN' || role === 'DEPT_HEAD'

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [step1Data, setStep1Data] = useState<Partial<CreateCaseStep1Values>>({})
  const [step2Data, setStep2Data] = useState<Partial<CreateCaseStep2Values>>({})
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  // Officer search states
  const [leadOfficerSearch, setLeadOfficerSearch] = useState('')
  const [addOfficerSearch, setAddOfficerSearch] = useState('')

  const { data: crimeTypes, isLoading: isCrimeTypesLoading } = useCrimeTypes()
  const { data: locations, isLoading: isLocationsLoading } = useLocations()
  const { data: departments, isLoading: isDepartmentsLoading } = useDepartments()
  
  const { data: leadOfficerResults, isLoading: isLeadSearchLoading } = useOfficersSearch(leadOfficerSearch)
  const { data: addOfficerResults, isLoading: isAddSearchLoading } = useOfficersSearch(addOfficerSearch)

  // Combined dirty state for form guard
  const [isFormDirty, setIsFormDirty] = useState(false)

  // Monitor dirty states from react-hook-form instances
  useEffect(() => {
    const isAccumulatedDirty = Object.keys(step1Data).length > 0 || Object.keys(step2Data).length > 0
    setIsFormDirty(isAccumulatedDirty)
  }, [step1Data, step2Data])

  // Attach window beforeunload listener if forms are dirty
  useEffect(() => {
    if (!isFormDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isFormDirty])

  // Step 1 Form
  const step1Form = useForm<CreateCaseStep1Values>({
    resolver: zodResolver(createCaseStep1Schema) as any,
    defaultValues: {
      title: '',
      description: '',
      incidentDate: '',
      locationId: undefined,
    },
  })

  // Step 2 Form
  const step2Form = useForm<CreateCaseStep2Values>({
    resolver: zodResolver(createCaseStep2Schema) as any,
    defaultValues: {
      crimeTypeId: '',
      departmentId: isPrivileged ? '' : (officer?.departmentId ?? ''),
    },
  })

  // Step 3 Form
  const step3Form = useForm<CreateCaseStep3Values>({
    resolver: zodResolver(createCaseStep3Schema) as any,
    defaultValues: {
      leadOfficerId: '',
      additionalOfficerIds: [],
    },
  })

  const onStep1Submit = (data: CreateCaseStep1Values) => {
    setStep1Data(data)
    setIsFormDirty(true)
    setCurrentStep(2)
  }

  const onStep2Submit = (data: CreateCaseStep2Values) => {
    setStep2Data(data)
    setIsFormDirty(true)
    setCurrentStep(3)
  }

  const onStep3Submit = async (data: CreateCaseStep3Values) => {
    const payload: CreateCasePayload = {
      title: step1Data.title ?? '',
      description: step1Data.description ?? '',
      incidentDate: step1Data.incidentDate ?? '',
      locationId: step1Data.locationId,
      crimeTypeId: step2Data.crimeTypeId ?? '',
      departmentId: step2Data.departmentId ?? '',
      leadOfficerId: data.leadOfficerId,
      additionalOfficerIds: data.additionalOfficerIds ?? [],
    }
    
    // Clear dirty state block so we don't trigger confirmation on redirect
    setIsFormDirty(false)
    
    await createCaseMutation.mutateAsync(payload)
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    }
  }

  const handleCancelClick = () => {
    if (isFormDirty) {
      setIsCancelDialogOpen(true)
    } else {
      router.push('/cases')
    }
  }

  const confirmCancel = () => {
    setIsFormDirty(false)
    router.push('/cases')
  }

  // Option lists mapping
  const locationOptions = locations?.map((l) => ({ value: l.id, label: l.name })) ?? []
  const crimeTypeOptions = crimeTypes?.map((ct) => ({ value: ct.id, label: ct.name })) ?? []
  const departmentOptions = departments?.map((d) => ({ value: d.id, label: d.name })) ?? []

  const leadOfficerOptions = leadOfficerResults?.map((o) => ({
    value: o.id,
    label: `${o.firstName} ${o.lastName} (${o.badgeNumber})`,
  })) ?? []

  const addOfficerOptions = addOfficerResults
    ?.filter((o) => o.id !== step3Form.watch('leadOfficerId') && !step3Form.watch('additionalOfficerIds')?.includes(o.id))
    ?.map((o) => ({
      value: o.id,
      label: `${o.firstName} ${o.lastName} (${o.badgeNumber})`,
    })) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      {/* Step Indicator */}
      <ol className="flex items-center w-full justify-between" aria-label="Progress steps">
        {/* Step 1 */}
        <li className="flex items-center gap-2" aria-current={currentStep === 1 ? 'step' : undefined}>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              currentStep > 1
                ? 'bg-success text-success-foreground'
                : currentStep === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground-muted'
            }`}
          >
            {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
          </span>
          <span className={`text-sm ${currentStep === 1 ? 'font-semibold text-foreground' : 'text-foreground-muted'}`}>
            {t('create.steps.basicInfo')}
          </span>
        </li>

        {/* Line 1-2 */}
        <div className={`h-0.5 flex-1 mx-4 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />

        {/* Step 2 */}
        <li className="flex items-center gap-2" aria-current={currentStep === 2 ? 'step' : undefined}>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              currentStep > 2
                ? 'bg-success text-success-foreground'
                : currentStep === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground-muted'
            }`}
          >
            {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
          </span>
          <span className={`text-sm ${currentStep === 2 ? 'font-semibold text-foreground' : 'text-foreground-muted'}`}>
            {t('create.steps.crimeDetails')}
          </span>
        </li>

        {/* Line 2-3 */}
        <div className={`h-0.5 flex-1 mx-4 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />

        {/* Step 3 */}
        <li className="flex items-center gap-2" aria-current={currentStep === 3 ? 'step' : undefined}>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              currentStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-muted'
            }`}
          >
            '3'
          </span>
          <span className={`text-sm ${currentStep === 3 ? 'font-semibold text-foreground' : 'text-foreground-muted'}`}>
            {t('create.steps.assignment')}
          </span>
        </li>
      </ol>

      {/* Forms Container */}
      <div className="transition-all duration-300 transform">
        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
            <FormSection title={t('create.step1.heading')}>
              <fieldset className="space-y-4">
                <legend className="sr-only">{t('create.step1.heading')}</legend>

                {/* Case Title */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-sm font-semibold">
                    {t('create.step1.titleLabel')}
                  </label>
                  <Input
                    id="title"
                    {...step1Form.register('title')}
                    placeholder={t('create.step1.titlePlaceholder')}
                  />
                  {step1Form.formState.errors.title && (
                    <p className="text-xs text-destructive">{step1Form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Case Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-sm font-semibold">
                    {t('create.step1.descriptionLabel')}
                  </label>
                  <Textarea
                    id="description"
                    rows={6}
                    {...step1Form.register('description')}
                    placeholder={t('create.step1.descriptionPlaceholder')}
                  />
                  {step1Form.formState.errors.description && (
                    <p className="text-xs text-destructive">{step1Form.formState.errors.description.message}</p>
                  )}
                </div>

                {/* Grid for Date & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Incident Date */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-sm font-semibold">{t('create.step1.incidentDateLabel')}</label>
                    <Controller
                      name="incidentDate"
                      control={step1Form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                          maxDate={new Date()}
                        />
                      )}
                    />
                    {step1Form.formState.errors.incidentDate && (
                      <p className="text-xs text-destructive">{step1Form.formState.errors.incidentDate.message}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-sm font-semibold">{t('create.step1.locationLabel')}</label>
                    <Controller
                      name="locationId"
                      control={step1Form.control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={locationOptions}
                          value={field.value}
                          onChange={field.onChange}
                          isLoading={isLocationsLoading}
                          placeholder={t('create.step1.locationPlaceholder')}
                        />
                      )}
                    />
                  </div>
                </div>
              </fieldset>
            </FormSection>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={handleCancelClick}>
                Cancel
              </Button>
              <Button type="submit">Next</Button>
            </div>
          </form>
        )}

        {/* STEP 2: CRIME DETAILS */}
        {currentStep === 2 && (
          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
            <FormSection title={t('create.step2.heading')}>
              <fieldset className="space-y-4">
                <legend className="sr-only">{t('create.step2.heading')}</legend>

                {/* Crime Type */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-sm font-semibold">{t('create.step2.crimeTypeLabel')}</label>
                  <Controller
                    name="crimeTypeId"
                    control={step2Form.control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={crimeTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isCrimeTypesLoading}
                        placeholder={t('create.step2.crimeTypePlaceholder')}
                      />
                    )}
                  />
                  {step2Form.formState.errors.crimeTypeId && (
                    <p className="text-xs text-destructive">{step2Form.formState.errors.crimeTypeId.message}</p>
                  )}
                </div>

                {/* Responsible Department */}
                <div className="space-y-1.5">
                  <label htmlFor="departmentId" className="text-sm font-semibold">
                    {t('create.step2.departmentLabel')}
                  </label>
                  <Controller
                    name="departmentId"
                    control={step2Form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!isPrivileged}>
                        <SelectTrigger id="departmentId" className="w-full">
                          <SelectValue placeholder={t('create.step2.departmentPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {step2Form.formState.errors.departmentId && (
                    <p className="text-xs text-destructive">{step2Form.formState.errors.departmentId.message}</p>
                  )}
                </div>
              </fieldset>
            </FormSection>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancelClick}>
                  Cancel
                </Button>
                <Button type="submit">Next</Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: ASSIGNMENT */}
        {currentStep === 3 && (
          <form onSubmit={step3Form.handleSubmit(onStep3Submit as any)} className="space-y-6">
            <FormSection title={t('create.step3.heading')}>
              <fieldset className="space-y-6">
                <legend className="sr-only">{t('create.step3.heading')}</legend>

                {/* Lead Investigator */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-sm font-semibold">{t('create.step3.leadOfficerLabel')}</label>
                  <Controller
                    name="leadOfficerId"
                    control={step3Form.control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={leadOfficerOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          // Ensure we clear from additional if selected as lead
                          const currentAdditional = step3Form.getValues('additionalOfficerIds') || []
                          step3Form.setValue('additionalOfficerIds', currentAdditional.filter(id => id !== val))
                        }}
                        onSearch={setLeadOfficerSearch}
                        isLoading={isLeadSearchLoading}
                        placeholder={t('create.step3.leadOfficerPlaceholder')}
                      />
                    )}
                  />
                  {step3Form.formState.errors.leadOfficerId && (
                    <p className="text-xs text-destructive">{step3Form.formState.errors.leadOfficerId.message}</p>
                  )}
                </div>

                {/* Additional Officers SearchableSelect + Pills */}
                <div className="space-y-2 flex flex-col">
                  <label className="text-sm font-semibold">{t('create.step3.additionalOfficersLabel')}</label>
                  <SearchableSelect
                    options={addOfficerOptions}
                    value=""
                    onChange={(val) => {
                      if (val) {
                        const current = step3Form.getValues('additionalOfficerIds') || []
                        if (!current.includes(val)) {
                          step3Form.setValue('additionalOfficerIds', [...current, val])
                        }
                      }
                    }}
                    onSearch={setAddOfficerSearch}
                    isLoading={isAddSearchLoading}
                    placeholder={t('create.step3.additionalOfficersPlaceholder')}
                  />

                  {/* Pills Container */}
                  {step3Form.watch('additionalOfficerIds') && step3Form.watch('additionalOfficerIds')!.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step3Form.watch('additionalOfficerIds')!.map((id) => {
                        const matched = leadOfficerResults?.find((o) => o.id === id)
                        if (!matched) return null
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px]">
                                {`${matched.firstName[0] ?? ''}${matched.lastName[0] ?? ''}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{`${matched.firstName} ${matched.lastName}`}</span>
                            <X
                              className="h-3 w-3 cursor-pointer text-foreground-muted hover:text-foreground"
                              onClick={() => {
                                const current = step3Form.getValues('additionalOfficerIds') || []
                                step3Form.setValue('additionalOfficerIds', current.filter((x) => x !== id))
                              }}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </fieldset>
            </FormSection>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={handleBack} disabled={createCaseMutation.isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancelClick} disabled={createCaseMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCaseMutation.isPending}>
                  {createCaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="Discard Changes?"
        description="You have unsaved changes in this wizard. Navigating away will lose all entered data. Do you want to proceed?"
        confirmLabel="Discard"
        cancelLabel="Continue Editing"
        onConfirm={confirmCancel}
      />
    </div>
  )
}
