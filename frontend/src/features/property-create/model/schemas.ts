import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  address: z.string().min(1, { message: 'La dirección es requerida.' }),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;