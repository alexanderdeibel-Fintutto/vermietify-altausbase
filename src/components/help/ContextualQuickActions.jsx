import React from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

export default function ContextualQuickActions({ actions = [] }) {
  if (actions.length === 0) return null;

  return (
    <div className="bg-[var(--vf-info-50)] border border-[var(--vf-info-200)] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-[var(--vf-info-600)] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-[var(--vf-info-900)] mb-2">Schnellaktionen</div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}