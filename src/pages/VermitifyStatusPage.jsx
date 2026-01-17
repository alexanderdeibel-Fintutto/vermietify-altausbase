import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function VermitifyStatusPage() {
  const services = [
    { name: 'Web App', status: 'operational', uptime: '99.98%' },
    { name: 'API', status: 'operational', uptime: '99.95%' },
    { name: 'Datenbank', status: 'operational', uptime: '100%' },
    { name: 'ELSTER-Integration', status: 'operational', uptime: '99.90%' },
    { name: 'LetterXpress', status: 'operational', uptime: '99.85%' },
    { name: 'E-Mail-Versand', status: 'operational', uptime: '99.99%' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">vermitify Status</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--vf-success-100)] text-[var(--vf-success-700)] rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Alle Systeme betriebsbereit</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 bg-[var(--theme-surface)] rounded-lg">
                  <div className="flex items-center gap-3">
                    {service.status === 'operational' ? (
                      <CheckCircle className="h-5 w-5 text-[var(--vf-success-500)]" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-[var(--vf-error-500)]" />
                    )}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--vf-success-600)]">
                      {service.status === 'operational' ? 'Betriebsbereit' : 'Störung'}
                    </div>
                    <div className="text-xs text-[var(--theme-text-muted)]">
                      Uptime: {service.uptime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-[var(--theme-text-muted)]">
          Letzte Aktualisierung: {new Date().toLocaleString('de-DE')}
        </div>
      </div>
    </div>
  );
}