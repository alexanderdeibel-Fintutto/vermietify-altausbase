import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function IncomeVarianceTracker({ companyId }) {
  const [buildingId, setBuildingId] = useState('');
  const [month, setMonth] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const queryClient = useQueryClient();

  const { data: variances = [] } = useQuery({
    queryKey: ['income-variances', companyId],
    queryFn: () => base44.asServiceRole.entities.IncomeVariance.filter({ company_id: companyId }, '-month', 12)
  });

  const trackMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('trackIncomeVariance', {
        building_id: buildingId,
        month,
        expected_income: parseFloat(expected),
        actual_income: parseFloat(actual)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-variances'] });
      setBuildingId('');
      setMonth('');
      setExpected('');
      setActual('');
    }
  });

  const getVarianceIcon = (type) => {
    switch (type) {
      case 'overperformance': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'underperformance': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  const getVarianceColor = (type) => {
    switch (type) {
      case 'overperformance': return 'bg-green-100 text-green-700';
      case 'underperformance': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mehr-/Mindereinnahmen erfassen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Gebäude-ID"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          />
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Erwartete Einnahmen (€)"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Tatsächliche Einnahmen (€)"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
          <Button
            onClick={() => trackMutation.mutate()}
            disabled={!buildingId || !month || !expected || !actual}
            className="w-full"
          >
            Erfassen
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {variances.map(variance => (
          <Card key={variance.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{variance.month}</span>
                <Badge className={getVarianceColor(variance.variance_type)}>
                  {getVarianceIcon(variance.variance_type)}
                  {variance.variance > 0 ? '+' : ''}{variance.variance}€
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <p>Erwartet: {variance.expected_income}€</p>
                <p>Tatsächlich: {variance.actual_income}€</p>
                <p className={variance.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  Abweichung: {variance.variance_percentage}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}