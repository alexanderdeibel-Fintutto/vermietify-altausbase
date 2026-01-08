import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SmartNotificationCenter() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['elster-notifications'],
    queryFn: async () => {
      // Simulierte Benachrichtigungen - in Produktion aus DB laden
      return [
        {
          id: 1,
          type: 'deadline',
          severity: 'high',
          message: 'Steuerklärung 2024 - Frist endet in 14 Tagen',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          type: 'validation',
          severity: 'medium',
          message: '3 Submissions benötigen Überprüfung',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          type: 'success',
          severity: 'low',
          message: 'Backup erfolgreich erstellt',
          created_at: new Date().toISOString()
        }
      ];
    },
    refetchInterval: 30000 // Alle 30 Sekunden
  });

  const iconMap = {
    deadline: AlertTriangle,
    validation: Info,
    success: CheckCircle
  };

  const colorMap = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungen
          </CardTitle>
          <Badge>{notifications.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">
            Keine neuen Benachrichtigungen
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const Icon = iconMap[notif.type] || Info;
              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg ${colorMap[notif.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{notif.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(notif.created_at).toLocaleString('de-DE')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}