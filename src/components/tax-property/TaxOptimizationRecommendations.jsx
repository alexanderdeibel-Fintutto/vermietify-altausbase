import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingDown, CheckCircle } from 'lucide-react';

export default function TaxOptimizationRecommendations() {
  const recommendations = [
    {
      id: 1,
      title: 'AfA-Optimierung bei Objekt #1',
      description: 'Durch lineare AfA 2% können Sie zusätzlich 4.200€ steuerlich geltend machen',
      potential_saving: 1680,
      priority: 'high',
      category: 'Immobilien'
    },
    {
      id: 2,
      title: 'Verlustverrechnung Wertpapiere',
      description: 'Realisierte Verluste gegen Gewinne verrechnen - Steuerlast senken',
      potential_saving: 2100,
      priority: 'high',
      category: 'Kapitalanlagen'
    },
    {
      id: 3,
      title: 'Handwerkerleistungen absetzen',
      description: '20% der Arbeitskosten (max 1.200€) steuerlich absetzbar',
      potential_saving: 1200,
      priority: 'medium',
      category: 'Werbungskosten'
    },
    {
      id: 4,
      title: 'Rücklagen für Instandhaltung',
      description: 'Sofort absetzbare Erhaltungsaufwendungen vorziehen',
      potential_saving: 800,
      priority: 'medium',
      category: 'Immobilien'
    }
  ];

  const totalSavings = recommendations.reduce((sum, r) => sum + r.potential_saving, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            KI-Optimierungsvorschläge
          </CardTitle>
          <Badge className="bg-green-600">
            {totalSavings.toLocaleString('de-DE')} € Potenzial
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map(rec => (
          <div key={rec.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{rec.title}</p>
                  <Badge className={
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                <Badge variant="outline" className="text-xs">{rec.category}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  {rec.potential_saving.toLocaleString('de-DE')} € sparen
                </span>
              </div>
              <Button size="sm" variant="outline">
                <CheckCircle className="w-3 h-3 mr-1" />
                Umsetzen
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}