import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Shield } from 'lucide-react';

export default function RiskAssessment() {
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.AssetPortfolio.list(null, 100)
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0) +
                     buildings.reduce((sum, b) => sum + (b.market_value || 0), 0);

  const stockValue = assets.filter(a => a.asset_type === 'stock').reduce((sum, a) => sum + (a.current_value || 0), 0);
  const stockPercentage = (stockValue / totalValue) * 100;

  const riskLevel = stockPercentage > 70 ? 'high' : stockPercentage > 40 ? 'medium' : 'low';

  const risks = [
    { category: 'Marktrisiko', level: riskLevel, score: stockPercentage },
    { category: 'Währungsrisiko', level: 'low', score: 15 },
    { category: 'Konzentrationsrisiko', level: 'medium', score: 35 },
    { category: 'Liquiditätsrisiko', level: 'low', score: 20 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Risikobewertung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {risks.map(risk => (
          <div key={risk.category} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{risk.category}</span>
              <Badge className={
                risk.level === 'high' ? 'bg-red-600' :
                risk.level === 'medium' ? 'bg-orange-600' :
                'bg-green-600'
              }>
                {risk.level === 'high' ? 'Hoch' : risk.level === 'medium' ? 'Mittel' : 'Niedrig'}
              </Badge>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  risk.level === 'high' ? 'bg-red-600' :
                  risk.level === 'medium' ? 'bg-orange-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>
        ))}

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900">Gesamtrisiko-Score:</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {((risks.reduce((sum, r) => sum + r.score, 0) / risks.length)).toFixed(0)}/100
          </p>
        </div>
      </CardContent>
    </Card>
  );
}