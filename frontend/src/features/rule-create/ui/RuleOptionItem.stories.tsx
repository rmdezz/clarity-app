import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RuleOptionItem } from './RuleOptionItem';
import { AVAILABLE_RULES_EXPLANATIONS, IRule } from '@/entities/rule/model/types';
import { action } from 'storybook/internal/actions';

const StoryWrapper = ({ isSelected: initialIsSelected = false }) => {
  const [isSelected, setIsSelected] = React.useState(initialIsSelected);
  const rule = AVAILABLE_RULES_EXPLANATIONS[0];

  const handleSelect = (type: IRule['type']) => {
    setIsSelected(!isSelected);
    action('onSelect')(type);
  };

  return <RuleOptionItem rule={rule} isSelected={isSelected} onSelect={handleSelect} />;
};

const meta: Meta<typeof StoryWrapper> = {
  title: 'Features/Rule/RuleOptionItem',
  component: StoryWrapper,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = { args: { isSelected: false } };
export const Selected: Story = { args: { isSelected: true } };