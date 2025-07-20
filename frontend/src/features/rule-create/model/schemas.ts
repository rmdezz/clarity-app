import { z, ZodIssue, ZodErrorMap } from 'zod';
import { RULE_TYPES } from '@/entities/rule/model/types';

export const ruleCreateSchema = z.object({
  type: z.nativeEnum(RULE_TYPES, {
    // 1) use `error` instead of `errorMap`
    // 2) prefix the unused first parameter with `_`
    // 3) explicitly type both parameters so you don't get `any`
    error: ((  
      _issue: ZodIssue,  
      ctx: { data: unknown; defaultError: string }  
    ) => ({
      message: `"${ctx.data}" no es un tipo de regla válido.`
    })) as ZodErrorMap
  }),
});

export type RuleCreateFormValues = z.infer<typeof ruleCreateSchema>;
