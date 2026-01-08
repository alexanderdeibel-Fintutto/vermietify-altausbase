import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SystemHealthCheck() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('checkElsterSystemHealth', {});
      if (response.data.success) {
        setHealth(response.data.health);
        toast.success('Health-Check abgeschlossen');
      }
    } catch (error) {
      toast.error('Health-Check fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Activity;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health Check
          </CardTitle>
          <Button onClick={runHealthCheck} disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Prüfen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!health ? (
          <div className="text-center py-8 text-slate-600">
            Klicken Sie auf "Prüfen" um einen System-Health-Check durchzuführen
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className={getStatusBg(health.status)}>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  {React.createElement(getStatusIcon(health.status), {
                    className: `w-5 h-5 ${getStatusColor(health.status)}`
                  })}
                  <span className="font-medium">
                    System-Status: {health.status === 'healthy' ? 'Gesund' : 
                                    health.status === 'warning' ? 'Warnung' : 'Kritisch'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Geprüft: {new Date(health.timestamp).toLocaleString('de-DE')}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {Object.entries(health.checks).map(([key, check]) => {
                const Icon = getStatusIcon(check.status);
                return (
                  <div key={key} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 ${getStatusColor(check.status)}`} />
                      <div>
                        <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-slate-600">{check.message}</div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={getStatusColor(check.status)}
                    >
                      {check.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}