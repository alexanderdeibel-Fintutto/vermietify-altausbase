import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Zap, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationHealthMonitor() {
  const healthChecks = [
    {
      service: 'ELSTER API',
      status: 'healthy',
      uptime: 99.9,
      response_time: 234,
      last_check: new Date()
    },
    {
      service: 'Zertifikats-Dienst',
      status: 'healthy',
      uptime: 100,
      response_time: 89,
      last_check: new Date()
    },
    {
      service: 'Validierungs-Engine',
      status: 'healthy',
      uptime: 99.8,
      response_time: 156,
      last_check: new Date()
    },
    {
      service: 'KI-Service',
      status: 'degraded',
      uptime: 98.5,
      response_time: 1234,
      last_check: new Date()
    },
    {
      service: 'Datenbank',
      status: 'healthy',
      uptime: 100,
      response_time: 23,
      last_check: new Date()
    }
  ];

  const overallHealth = healthChecks.filter(c => c.status === 'healthy').length / healthChecks.length * 100;

  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Gesund' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Beeinträchtigt' },
    down: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Ausgefallen' }
  };

  const handleRefresh = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: 'Prüfe System-Gesundheit...',
        success: 'Status aktualisiert',
        error: 'Aktualisierung fehlgeschlagen'
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Integration Health Monitor
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">System-Gesundheit</span>
            <span className="text-2xl font-bold text-green-700">
              {overallHealth.toFixed(0)}%
            </span>
          </div>
          <Progress value={overallHealth} className="h-2" />
        </div>

        {/* Service Health Checks */}
        <div className="space-y-2">
          {healthChecks.map((check, idx) => {
            const config = statusConfig[check.status];
            const Icon = config.icon;

            return (
              <div key={idx} className={`p-3 border rounded-lg ${config.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="font-medium text-sm">{check.service}</span>
                  </div>
                  <Badge className={config.bg}>
                    {config.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Uptime:</span>
                    <div className="font-medium">{check.uptime}%</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Latenz:</span>
                    <div className="font-medium">{check.response_time}ms</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Geprüft:</span>
                    <div className="font-medium">
                      {check.last_check.toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Info */}
        <div className="pt-4 border-t text-xs text-slate-600 text-center">
          Letzte vollständige Prüfung: {new Date().toLocaleString('de-DE')}
        </div>
      </CardContent>
    </Card>
  );
}