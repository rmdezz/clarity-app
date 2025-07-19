import React, { BaseSyntheticEvent } from 'react'; 
import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// Importación corregida de `action` para Storybook 7+
import { action } from 'storybook/actions';

import { PropertyForm } from './PropertyForm';
import { propertySchema, PropertyFormValues } from '../model/schemas';

// 1. Definimos los argumentos que controlaremos en Storybook UI.
// ESTA onSubmit ACEPTA LOS VALORES DEL FORMULARIO VALIDADO.
type StoryArgs = {
  // Esta es la función que Storybook pass-through
  onSubmit: (values: PropertyFormValues) => void; 
  onCancel: () => void;
  isLoading?: boolean;
  triggerErrors?: boolean;
};

// 2. Creamos un componente "Wrapper" que ejecutará el hook `useForm`.
const StoryWrapper = (props: StoryArgs) => {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (props.triggerErrors) {
      form.setError('name', { type: 'manual', message: 'El nombre es requerido.' });
      form.setError('address', { type: 'manual', message: 'La dirección es requerida.' });
    }
  }, [props.triggerErrors, form]);

  // CORRECCIÓN CLAVE: Creamos una función onSubmit compatible con PropertyFormProps.
  // Esta función envuelve la `props.onSubmit` original usando `form.handleSubmit`.
  const handleSubmitForForm: (e?: BaseSyntheticEvent) => Promise<void> = 
    form.handleSubmit(props.onSubmit);

  // Renderizamos el componente PropertyForm, pasándole el objeto 'form'
  // y la NUEVA función handleSubmitForForm.
  return <PropertyForm {...props} form={form} onSubmit={handleSubmitForForm} />;
};

// 3. Definimos la Meta para Storybook.
const meta: Meta<typeof StoryWrapper> = { 
  title: 'Features/Property/PropertyForm',
  component: StoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' }, // Todavía podemos loguear la acción que acepta valores
    onCancel: { action: 'cancelled' },
    isLoading: { control: 'boolean' },
    triggerErrors: { control: 'boolean' },
  },
};
export default meta;

// 4. Definimos el tipo de StoryObj que referencia las props de StoryWrapper.
type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  args: {
    isLoading: false,
    triggerErrors: false,
    onSubmit: action('submitted'),
    onCancel: action('cancelled'),
  },
};

export const WithErrors: Story = {
  args: {
    ...Default.args,
    triggerErrors: true,
  },
};