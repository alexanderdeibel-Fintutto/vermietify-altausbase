import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function SystemHealthWidget() {
  const services = [
    { name: 'Database', status: 'healthy', latency: '12ms' },
    { name: 'API', status: 'healthy', latency: '45ms' },
    { name: 'ELSTER', status: 'healthy', latency: '230ms' },
    { name: 'LetterXpress', status: 'healthy', latency: '156ms' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {service.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[var(--vf-error-500)]" />
                )}
                <span className="text-sm">{service.name}</span>
              </div>
              <span className="text-xs text-[var(--theme-text-muted)]">{service.latency}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}