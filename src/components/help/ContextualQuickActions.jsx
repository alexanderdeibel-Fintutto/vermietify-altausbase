import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, FileText, Calculator } from 'lucide-react';

export default function ContextualQuickActions({ context = 'building' }) {
  const actions = {
    building: [
      { icon: FileText, label: 'Vertrag erstellen', action: () => {} },
      { icon: Calculator, label: 'BK berechnen', action: () => {} }
    ],
    tenant: [
      { icon: FileText, label: 'Dokument senden', action: () => {} }
    ]
  };

  const currentActions = actions[context] || [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-[var(--vf-warning-500)]" />
          <span className="text-sm font-medium">Schnellaktionen</span>
        </div>
        <div className="space-y-2">
          {currentActions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={action.action}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}