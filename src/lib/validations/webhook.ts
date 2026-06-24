import { z } from 'zod'

export const n8nContactPayloadSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  type: z
    .string()
    .optional()
    .transform((t) => (t === 'tenant' ? 'tenant' : 'prospect')),
  unit_address: z.string().optional(),
  agent_id: z.string().uuid().optional(),
})

export type N8nContactPayload = z.infer<typeof n8nContactPayloadSchema>
