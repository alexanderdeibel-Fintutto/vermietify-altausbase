import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertTriangle, Eye } from 'lucide-react';

export default function ConsumptionAnomalyDetector({ buildingId }) {
  const [selectedMeter, setSelectedMeter] = useState(null);

  const { data: anomalies = [] } = useQuery({
    queryKey: ['meterAnomalies', buildingId],
    queryFn: async () => {
      const readings = await base44.entities.MeterReading.filter(
        { anomaly_detected: true },
        '-reading_date',
        50
      );
      
      if (!buildingId) return readings;
      
      const meterIds = readings.map(r => r.meter_id);
      const meters = await base44.entities.Meter.filter(
        { id: { $in: meterIds }, building_id: buildingId },
        null,
        100
      );
      
      return readings.filter(r => meters.find(m => m.id === r.meter_id));
    }
  });

  const { data: analysis, refetch: analyzeConsumption } = useQuery({
    queryKey: ['meterAnalysis', selectedMeter],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeMeterConsumption', {
        meter_id: selectedMeter,
        months_back: 12
      });
      return response.data;
    },
    enabled: !!selectedMeter
  });

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Anomalie-Erkennung
          {anomalies.length > 0 && (
            <Badge className="bg-orange-600">{anomalies.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map(reading => (
              <div 
                key={reading.id}
                className="p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Zähler: {reading.meter_number}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(reading.reading_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedMeter(reading.meter_id)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Analysieren
                  </Button>
                </div>

                {reading.plausibility_check?.warnings && (
                  <div className="space-y-1 mt-2">
                    {reading.plausibility_check.warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-orange-800">
                        ⚠️ {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Keine Anomalien erkannt</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="font-semibold mb-2">KI-Analyse:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Trend:</span>
                  <Badge className={
                    analysis.analysis.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                    analysis.analysis.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {analysis.analysis.trend} ({analysis.analysis.trend_percentage}%)
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ø Verbrauch:</span>
                  <span className="font-semibold">
                    {Math.round(analysis.analysis.avg_monthly_consumption)}
                  </span>
                </div>
              </div>

              {analysis.analysis.recommendations?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Empfehlungen:</p>
                  <ul className="space-y-1">
                    {analysis.analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-slate-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}