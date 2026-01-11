import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function RentOptimizationPanel({ companyId }) {
  const [unitId, setUnitId] = useState('');
  const queryClient = useQueryClient();

  const { data: optimizations = [] } = useQuery({
    queryKey: ['rent-optimizations', companyId],
    queryFn: () => base44.asServiceRole.entities.RentOptimization.filter({ company_id: companyId }, '-created_at', 10)
  });

  const optimizeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('optimizeRentWithAI', { unit_id: unitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-optimizations'] });
      setUnitId('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            KI-Mietpreisoptimierung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Einheits-ID"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          />
          <Button
            onClick={() => optimizeMutation.mutate()}
            disabled={!unitId || optimizeMutation.isPending}
            className="w-full"
          >
            Mit KI analysieren
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {optimizations.map(opt => {
          const increase = opt.suggested_rent - opt.current_rent;
          const percentChange = (increase / opt.current_rent) * 100;

          return (
            <Card key={opt.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Einheit {opt.unit_id.substring(0, 8)}</span>
                  <Badge className="bg-green-100 text-green-700">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {increase > 0 ? '+' : ''}{increase.toFixed(0)}€
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="p-2 bg-slate-50 rounded text-xs">
                    <p className="text-slate-600">Aktuell</p>
                    <p className="text-lg font-bold">{opt.current_rent}€</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-xs">
                    <p className="text-blue-600">KI-Vorschlag</p>
                    <p className="text-lg font-bold text-blue-900">{opt.suggested_rent}€</p>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Konfidenz:</span>
                    <span className="font-medium">{opt.confidence_score}%</span>
                  </div>
                  <p className="text-slate-600 italic">{opt.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}