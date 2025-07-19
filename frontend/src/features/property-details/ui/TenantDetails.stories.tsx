import type { Meta, StoryObj } from '@storybook/react';
import { TenantDetails } from './TenantDetails';
import { ITenant } from '@/entities/tenant/model/types';

const meta: Meta<typeof TenantDetails> = {
  title: 'Features/Property/TenantDetails',
  component: TenantDetails,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TenantDetails>;

const mockTenant: ITenant = {
  id: 1,
  name: 'Juan Pérez',
  email: 'juan.perez@example.com',
  number_of_occupants: 3,
  created_at: '',
  updated_at: '',
};

export const Default: Story = {
  args: {
    tenant: mockTenant,
  },
};