import { z } from 'zod'

export const addCaseNoteSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Note cannot be empty.' })
    .max(1000, { message: 'Note must be no more than 1000 characters.' }),
})

export type AddCaseNoteValues = z.infer<typeof addCaseNoteSchema>
