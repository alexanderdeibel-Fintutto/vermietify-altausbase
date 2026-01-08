import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database, Users, Key } from 'lucide-react';

export default function SystemHealth() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: healthData, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSystemHealth', {});
      return response.data;
    },
    refetchInterval: 30000
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  if (!healthData) {
    return <div className="flex items-center justify-center h-screen">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
          <p className="text-slate-600">Überwachung der Systemgesundheit</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt-Status</p>
                <Badge className={
                  healthData.overallStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                  healthData.overallStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {healthData.overallStatus}
                </Badge>
              </div>
              {getStatusIcon(healthData.overallStatus)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Benutzer</p>
                <p className="text-2xl font-bold">{healthData.metrics?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Entities</p>
                <p className="text-2xl font-bold">{healthData.metrics?.totalEntities || 0}</p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">API-Keys</p>
                <p className="text-2xl font-bold">{healthData.metrics?.totalApiKeys || 0}</p>
              </div>
              <Key className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.services?.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.message && (
                        <div className="text-sm text-slate-600">{service.message}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Systemmetriken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Aktive Rollen</span>
                <span className="font-bold">{healthData.metrics?.activeRoles || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Permissions</span>
                <span className="font-bold">{healthData.metrics?.totalPermissions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Aktive Module</span>
                <span className="font-bold">{healthData.metrics?.activeModules || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Test-Sessions (24h)</span>
                <span className="font-bold">{healthData.metrics?.testSessions24h || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">User-Activity (24h)</span>
                <span className="font-bold">{healthData.metrics?.userActivity24h || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Prüfung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            {new Date(healthData.timestamp).toLocaleString('de-DE')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}