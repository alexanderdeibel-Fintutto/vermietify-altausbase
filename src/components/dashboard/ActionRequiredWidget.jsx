import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActionRequiredWidget() {
  const items = [
    { id: 1, title: 'Rechnung überfällig', description: 'Rechnung #1234 seit 5 Tagen überfällig', priority: 'high' },
    { id: 2, title: 'Vertrag läuft aus', description: 'Mietvertrag Wohnung 3B in 30 Tagen', priority: 'medium' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[var(--vf-warning-500)]" />
          Handlungsbedarf
          <span className="vf-badge vf-badge-error">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-3 bg-[var(--vf-warning-50)] border border-[var(--vf-warning-200)] rounded-lg">
              <div className="font-medium text-sm mb-1">{item.title}</div>
              <div className="text-xs text-[var(--theme-text-secondary)] mb-3">{item.description}</div>
              <Button variant="outline" size="sm" className="w-full">
                Jetzt handeln
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}