// AssignTenantModal.stories.tsx
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AssignTenantModal } from './AssignTenantModal';
import * as useAssignTenantModule from '../model/useAssignTenant';

import type { IUnit } from '@/entities/unit/model/types';
import type { TenantFormValues } from '../model/schemas';
import type { ITenant } from '@/entities/tenant/model/types';
import { action } from 'storybook/internal/actions';

/* -------------------------------------------------------------------------- */
/* 1. Helpers                                                                  */
/* -------------------------------------------------------------------------- */

type MutateInput = { unitId: number; data: TenantFormValues };
type MutateCallbacks = {
  onSuccess?: (tenant: ITenant) => void;
  onError?: (error: Error) => void;
};

const buildMockMutate =
  (simulateError?: string) =>
  (input: MutateInput, { onSuccess, onError }: MutateCallbacks) => {
    action('assignTenantToUnit-called')(input);

    if (simulateError) {
      onError?.(new Error(simulateError));
      return;
    }

    onSuccess?.({
      id: 999,
      name: input.data.name,
      email: input.data.email,
      number_of_occupants: input.data.number_of_occupants,
      created_at: '',
      updated_at: '',
    });
  };

/* -------------------------------------------------------------------------- */
/* 2. Datos de ejemplo                                                         */
/* -------------------------------------------------------------------------- */

const mockUnit: IUnit = {
  id: 101,
  name: 'Apto 101',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  tenant: null,
};

/* -------------------------------------------------------------------------- */
/* 3. StoryWrapper                                                             */
/* -------------------------------------------------------------------------- */

type StoryArgs = {
  initialOpen?: boolean;
  mockIsLoading?: boolean;
  simulateMutationError?: string;
  unit?: IUnit;
};

const StoryWrapper = (props: StoryArgs) => {
  const [isOpen, setIsOpen] = React.useState(props.initialOpen ?? false);

  // “Monkey-patch” del hook dentro de la historia
  React.useEffect(() => {
    (useAssignTenantModule as any).useAssignTenant = () => ({
      mutate: buildMockMutate(props.simulateMutationError),
      isPending: props.mockIsLoading ?? false,
    });
  }, [props.mockIsLoading, props.simulateMutationError]);

  return (
    <>
      {!props.initialOpen && (
        <button
          className="bg-primary text-white p-2 rounded-md"
          onClick={() => setIsOpen(true)}
        >
          Abrir Modal de Asignación
        </button>
      )}

      <AssignTenantModal
        propertyId="1"
        unit={props.unit ?? mockUnit}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Meta & Stories                                                          */
/* -------------------------------------------------------------------------- */

const meta: Meta<typeof StoryWrapper> = {
  title: 'Features/Tenant/AssignTenantModal',
  component: StoryWrapper,
  argTypes: {
    initialOpen: { control: 'boolean' },
    mockIsLoading: { control: 'boolean' },
    simulateMutationError: { control: 'text' },
    unit: { control: 'object' },
  },
};
export default meta;

type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  args: { initialOpen: false, mockIsLoading: false, unit: mockUnit },
};

export const OpenAndLoading: Story = {
  args: { ...Default.args, initialOpen: true, mockIsLoading: true },
};

export const OpenWithServerError: Story = {
  args: {
    ...Default.args,
    initialOpen: true,
    simulateMutationError: 'Esta unidad ya tiene un inquilino asignado.',
  },
};

export const OpenForUnitB: Story = {
  args: {
    ...Default.args,
    initialOpen: true,
    unit: { ...mockUnit, id: 102, name: 'Local Comercial B' },
  },
};
