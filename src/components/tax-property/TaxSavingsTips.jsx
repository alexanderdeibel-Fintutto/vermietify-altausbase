import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingDown } from 'lucide-react';

export default function TaxSavingsTips() {
  const tips = [
    {
      category: 'Immobilien',
      tip: 'Nutzen Sie die degressive AfA für Gebäude vor 2006',
      savings: '~3.500€',
      priority: 'high'
    },
    {
      category: 'Werbungskosten',
      tip: 'Fahrtkosten zur Immobilie mit 0,30€/km absetzen',
      savings: '~800€',
      priority: 'medium'
    },
    {
      category: 'Handwerker',
      tip: '20% der Handwerkerkosten direkt von Steuer abziehen',
      savings: '~1.200€',
      priority: 'high'
    },
    {
      category: 'Versicherungen',
      tip: 'Gebäudeversicherungen vollständig absetzbar',
      savings: '~600€',
      priority: 'medium'
    }
  ];

  const totalSavings = tips.reduce((sum, t) => 
    sum + parseInt(t.savings.replace(/[~€.]/g, '')), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Steuerspar-Tipps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-900">Einsparpotenzial</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{totalSavings.toLocaleString('de-DE')} €</p>
        </div>

        <div className="space-y-2">
          {tips.map((tip, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <Badge className="mb-2" variant="outline">{tip.category}</Badge>
                  <p className="text-sm text-slate-700">{tip.tip}</p>
                </div>
                <Badge className={tip.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'}>
                  {tip.savings}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}