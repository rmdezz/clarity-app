import { z } from 'zod';

export const unitSchema = z.object({
  name: z.string().min(1, { message: 'El nombre/número es requerido.' }),
});

export type UnitFormValues = z.infer<typeof unitSchema>;