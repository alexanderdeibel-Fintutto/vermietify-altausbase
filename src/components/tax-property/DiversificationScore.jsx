import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function DiversificationScore() {
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.AssetPortfolio.list(null, 100)
  });

  const assetTypes = [...new Set(assets.map(a => a.asset_type))].length;
  const sectors = [...new Set(assets.map(a => a.sector))].filter(Boolean).length;
  const currencies = [...new Set(assets.map(a => a.currency))].filter(Boolean).length;

  const score = Math.min(100, (assetTypes * 15) + (sectors * 10) + (currencies * 10));

  const criteria = [
    { label: 'Anlageklassen', value: assetTypes, max: 5, weight: 15 },
    { label: 'Sektoren', value: sectors, max: 8, weight: 10 },
    { label: 'Währungen', value: currencies, max: 4, weight: 10 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Diversifikations-Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-blue-600">{score}</p>
          <p className="text-sm text-slate-600">von 100 Punkten</p>
          <Badge className={
            score >= 80 ? 'bg-green-600 mt-2' :
            score >= 60 ? 'bg-orange-600 mt-2' :
            'bg-red-600 mt-2'
          }>
            {score >= 80 ? 'Sehr gut' : score >= 60 ? 'Gut' : 'Verbesserungsbedarf'}
          </Badge>
        </div>

        <div className="space-y-3">
          {criteria.map(c => (
            <div key={c.label}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-sm">{c.value} / {c.max}</span>
              </div>
              <Progress value={(c.value / c.max) * 100} />
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold mb-2">Empfehlungen:</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {assetTypes < 4 && <li>• Weitere Anlageklassen hinzufügen</li>}
            {sectors < 5 && <li>• In mehr Sektoren investieren</li>}
            {currencies < 2 && <li>• Währungsdiversifikation erhöhen</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}