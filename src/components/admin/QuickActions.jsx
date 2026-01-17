import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Download, Settings } from 'lucide-react';

export default function QuickActions({ onAction }) {
  const actions = [
    { id: 'new_user', label: 'Benutzer einladen', icon: Plus },
    { id: 'send_newsletter', label: 'Newsletter senden', icon: Mail },
    { id: 'export_data', label: 'Daten exportieren', icon: Download },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const ActionIcon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => onAction(action.id)}
          >
            <ActionIcon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}