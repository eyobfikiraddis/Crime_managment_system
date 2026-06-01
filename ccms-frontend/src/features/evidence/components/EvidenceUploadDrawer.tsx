'use client'

import Image from 'next/image'
import { useEffect, useState, useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { FileText, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlideOverDrawer } from '@/shared/components/modals/SlideOverDrawer'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { FormField } from '@/shared/components/forms/FormField'
import { SearchableSelect } from '@/shared/components/forms/SearchableSelect'
import { DatePicker } from '@/shared/components/forms/DatePicker'
import { FileUploadZone } from '@/shared/components/forms/FileUploadZone'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useOfficersSearch } from '@/features/cases/hooks/useOfficersSearch'
import { useUploadEvidence } from '../hooks/useUploadEvidence'
import {
  evidenceMetadataSchema,
  evidenceFileSchema,
  type EvidenceMetadataValues,
} from '../schemas/upload-evidence.schema'
import { EvidenceType, MEDIA_EVIDENCE_TYPES } from '../types/evidence.types'
import { cn } from '@/lib/utils'

interface EvidenceUploadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
}

export function EvidenceUploadDrawer({
  open,
  onOpenChange,
  caseId,
}: EvidenceUploadDrawerProps) {
  const t = useTranslations('evidence')
  const [officerSearch, setOfficerSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { data: officerResults, isLoading: isOfficerLoading } = useOfficersSearch(officerSearch)
  const { upload, uploadState, reset, isPending: isUploading } = useUploadEvidence(caseId)

  const form = useForm<EvidenceMetadataValues>({
    resolver: zodResolver(evidenceMetadataSchema),
    defaultValues: {
      description: '',
      evidenceType: undefined as any,
      collectedById: '',
      collectedAt: '',
      storageLocation: '',
      notes: '',
    },
  })

  const { control, register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form
  const selectedType = useWatch({ control, name: 'evidenceType' })
  const showFileUpload = MEDIA_EVIDENCE_TYPES.includes(selectedType as EvidenceType)

  useEffect(() => {
    if (!showFileUpload) {
      setSelectedFile(null)
      setFileError(null)
    }
  }, [showFileUpload])

  useEffect(() => {
    if (!selectedFile) {
      setObjectUrl(null)
      return
    }
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
    return
  }, [selectedFile])

  // Reset form and states when drawer closes/opens
  useEffect(() => {
    if (open) {
      form.reset()
      setSelectedFile(null)
      setFileError(null)
      reset()
    }
  }, [open, form, reset])

  const onSubmit = async (values: EvidenceMetadataValues) => {
    startTransition(async () => {
      await upload(values, selectedFile)
    })
  }

  // Handle close action with dirty guard check
  const handleCloseAttempt = () => {
    if (isDirty || selectedFile) {
      setShowDiscardConfirm(true)
    } else {
      onOpenChange(false)
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onOpenChange(false)
  }

  const handleFileSelected = (file: File) => {
    const validation = evidenceFileSchema.safeParse({ file })
    if (!validation.success) {
      setFileError(validation.error.issues[0]?.message ?? 'Invalid file')
      setSelectedFile(null)
    } else {
      setFileError(null)
      setSelectedFile(file)
    }
  }

  const handleRetry = () => {
    reset()
    void handleSubmit(onSubmit)()
  }

  // Close drawer once upload state successfully transitions to success
  useEffect(() => {
    if (uploadState.phase === 'success') {
      onOpenChange(false)
    }
  }, [uploadState.phase, onOpenChange])

  const officerOptions = officerResults?.map((officer) => ({
    value: officer.id,
    label: `${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`,
  })) ?? []

  const showProgressBar = ['signing', 'uploading', 'recording'].includes(uploadState.phase)
  const progressPercent =
    uploadState.phase === 'signing'
      ? 0
      : uploadState.phase === 'recording'
      ? 100
      : uploadState.progress

  const isLoadingOrUploading = isPending || isUploading

  return (
    <>
      <SlideOverDrawer
        open={open}
        onOpenChange={handleCloseAttempt}
        title={t('upload.drawerTitle')}
        description={t('upload.drawerDescription')}
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAttempt}
              disabled={isLoadingOrUploading}
            >
              {t('upload.cancelButton')}
            </Button>

            {uploadState.phase === 'error' ? (
              <Button type="button" onClick={handleRetry} disabled={isLoadingOrUploading}>
                {isLoadingOrUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('upload.retryButton')}
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isLoadingOrUploading}>
                {isLoadingOrUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('upload.submitButton')}
              </Button>
            )}
          </div>
        }
      >
        {uploadState.phase === 'error' ? (
          <div className="py-4">
            <ErrorState
              title={t('upload.uploadPhase.error')}
              description={uploadState.error ?? t('upload.errorMessage')}
              retry={handleRetry}
              retryLabel={t('upload.retryButton')}
            />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t('upload.section1Title')}
              </h3>

              <FormField
                label={t('upload.descriptionLabel')}
                required
                error={errors.description?.message}
              >
                <Textarea
                  {...register('description')}
                  placeholder={t('upload.descriptionPlaceholder')}
                  disabled={isLoadingOrUploading}
                  rows={3}
                />
              </FormField>

              <FormField
                label={t('upload.typeLabel')}
                required
                error={errors.evidenceType?.message}
              >
                <Controller
                  name="evidenceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={isLoadingOrUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('upload.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EvidenceType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label={t('upload.collectedByLabel')}
                required
                error={errors.collectedById?.message}
              >
                <Controller
                  name="collectedById"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={officerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onSearch={setOfficerSearch}
                      isLoading={isOfficerLoading}
                      placeholder={t('upload.collectedByPlaceholder')}
                    />
                  )}
                />
              </FormField>

              <FormField
                label={t('upload.collectedAtLabel')}
                required
                error={errors.collectedAt?.message}
              >
                <Controller
                  name="collectedAt"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                      placeholder="Select collection date"
                    />
                  )}
                />
              </FormField>

              <FormField
                label={t('upload.storageLocationLabel')}
                required
                error={errors.storageLocation?.message}
              >
                <Input
                  {...register('storageLocation')}
                  placeholder={t('upload.storageLocationPlaceholder')}
                  disabled={isLoadingOrUploading}
                />
              </FormField>

              <FormField
                label={t('upload.notesLabel')}
                error={errors.notes?.message}
              >
                <Textarea
                  {...register('notes')}
                  placeholder={t('upload.notesPlaceholder')}
                  disabled={isLoadingOrUploading}
                  rows={3}
                />
              </FormField>
            </div>

            {/* Section 2: Conditional File Upload */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                showFileUpload ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              )}
            >
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('upload.section2Title')}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    {t('upload.section2Description')}
                  </p>
                </div>

                {!selectedFile ? (
                  <div className="space-y-2">
                    <FileUploadZone
                      accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf,audio/mpeg,audio/wav,video/mp4,video/quicktime"
                      maxSize={50 * 1024 * 1024}
                      onFile={handleFileSelected}
                      isUploading={uploadState.phase === 'uploading'}
                      progress={uploadState.progress}
                      title={t('upload.fileDragPrompt')}
                      subtitle={t('upload.fileSizeLimit')}
                    />
                    {fileError ? (
                      <p className="text-xs text-destructive">{fileError}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-3">
                      {selectedFile.type.startsWith('image/') && objectUrl ? (
                        <Image
                          src={objectUrl}
                          alt={selectedFile.name}
                          width={48}
                          height={48}
                          unoptimized
                          className="rounded object-cover border border-border"
                        />
                      ) : (
                        <FileText className="size-8 text-foreground-muted" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[220px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null)
                        setFileError(null)
                      }}
                      disabled={isLoadingOrUploading}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Custom progress bar and phase messages */}
            {showProgressBar && (
              <div className="space-y-2 border-t border-border pt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-150',
                      uploadState.phase === 'recording' ? 'bg-success' : 'bg-primary',
                      (uploadState.phase === 'signing' || uploadState.phase === 'recording') &&
                        'animate-pulse bg-primary/70'
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-foreground-muted">
                  {uploadState.phase === 'signing' && t('upload.uploadPhase.signing')}
                  {uploadState.phase === 'uploading' &&
                    t('upload.uploadPhase.uploading', { progress: uploadState.progress })}
                  {uploadState.phase === 'recording' && t('upload.uploadPhase.recording')}
                </div>
              </div>
            )}
          </form>
        )}
      </SlideOverDrawer>

      {showDiscardConfirm ? (
        <ConfirmDialog
          open={showDiscardConfirm}
          onOpenChange={setShowDiscardConfirm}
          title="Discard evidence?"
          description="You have unsaved changes. Closing this drawer will discard your input."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={handleConfirmDiscard}
        />
      ) : null}
    </>
  )
}
