import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertTriangle, AlertCircle, Activity, Database, Zap } from 'lucide-react';

export default function SystemHealthDashboard() {
  const { data: health } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      return await base44.functions.invoke('systemHealthMonitor', {});
    },
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  if (!health?.data) {
    return <div className="text-sm text-slate-600 font-light">Lädt...</div>;
  }

  const h = health.data;
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'down':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-orange-50 border-orange-200';
      case 'down':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System-Status
          </CardTitle>
          <Badge className={h.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                             h.status === 'degraded' ? 'bg-orange-100 text-orange-800' : 
                             'bg-red-100 text-red-800'}>
            {h.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900">Komponenten</h4>
          {Object.entries(h.components || {}).map(([component, status]) => (
            <div key={component} className={`flex items-center justify-between p-3 rounded border ${getStatusColor(status)}`}>
              <div className="flex items-center gap-2">
                {component === 'database' && <Database className="h-4 w-4" />}
                {component.includes('finance') && <Zap className="h-4 w-4" />}
                <span className="text-sm capitalize">{component.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-xs capitalize">{status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        {h.metrics && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded">
            {Object.entries(h.metrics).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-lg font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {h.alerts && h.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Warnungen</h4>
            {h.alerts.map((alert, idx) => (
              <Alert key={idx} className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-sm">{alert}</AlertTitle>
              </Alert>
            ))}
          </div>
        )}

        {/* Last Update */}
        <p className="text-xs text-slate-500 text-right">
          Aktualisiert: {new Date(h.timestamp).toLocaleString('de-DE')}
        </p>
      </CardContent>
    </Card>
  );
}