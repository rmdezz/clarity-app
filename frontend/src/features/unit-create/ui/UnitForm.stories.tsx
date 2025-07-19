import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { UnitForm } from './UnitForm';
import { unitSchema, UnitFormValues } from '../model/schemas';

// Definimos los argumentos para el StoryWrapper
type StoryArgs = {
  triggerErrors?: boolean;
};

// Creamos el componente Wrapper que maneja el hook `useForm`
const StoryWrapper = (props: StoryArgs) => {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: '' },
  });

  // Efecto para simular errores de validación
  React.useEffect(() => {
    if (props.triggerErrors) {
      form.setError('name', { type: 'manual', message: 'El nombre/número es requerido.' });
    }
  }, [props.triggerErrors, form]);

  // Renderizamos el UnitForm, pasándole el objeto 'form'
  return <UnitForm form={form} />;
};

// Meta de Storybook, apuntando a nuestro Wrapper
const meta: Meta<typeof StoryWrapper> = {
  title: 'Features/Unit/UnitForm',
  component: StoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    triggerErrors: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  args: {
    triggerErrors: false,
  },
};

export const WithError: Story = {
  args: {
    triggerErrors: true,
  },
};