import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyStateWithAction({ title, description, buttonText, onAction, icon }) {
  return (
    <div className="vf-empty-state">
      <div className="text-6xl mb-4">{icon || '📋'}</div>
      <div className="vf-empty-state-title">{title}</div>
      <div className="vf-empty-state-description">{description}</div>
      {onAction && (
        <Button variant="gradient" onClick={onAction} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      )}
    </div>
  );
}