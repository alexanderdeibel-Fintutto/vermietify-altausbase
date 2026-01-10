import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingDown, ArrowRight } from 'lucide-react';

export default function LossCarryforwardTracker() {
  const { data: lossCarryforwards = [] } = useQuery({
    queryKey: ['lossCarryforwards'],
    queryFn: () => base44.entities.TaxLossCarryforward.list('-year', 10)
  });

  const totalLosses = lossCarryforwards.reduce((sum, l) => sum + (l.amount_remaining || 0), 0);
  const potentialSavings = totalLosses * 0.42;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Verlustvorträge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-900">Verluste verfügbar</p>
            <p className="text-2xl font-bold text-orange-900">
              {totalLosses.toLocaleString('de-DE')} €
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Steuerersparnis</p>
            <p className="text-2xl font-bold text-green-900">
              {potentialSavings.toLocaleString('de-DE')} €
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {lossCarryforwards.map(loss => (
            <div key={loss.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{loss.category}</p>
                  <p className="text-xs text-slate-600">Jahr: {loss.year}</p>
                </div>
                <Badge>{loss.amount_remaining?.toLocaleString('de-DE')} €</Badge>
              </div>
              {loss.amount_used > 0 && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <ArrowRight className="w-3 h-3" />
                  {loss.amount_used?.toLocaleString('de-DE')} € bereits verrechnet
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}