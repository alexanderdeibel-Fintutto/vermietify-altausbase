import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function TaxStrategyAdvisor({ buildingId }) {
  const [strategy, setStrategy] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const analyzeStrategy = async () => {
    if (!buildingId) {
      toast.error('Kein Gebäude ausgewählt');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('intelligentTaxStrategy', {
        building_id: buildingId,
        years: 3
      });

      if (response.data.success) {
        setStrategy(response.data.strategy);
        toast.success('Strategie-Analyse abgeschlossen');
      }
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Steuer-Strategie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!strategy ? (
          <Button onClick={analyzeStrategy} disabled={analyzing || !buildingId} className="w-full">
            {analyzing ? 'Analysiere...' : 'Strategie analysieren'}
          </Button>
        ) : (
          <>
            {strategy.trends && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Trends</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {strategy.trends.einnahmen_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span>Einnahmen: {strategy.trends.einnahmen_change}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {strategy.trends.ausgaben_change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-red-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-green-600" />
                    )}
                    <span>Ausgaben: {strategy.trends.ausgaben_change}%</span>
                  </div>
                </div>
              </div>
            )}

            {strategy.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Empfehlungen</div>
                {strategy.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{rec.type}</span>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600">{rec.message}</div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={analyzeStrategy} variant="outline" size="sm" className="w-full">
              Neu analysieren
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}