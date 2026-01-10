import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle } from 'lucide-react';

export default function BudgetAlertManager() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['budgetAlerts'],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkBudgetAlerts', {});
      return response.data.alerts;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Budget-Warnungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{alert.category}</p>
                <p className="text-xs text-slate-600">{alert.message}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-orange-600">{alert.percentage}% überschritten</Badge>
                  <Badge variant="outline">{alert.amount}€</Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}