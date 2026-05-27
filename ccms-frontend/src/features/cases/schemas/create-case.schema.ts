import { z } from 'zod'

export const createCaseStep1Schema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters.' })
    .max(200, { message: 'Title must be no more than 200 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(5000),
  incidentDate: z.string().min(1, { message: 'Incident date is required.' }),
  locationId: z.string().optional(),
})

export const createCaseStep2Schema = z.object({
  crimeTypeId: z.string().min(1, { message: 'Crime type is required.' }),
  departmentId: z.string().min(1, { message: 'Department is required.' }),
})

export const createCaseStep3Schema = z.object({
  leadOfficerId: z.string().min(1, { message: 'Lead officer is required.' }),
  additionalOfficerIds: z.array(z.string()).default([]),
})

export const createCaseSchema = createCaseStep1Schema
  .merge(createCaseStep2Schema)
  .merge(createCaseStep3Schema)

export type CreateCaseStep1Values = z.infer<typeof createCaseStep1Schema>
export type CreateCaseStep2Values = z.infer<typeof createCaseStep2Schema>
export type CreateCaseStep3Values = z.infer<typeof createCaseStep3Schema>
export type CreateCaseValues = z.infer<typeof createCaseSchema>
