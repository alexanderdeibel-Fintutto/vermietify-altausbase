import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';

export default function ROIAnalysisDashboard({ companyId }) {
  const [buildingId, setBuildingId] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [equity, setEquity] = useState('');
  const queryClient = useQueryClient();

  const { data: analyses = [] } = useQuery({
    queryKey: ['roi-analyses', companyId],
    queryFn: () => base44.asServiceRole.entities.PropertyROI.filter({ company_id: companyId }, '-calculation_date', 10)
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('calculatePropertyROI', {
        building_id: buildingId,
        property_value: parseFloat(propertyValue),
        equity_invested: parseFloat(equity)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roi-analyses'] });
      setBuildingId('');
      setPropertyValue('');
      setEquity('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            ROI-Analyse berechnen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Gebäude-ID"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Immobilienwert (€)"
            value={propertyValue}
            onChange={(e) => setPropertyValue(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Eigenkapital (€)"
            value={equity}
            onChange={(e) => setEquity(e.target.value)}
          />
          <Button
            onClick={() => calculateMutation.mutate()}
            disabled={!buildingId || !propertyValue || !equity}
            className="w-full"
          >
            <Calculator className="w-4 h-4 mr-2" />
            ROI berechnen
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {analyses.map(roi => (
          <Card key={roi.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Analyse vom {roi.calculation_date}</span>
                <Badge>{roi.net_yield_percentage}% Netto</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-green-600">Brutto-Rendite</p>
                  <p className="text-lg font-bold text-green-900">{roi.gross_yield_percentage}%</p>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-blue-600">Netto-Rendite</p>
                  <p className="text-lg font-bold text-blue-900">{roi.net_yield_percentage}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <p className="text-purple-600">EK-Rendite</p>
                  <p className="text-lg font-bold text-purple-900">{roi.cash_on_cash_return}%</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                <p>NOI: {roi.net_operating_income}€</p>
                <p>Immobilienwert: {roi.property_value}€</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}