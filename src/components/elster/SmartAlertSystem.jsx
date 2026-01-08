import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, AlertTriangle, Calendar, CheckCircle, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartAlertSystem() {
  const [alerts, setAlerts] = useState([
    {
      id: 'deadline',
      name: 'Fristen-Erinnerung',
      description: '7 Tage vor Abgabefrist',
      icon: Calendar,
      enabled: true,
      channels: ['email', 'app']
    },
    {
      id: 'validation',
      name: 'Validierungs-Fehler',
      description: 'Bei kritischen Fehlern',
      icon: AlertTriangle,
      enabled: true,
      channels: ['email', 'app']
    },
    {
      id: 'submission',
      name: 'Einreichungs-Status',
      description: 'ELSTER Rückmeldung',
      icon: CheckCircle,
      enabled: true,
      channels: ['email']
    },
    {
      id: 'certificate',
      name: 'Zertifikat läuft ab',
      description: '30 Tage vor Ablauf',
      icon: Bell,
      enabled: true,
      channels: ['email', 'app']
    }
  ]);

  const toggleAlert = (alertId) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ));
    toast.success('Benachrichtigungen aktualisiert');
  };

  const recentAlerts = [
    {
      type: 'warning',
      message: 'Anlage V Frist in 5 Tagen',
      time: '2 Stunden'
    },
    {
      type: 'success',
      message: 'Einreichung akzeptiert',
      time: '1 Tag'
    },
    {
      type: 'info',
      message: 'Neue Formular-Version verfügbar',
      time: '2 Tage'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Smart Alert System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Settings */}
        <div className="space-y-3">
          {alerts.map(alert => {
            const Icon = alert.icon;
            return (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${alert.enabled ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-medium text-sm">{alert.name}</div>
                    <div className="text-xs text-slate-600">{alert.description}</div>
                    <div className="flex gap-1 mt-1">
                      {alert.channels.map(ch => (
                        <Badge key={ch} variant="outline" className="text-xs">
                          {ch === 'email' && <Mail className="w-3 h-3 mr-1" />}
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={alert.enabled}
                  onCheckedChange={() => toggleAlert(alert.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Recent Alerts */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Letzte Benachrichtigungen</div>
          <div className="space-y-2">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {alert.type === 'info' && <Bell className="w-4 h-4 text-blue-600" />}
                <span className="flex-1">{alert.message}</span>
                <span className="text-xs text-slate-500">vor {alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}