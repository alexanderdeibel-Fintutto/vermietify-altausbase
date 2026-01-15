import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function KPIDashboard({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const handleLoadDashboard = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateKPIDashboard', {
        buildingId
      });

      setDashboard(response.data.dashboard);
      toast.success('KPI-Dashboard geladen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'GOOD') return 'bg-green-50 border-green-200';
    if (status === 'WARNING') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'GOOD') return '✅';
    if (status === 'WARNING') return '⚠️';
    return '🔴';
  };

  return (
    <div className="space-y-4">
      {!dashboard ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              KPI-Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLoadDashboard}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Laden...
                </>
              ) : (
                'Dashboard anzeigen'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard.kpis?.map((kpi, idx) => (
              <Card key={idx} className={`border-2 ${getStatusColor(kpi.status)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-600 font-medium">{kpi.name}</p>
                    <span className="text-lg">{getStatusIcon(kpi.status)}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {kpi.value?.toLocaleString('de-DE', { maximumFractionDigits: 1 })}
                    <span className="text-sm text-slate-600 ml-1">{kpi.unit}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.trend === 'UP' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {kpi.trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    <span className="text-xs text-slate-600">{kpi.trend}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts */}
          {dashboard.alerts?.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Warnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.alerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-2 text-sm">
                    <span className={
                      alert.level === 'HIGH' ? 'text-red-600' :
                      alert.level === 'MEDIUM' ? 'text-yellow-600' :
                      'text-blue-600'
                    }>●</span>
                    <span className="text-red-900">{alert.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {dashboard.insights?.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Erkenntnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dashboard.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-blue-600">→</span>
                      <span className="text-slate-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => setDashboard(null)}
            variant="outline"
            className="w-full"
          >
            Neu laden
          </Button>
        </div>
      )}
    </div>
  );
}