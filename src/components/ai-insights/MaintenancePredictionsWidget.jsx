import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wrench, AlertTriangle } from 'lucide-react';

export default function MaintenancePredictionsWidget({ buildings }) {
  const { data: predictions = [] } = useQuery({
    queryKey: ['maintenance-predictions'],
    queryFn: () => base44.entities.MaintenancePrediction.list('-created_date', 20)
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['recent-inspections'],
    queryFn: () => base44.entities.BuildingInspection.filter({ status: 'completed' }, '-inspection_date', 10)
  });

  const predictionsByType = predictions.reduce((acc, pred) => {
    const type = pred.prediction_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(predictionsByType).map(([type, count]) => ({
    type: type === 'failure' ? 'Ausfall' : type === 'maintenance_due' ? 'Wartung fällig' : 'Ersatz nötig',
    count
  }));

  const criticalPredictions = predictions.filter(p => p.probability > 70);
  const avgCost = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + (p.estimated_cost || 0), 0) / predictions.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="w-5 h-5 text-orange-600" />
          Wartungs-Vorhersagen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Keine Vorhersagen verfügbar</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Gesamt</p>
                <p className="text-xl font-bold">{predictions.length}</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-red-600">Kritisch</p>
                <p className="text-xl font-bold text-red-700">{criticalPredictions.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">Ø Kosten</p>
                <p className="text-xl font-bold text-blue-700">€{avgCost.toFixed(0)}</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f97316" name="Anzahl" />
              </BarChart>
            </ResponsiveContainer>

            {criticalPredictions.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-red-900 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Kritische Vorhersagen
                </p>
                <div className="space-y-2">
                  {criticalPredictions.slice(0, 3).map((pred, i) => {
                    const building = buildings.find(b => b.id === pred.building_id);
                    return (
                      <div key={i} className="flex items-start justify-between text-xs p-2 bg-red-50 rounded">
                        <div>
                          <p className="font-medium text-red-900">{building?.name || 'Gebäude'}</p>
                          <p className="text-red-700">{pred.recommended_action}</p>
                        </div>
                        <Badge className="bg-red-600 text-white">{pred.probability}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}