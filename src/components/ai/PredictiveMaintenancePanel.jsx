import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Cpu, AlertTriangle, Wrench } from 'lucide-react';

export default function PredictiveMaintenancePanel({ companyId }) {
  const [equipmentId, setEquipmentId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const queryClient = useQueryClient();

  const { data: predictions = [] } = useQuery({
    queryKey: ['maintenance-predictions', companyId],
    queryFn: () => base44.asServiceRole.entities.MaintenancePrediction.filter({ company_id: companyId }, '-predicted_date', 10)
  });

  const predictMutation = useMutation({
    mutationFn: () => base44.functions.invoke('predictMaintenance', { equipment_id: equipmentId, building_id: buildingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-predictions'] });
      setEquipmentId('');
      setBuildingId('');
    }
  });

  const getPriorityColor = (probability) => {
    if (probability >= 75) return 'bg-red-100 text-red-700';
    if (probability >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Predictive Maintenance (ML)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Equipment-ID"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
          />
          <Input
            placeholder="Gebäude-ID"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          />
          <Button
            onClick={() => predictMutation.mutate()}
            disabled={!equipmentId || !buildingId || predictMutation.isPending}
            className="w-full"
          >
            ML-Prognose erstellen
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {predictions.map(pred => (
          <Card key={pred.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">{pred.prediction_type}</span>
                </div>
                <Badge className={getPriorityColor(pred.probability)}>
                  {pred.probability}% Risiko
                </Badge>
              </div>
              <div className="text-xs space-y-1 mb-2">
                <p>Vorhergesagt: {pred.predicted_date}</p>
                <p>Kosten: ~{pred.estimated_cost}€</p>
              </div>
              <div className="p-2 bg-blue-50 rounded text-xs">
                <p className="font-medium mb-1">Empfehlung:</p>
                <p className="text-slate-700">{pred.recommended_action}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}