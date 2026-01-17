import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function ActionRequiredWidget({ items = [] }) {
  const defaultItems = [
    { title: 'BK-Abrechnung ausstehend', description: 'Für Objekt Musterstraße', priority: 'high' },
    { title: 'Vertrag prüfen', description: 'Läuft in 30 Tagen aus', priority: 'medium' }
  ];

  const actionItems = items.length > 0 ? items : defaultItems;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Aktion erforderlich
          <VfBadge variant="error">{actionItems.length}</VfBadge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actionItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">{item.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--theme-text-muted)]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}