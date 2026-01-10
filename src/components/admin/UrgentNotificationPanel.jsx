import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle, MessageCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UrgentNotificationPanel() {
  const { data: urgentThreads = [] } = useQuery({
    queryKey: ['urgent-threads'],
    queryFn: async () => {
      const threads = await base44.entities.MessageThread.filter({ 
        priority: 'urgent',
        status: 'open'
      });
      return threads.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    refetchInterval: 10000
  });

  const { data: criticalIssues = [] } = useQuery({
    queryKey: ['critical-issues'],
    queryFn: async () => {
      const issues = await base44.entities.TenantIssueReport.filter({ 
        severity: 'critical',
        status: 'open'
      });
      return issues.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    refetchInterval: 10000
  });

  const { data: alarmSensors = [] } = useQuery({
    queryKey: ['alarm-sensors'],
    queryFn: () => base44.entities.IoTSensor.filter({ status: 'alarm' }),
    refetchInterval: 5000
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-for-notifications'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  const totalUrgent = urgentThreads.length + criticalIssues.length + alarmSensors.length;

  if (totalUrgent === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base text-red-900">Dringende Benachrichtigungen</CardTitle>
          </div>
          <Badge className="bg-red-600">{totalUrgent}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Urgent Messages */}
        {urgentThreads.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-900">Dringende Nachrichten ({urgentThreads.length})</p>
            </div>
            <div className="space-y-2">
              {urgentThreads.slice(0, 3).map(thread => (
                <div key={thread.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{thread.subject}</p>
                    <p className="text-xs text-slate-600">{getTenantName(thread.tenant_id)}</p>
                  </div>
                  <Link to={createPageUrl('AdminMessagingCenter')}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-900">Kritische Störungen ({criticalIssues.length})</p>
            </div>
            <div className="space-y-2">
              {criticalIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{issue.title}</p>
                    <p className="text-xs text-slate-600">{getTenantName(issue.tenant_id)}</p>
                  </div>
                  <Link to={createPageUrl('AdminIssueReports')}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensor Alarms */}
        {alarmSensors.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <p className="text-sm font-semibold text-red-900">Sensor-Alarme ({alarmSensors.length})</p>
            </div>
            <div className="space-y-2">
              {alarmSensors.slice(0, 3).map(sensor => (
                <div key={sensor.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{sensor.sensor_name}</p>
                    <p className="text-xs text-slate-600">{sensor.location} • {sensor.current_value}{sensor.unit}</p>
                  </div>
                  <Link to={createPageUrl('IoTSensorManagement')}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}