import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { TenantForm } from './TenantForm';
import { tenantSchema, TenantFormValues } from '../model/schemas';

/* ────────────────────────────────────────────────────────────────────── */
/*  Tipos auxiliares                                                     */
/* ────────────────────────────────────────────────────────────────────── */

type TenantFormRawValues = z.input<typeof tenantSchema>;   // ↩︎ valores antes del resolver

type StoryArgs = {
  triggerErrors?: boolean;
};

/* ────────────────────────────────────────────────────────────────────── */
/*  Wrapper que inyecta el formulario                                    */
/* ────────────────────────────────────────────────────────────────────── */

const StoryWrapper = (props: StoryArgs) => {
  const form = useForm<TenantFormRawValues, any, TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      email: '',
      number_of_occupants: 1,
    },
  });

  React.useEffect(() => {
    if (props.triggerErrors) {
      form.setError('name', {
        type: 'manual',
        message: 'El nombre es requerido.',
      });
      form.setError('email', {
        type: 'manual',
        message: 'Por favor, ingrese un correo electrónico válido.',
      });
      form.setError('number_of_occupants', {
        type: 'manual',
        message: 'El número de ocupantes debe ser al menos 1.',
      });
    }
  }, [props.triggerErrors, form]);

  return <TenantForm form={form} />;
};

/* ────────────────────────────────────────────────────────────────────── */
/*  Storybook                                                            */
/* ────────────────────────────────────────────────────────────────────── */

const meta: Meta<typeof StoryWrapper> = {
  title: 'Features/Tenant/TenantForm',
  component: StoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    triggerErrors: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  args: { triggerErrors: false },
};

export const WithErrors: Story = {
  args: { triggerErrors: true },
};
