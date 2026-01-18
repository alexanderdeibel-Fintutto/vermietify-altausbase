import React from 'react';
import VfEmptyState from '@/components/ui/vf-empty-state';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <VfEmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
    />
  );
}