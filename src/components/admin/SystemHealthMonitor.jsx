import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function SystemHealthMonitor() {
  const services = [
    { name: 'Datenbank', status: 'healthy', uptime: '99.9%' },
    { name: 'API', status: 'healthy', uptime: '99.8%' },
    { name: 'E-Mail-Dienst', status: 'healthy', uptime: '100%' },
    { name: 'Backup-System', status: 'warning', uptime: '98.5%' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System-Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-center gap-3">
                {service.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-[var(--vf-success-500)]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[var(--vf-warning-500)]" />
                )}
                <span className="font-medium text-sm">{service.name}</span>
              </div>
              <span className="text-sm text-[var(--theme-text-muted)]">{service.uptime}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}