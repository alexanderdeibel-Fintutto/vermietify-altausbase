import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyStateWithAction({ 
  icon: Icon,
  title = 'Keine Daten vorhanden',
  description = 'Erstellen Sie einen neuen Eintrag, um zu beginnen.',
  actionLabel = 'Erstellen',
  onAction,
  loading = false,
  actionIcon: ActionIcon
}) {
  return (
    <Card className="border-slate-200">
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
        {Icon && (
          <Icon className="w-12 h-12 text-slate-300 mb-4" />
        )}
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 max-w-md">{description}</p>
        <Button
          onClick={onAction}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {loading ? 'Wird erstellt...' : actionLabel}
        </Button>
      </div>
    </Card>
  );
}