import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  // 1. Añadir el nuevo campo al esquema
  password2: z.string().min(8, { message: 'La confirmación debe tener al menos 8 caracteres.' }),
})
// 2. Añadir una regla de "refinamiento" para comparar los dos campos
.refine((data) => data.password === data.password2, {
  // 3. Mensaje de error si la validación falla
  message: "Las contraseñas no coinciden.",
  // 4. Aplicar este error al campo de confirmación para una mejor UX
  path: ["password2"], 
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingrese un correo electrónico válido.' }),
  password: z.string().min(1, { message: 'Por favor, ingrese su contraseña.' }),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
