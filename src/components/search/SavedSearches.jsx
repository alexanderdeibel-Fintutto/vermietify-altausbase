import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Play } from 'lucide-react';

export default function SavedSearches() {
  const searches = [
    { id: 1, name: 'Auslaufende Verträge', query: 'contract:expiring' },
    { id: 2, name: 'Unbezahlte Rechnungen', query: 'invoice:unpaid' },
    { id: 3, name: 'Leere Wohnungen', query: 'unit:vacant' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Gespeicherte Suchen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {searches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div>
                <div className="font-medium text-sm">{search.name}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1 font-mono">{search.query}</div>
              </div>
              <Button variant="ghost" size="sm">
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}