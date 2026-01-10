import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function SmartAlerts() {
  const alerts = [
    { 
      id: 1, 
      type: 'critical', 
      title: 'Budget-Limit erreicht', 
      message: 'Wartungskosten bei 98% des Monatsbudgets',
      action: 'Budget anpassen'
    },
    { 
      id: 2, 
      type: 'warning', 
      title: 'Steuer-Deadline in 30 Tagen', 
      message: 'Einkommensteuererklärung fällig am 31.05.2026',
      action: 'Erklärung starten'
    },
    { 
      id: 3, 
      type: 'info', 
      title: 'Neue Dividenden-Zahlung', 
      message: '420€ von Siemens AG erhalten',
      action: 'Details ansehen'
    },
    { 
      id: 4, 
      type: 'success', 
      title: 'Sync abgeschlossen', 
      message: '24 neue Transaktionen importiert',
      action: 'Ansehen'
    }
  ];

  const getIcon = (type) => {
    if (type === 'critical') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (type === 'warning') return <Bell className="w-4 h-4 text-orange-600" />;
    if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const getBgColor = (type) => {
    if (type === 'critical') return 'bg-red-50 border-red-200';
    if (type === 'warning') return 'bg-orange-50 border-orange-200';
    if (type === 'success') return 'bg-green-50 border-green-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Smart-Alerts
          <Badge className="bg-red-600">{alerts.filter(a => a.type === 'critical' || a.type === 'warning').length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-3 rounded-lg border ${getBgColor(alert.type)}`}>
            <div className="flex items-start gap-2 mb-2">
              {getIcon(alert.type)}
              <div className="flex-1">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2">
              {alert.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}