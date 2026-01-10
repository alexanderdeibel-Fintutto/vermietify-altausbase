import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ThermometerSun, TrendingUp, TrendingDown, Minus, Wrench } from 'lucide-react';

const actionIcons = {
  increase: TrendingUp,
  decrease: TrendingDown,
  maintain: Minus,
  schedule_maintenance: Wrench
};

const actionColors = {
  increase: 'bg-red-100 text-red-800',
  decrease: 'bg-blue-100 text-blue-800',
  maintain: 'bg-green-100 text-green-800',
  schedule_maintenance: 'bg-orange-100 text-orange-800'
};

const actionLabels = {
  increase: 'Erhöhen',
  decrease: 'Reduzieren',
  maintain: 'Beibehalten',
  schedule_maintenance: 'Wartung'
};

export default function HeatingOptimizationPanel({ buildingId }) {
  const { data: optimizations = [] } = useQuery({
    queryKey: ['heating-optimizations', buildingId],
    queryFn: () => base44.entities.HeatingOptimization.filter({ 
      building_id: buildingId 
    }, '-created_date', 20),
    enabled: !!buildingId,
    refetchInterval: 60000
  });

  const latestOptimizations = optimizations.slice(0, 5);
  const totalSavings = optimizations.reduce((sum, o) => sum + (o.cost_savings_potential || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="w-5 h-5" />
            Heizungsoptimierung
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-slate-600">Geschätztes Einsparpotenzial</p>
            <p className="text-2xl font-bold text-green-600">{totalSavings.toFixed(2)}€</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {latestOptimizations.length === 0 ? (
          <p className="text-center text-slate-600 py-6">Keine Optimierungen verfügbar</p>
        ) : (
          <div className="space-y-3">
            {latestOptimizations.map(opt => {
              const Icon = actionIcons[opt.recommended_action];
              return (
                <div key={opt.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <Badge className={actionColors[opt.recommended_action]}>
                          {actionLabels[opt.recommended_action]}
                        </Badge>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(opt.created_date).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {opt.current_temperature?.toFixed(1)}°C
                      </p>
                      <p className="text-xs text-slate-600">
                        Ziel: {opt.target_temperature}°C
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded p-3 mb-3">
                    <p className="text-sm text-slate-700">{opt.optimization_reason}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Außentemperatur: {opt.outside_temperature?.toFixed(1)}°C
                    </span>
                    {opt.energy_savings_potential > 0 && (
                      <span className="text-green-600 font-semibold">
                        Einsparung: {opt.cost_savings_potential?.toFixed(2)}€
                      </span>
                    )}
                  </div>

                  {!opt.implemented && opt.recommended_action !== 'maintain' && (
                    <Button size="sm" className="w-full mt-3">
                      Empfehlung umsetzen
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}