import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SmartRecommendations({ recommendations = [] }) {
  const defaultRecommendations = [
    {
      title: 'BK-Abrechnung erstellen',
      description: 'Für 3 Objekte steht die BK-Abrechnung noch aus',
      priority: 'high',
      action: 'Jetzt erstellen'
    },
    {
      title: 'Verträge aktualisieren',
      description: '2 Verträge laufen in 30 Tagen aus',
      priority: 'medium',
      action: 'Überprüfen'
    }
  ];

  const items = recommendations.length > 0 ? recommendations : defaultRecommendations;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((rec, index) => (
            <div 
              key={index}
              className="p-4 bg-[var(--theme-surface)] rounded-lg border border-[var(--theme-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{rec.title}</div>
                  <div className="text-xs text-[var(--theme-text-secondary)]">{rec.description}</div>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}