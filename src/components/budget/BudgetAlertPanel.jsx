import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

export default function BudgetAlertPanel() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['budgetAlerts'],
    queryFn: async () => {
      try {
        return await base44.entities.Notification.filter(
          { 
            notification_type: ['budget_exceeded', 'budget_warning'],
            is_read: false
          },
          '-created_at',
          10
        );
      } catch {
        return [];
      }
    },
    refetchInterval: 60000
  });

  const alerts = notifications || [];
  const highSeverity = alerts.filter(a => a.severity === 'high').length;
  const mediumSeverity = alerts.filter(a => a.severity === 'medium').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-sm text-green-900">Budget-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">✓ Alle Budgets im grünen Bereich</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Budget-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {highSeverity > 0 && (
            <Badge className="bg-red-100 text-red-800 justify-center">
              {highSeverity} Überschreitungen
            </Badge>
          )}
          {mediumSeverity > 0 && (
            <Badge className="bg-amber-100 text-amber-800 justify-center">
              {mediumSeverity} Warnungen
            </Badge>
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              className={
                alert.severity === 'high'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50'
              }
            >
              <div className="flex gap-2">
                {alert.severity === 'high' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <AlertDescription className="text-xs">
                  <p className="font-semibold mb-1">
                    {alert.severity === 'high' ? '🚨 Budget überschritten' : '⏱️ Budget-Warnung'}
                  </p>
                  <p className="text-slate-700">{alert.message}</p>
                  <p className="text-slate-600 mt-1 text-xs">
                    {new Date(alert.created_at).toLocaleDateString('de-DE')} um{' '}
                    {new Date(alert.created_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}