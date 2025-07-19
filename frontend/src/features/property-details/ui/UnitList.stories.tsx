import type { Meta, StoryObj } from '@storybook/react';
import { UnitList } from './UnitList';

const meta: Meta<typeof UnitList> = {
  title: 'Features/Property/UnitList',
  component: UnitList,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof UnitList>;

const mockUnits = [
  { id: 1, name: 'Apto 101', created_at: '', updated_at: '' },
  { id: 2, name: 'Apto 102', created_at: '', updated_at: '' },
  { id: 3, name: 'Local Comercial A', created_at: '', updated_at: '' },
];

export const Default: Story = {
  args: {
    units: mockUnits,
  },
};

export const Empty: Story = {
  args: {
    units: [],
  },
};