import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Zap, CheckCircle, Clock, 
  AlertTriangle, TrendingUp, Server 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RealTimeStatusMonitor() {
  const [stats, setStats] = useState({
    active_processes: 0,
    queue_length: 0,
    avg_response_time: 0,
    success_rate: 100,
    last_sync: new Date()
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        active_processes: Math.floor(Math.random() * 5),
        queue_length: Math.floor(Math.random() * 10),
        avg_response_time: Math.floor(Math.random() * 500) + 200,
        success_rate: 95 + Math.floor(Math.random() * 5),
        last_sync: new Date()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusIndicators = [
    {
      label: 'ELSTER-Verbindung',
      status: 'online',
      icon: Server,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Verarbeitungs-Queue',
      value: stats.queue_length,
      icon: Clock,
      color: stats.queue_length > 5 ? 'text-yellow-600' : 'text-blue-600',
      bg: stats.queue_length > 5 ? 'bg-yellow-50' : 'bg-blue-50'
    },
    {
      label: 'Aktive Prozesse',
      value: stats.active_processes,
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Ø Antwortzeit',
      value: `${stats.avg_response_time}ms`,
      icon: TrendingUp,
      color: stats.avg_response_time < 500 ? 'text-green-600' : 'text-yellow-600',
      bg: stats.avg_response_time < 500 ? 'bg-green-50' : 'bg-yellow-50'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Echtzeit-Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-600">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Rate */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Erfolgsrate (24h)</span>
            <span className="text-2xl font-bold text-green-700">
              {stats.success_rate}%
            </span>
          </div>
          <Progress value={stats.success_rate} className="h-2" />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {statusIndicators.map((indicator, idx) => {
            const Icon = indicator.icon;
            return (
              <div key={idx} className={`p-3 ${indicator.bg} border border-slate-200 rounded-lg`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${indicator.color}`} />
                  <span className="text-xs text-slate-700">{indicator.label}</span>
                </div>
                <div className={`text-lg font-bold ${indicator.color}`}>
                  {indicator.value || indicator.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Update */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t">
          Letzte Aktualisierung: {stats.last_sync.toLocaleTimeString('de-DE')}
        </div>
      </CardContent>
    </Card>
  );
}