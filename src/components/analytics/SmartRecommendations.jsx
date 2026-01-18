import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight } from 'lucide-react';

export default function SmartRecommendations() {
  const recommendations = [
    { 
      id: 1, 
      title: 'Miete erhöhen', 
      description: 'Wohnung 3B liegt 15% unter Marktpreis',
      impact: 'high',
      potential: '+€180/Monat'
    },
    { 
      id: 2, 
      title: 'Versicherung prüfen', 
      description: 'Gebäudeversicherung endet in 60 Tagen',
      impact: 'medium',
      potential: null
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[var(--vf-warning-500)]" />
          Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 border border-[var(--theme-border)] rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium">{rec.title}</div>
                {rec.potential && (
                  <span className="text-sm font-bold text-[var(--vf-success-600)]">
                    {rec.potential}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--theme-text-secondary)] mb-3">{rec.description}</p>
              <Button variant="outline" size="sm">
                Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}