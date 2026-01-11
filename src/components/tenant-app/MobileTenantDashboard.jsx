import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Key, MessageSquare, FileText, Wrench, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MobileTenantDashboard({ tenantId, companyId }) {
  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', tenantId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ tenant_id: tenantId, status: 'active' });
      return contracts[0];
    }
  });

  const { data: openTasks } = useQuery({
    queryKey: ['tenant-tasks', tenantId],
    queryFn: async () => {
      const tasks = await base44.entities.MaintenanceTask.filter({ tenant_id: tenantId, status: 'open' });
      return tasks;
    }
  });

  const quickActions = [
    { icon: Key, label: 'Digitaler Schlüssel', path: 'TenantDigitalKey', color: 'bg-blue-500' },
    { icon: MessageSquare, label: 'Nachrichten', path: 'TenantMessages', color: 'bg-green-500', badge: '2' },
    { icon: FileText, label: 'Dokumente', path: 'TenantDocuments', color: 'bg-purple-500' },
    { icon: Wrench, label: 'Wartung melden', path: 'TenantMaintenance', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Meine Wohnung</h2>
              <p className="text-sm text-slate-300">{contract?.unit_id?.substring(0, 12)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Miete</p>
              <p className="font-bold">{contract?.monthly_rent}€</p>
            </div>
            <div>
              <p className="text-slate-400">Vertrag bis</p>
              <p className="font-bold">{contract?.end_date}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, i) => (
          <Link key={i} to={createPageUrl(action.path)}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2 relative`}>
                  <action.icon className="w-6 h-6 text-white" />
                  {action.badge && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Notifications */}
      {openTasks && openTasks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Offene Aufgaben</span>
              <Badge>{openTasks.length}</Badge>
            </div>
            <div className="space-y-1">
              {openTasks.slice(0, 3).map(task => (
                <div key={task.id} className="text-xs text-slate-600 p-2 bg-slate-50 rounded">
                  {task.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}