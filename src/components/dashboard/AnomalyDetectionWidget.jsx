import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function AnomalyDetectionWidget() {
  const { data: recentReports } = useQuery({
    queryKey: ['recentReports'],
    queryFn: async () => {
      try {
        return await base44.entities.FinancialReport.list('-generated_at', 5);
      } catch {
        return [];
      }
    }
  });

  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (recentReports && recentReports.length > 0) {
      const detectAnomalies = async () => {
        try {
          setLoading(true);
          const latestReport = recentReports[0];
          const response = await base44.functions.invoke('detectAnomalies', {
            transactions: latestReport.transactions || [],
            metrics: latestReport.metrics,
            historical_patterns: latestReport.metrics.expense_analysis?.categories || {}
          });
          setAnomalies(response.data.anomalies?.slice(0, 5) || []);
        } catch (error) {
          console.error('Error detecting anomalies:', error);
        } finally {
          setLoading(false);
        }
      };
      detectAnomalies();
    }
  }, [recentReports]);

  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Anomalieerkennung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-red-50 p-2 rounded border border-red-200">
            <p className="text-red-600 font-semibold text-lg">{highSeverity}</p>
            <p className="text-red-700">Kritisch</p>
          </div>
          <div className="bg-amber-50 p-2 rounded border border-amber-200">
            <p className="text-amber-600 font-semibold text-lg">{mediumSeverity}</p>
            <p className="text-amber-700">Warnung</p>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-green-600 font-semibold text-lg">{anomalies.length}</p>
            <p className="text-green-700">Erkannt</p>
          </div>
        </div>

        {anomalies.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-xs border ${
                  anomaly.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold">{anomaly.type}</span>
                  <Badge className={
                    anomaly.severity === 'high'
                      ? 'bg-red-100 text-red-800 text-xs'
                      : 'bg-amber-100 text-amber-800 text-xs'
                  }>
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-slate-700">{anomaly.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-600">Keine Anomalien erkannt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}