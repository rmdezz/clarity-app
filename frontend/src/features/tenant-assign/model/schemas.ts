import { z } from 'zod';

/**
 * Esquema de validación y transformación.
 * `z.coerce.number()` acepta strings y los convierte a número.
 */
export const tenantSchema = z.object({
  name: z.string().trim().min(1, { message: 'El nombre es requerido.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
  number_of_occupants: z
    .coerce
    .number()
    .int({ message: 'El número de ocupantes debe ser un número entero.' })
    .min(1, { message: 'El número de ocupantes debe ser al menos 1.' }),
});

/** Valores tras el resolver (lo que llega a `onSubmit`). */
export type TenantFormValues = z.output<typeof tenantSchema>;
/** Valores crudos que entran al resolver (lo que tienen los inputs). */
export type TenantFormRawValues = z.input<typeof tenantSchema>;