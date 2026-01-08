import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, AlertTriangle, Database, Zap, Lock } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function SystemHealthPage() {
  const systemStatus = [
    { name: 'Datenbank', status: 'healthy', uptime: '99.99%', icon: Database },
    { name: 'API Server', status: 'healthy', uptime: '99.98%', icon: Zap },
    { name: 'Authentication', status: 'healthy', uptime: '100%', icon: Lock },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'healthy': return <Badge className="bg-green-600">✓ Gesund</Badge>;
      case 'degraded': return <Badge className="bg-yellow-600">⚠ Beeinträchtigt</Badge>;
      case 'down': return <Badge className="bg-red-600">✗ Offline</Badge>;
      default: return <Badge>Unbekannt</Badge>;
    }
  };

  const stats = [
    { label: 'System Uptime', value: '99.98%' },
    { label: 'Response Zeit', value: '42ms' },
    { label: 'API Requests (heute)', value: '12.4K' },
    { label: 'Fehlerquote', value: '0.02%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Systemgesundheit</h1>
        <p className="text-slate-600 mt-1">Überwachen Sie den Status aller Systemkomponenten</p>
      </div>

      <QuickStats stats={stats} accentColor="cyan" />

      <div className="grid grid-cols-1 gap-6">
        {systemStatus.map((service, idx) => {
          const Icon = service.icon;
          return (
            <Card key={idx} className="border border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-slate-600" />
                  <CardTitle>{service.name}</CardTitle>
                </div>
                {getStatusBadge(service.status)}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Uptime</p>
                    <p className="text-2xl font-bold text-slate-900">{service.uptime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Letzter Check</p>
                    <p className="text-lg text-slate-900">Vor 2 Min.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Vorfälle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Keine kritischen Vorfälle in den letzten 30 Tagen</p>
        </CardContent>
      </Card>
    </div>
  );
}