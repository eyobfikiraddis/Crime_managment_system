'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAddCaseNote } from '@features/audit/hooks/useAddCaseNote'
import { PermissionGuard } from '@shared/components/permission/PermissionGuard'
import { Permission } from '@shared/constants/permissions'

const addNoteSchema = z.object({
  text: z
    .string()
    .min(1, { message: 'Note text is required.' })
    .max(2000, { message: 'Note cannot exceed 2000 characters.' }),
})

type AddNoteFormValues = z.infer<typeof addNoteSchema>

interface AddCaseNoteFormProps {
  caseId: string
}

export function AddCaseNoteForm({ caseId }: AddCaseNoteFormProps) {
  const t = useTranslations('audit')
  const addNoteMutation = useAddCaseNote(caseId)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddNoteFormValues>({
    resolver: zodResolver(addNoteSchema),
    defaultValues: {
      text: '',
    },
  })

  const textValue = watch('text') || ''

  const onSubmit = (values: AddNoteFormValues) => {
    addNoteMutation.mutate(
      { text: values.text },
      {
        onSuccess: () => {
          reset()
        },
      },
    )
  }

  return (
    <PermissionGuard permission={Permission.CASES_MANAGE}>
      <div className="border-t border-border pt-4 mt-6 print:hidden" data-note-form="">
        <h4 className="text-xs font-bold text-foreground mb-2">
          {t('note.formLabel')}
        </h4>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="relative">
            <Textarea
              {...register('text')}
              placeholder={t('note.placeholder')}
              className="min-h-[80px] pr-20 text-xs"
              maxLength={2000}
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-foreground-muted font-mono bg-background/80 px-1.5 py-0.5 rounded">
              {t('note.characterCount', { count: textValue.length })}
            </div>
          </div>
          {errors.text && (
            <p className="text-[11px] text-destructive font-medium">
              {errors.text.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!textValue.trim() || textValue.length > 2000 || addNoteMutation.isPending}
              className="h-8 text-xs px-4"
            >
              {addNoteMutation.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {t('note.submitButton')}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}
