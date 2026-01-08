import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function AlertManagementPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Memory-Auslastung hoch', severity: 'high', timestamp: 'Vor 2 Minuten', status: 'active' },
    { id: 2, title: 'Backup fehlgeschlagen', severity: 'critical', timestamp: 'Vor 15 Minuten', status: 'active' },
    { id: 3, title: 'Ungewöhnliche Anmeldeversuche', severity: 'medium', timestamp: 'Vor 1 Stunde', status: 'active' },
    { id: 4, title: 'API Response Zeit erhöht', severity: 'low', timestamp: 'Vor 3 Stunden', status: 'resolved' },
  ]);

  const dismissAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🔔 Alert Management</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Systemwarnungen und Benachrichtigungen</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Aktive Alerts: {alerts.filter(a => a.status === 'active').length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className={`border ${alert.status === 'active' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {alert.status === 'active' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-600">{alert.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  {alert.status === 'active' && (
                    <Button size="icon" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                      <X className="w-4 h-4 text-slate-600" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}