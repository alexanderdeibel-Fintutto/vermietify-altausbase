import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, Wrench, Users, MessageSquare } from 'lucide-react';

export default function QuickStats({ buildingId }) {
  const { data: stats } = useQuery({
    queryKey: ['quickStats', buildingId],
    queryFn: async () => {
      const meters = await base44.entities.Meter.filter(
        buildingId ? { building_id: buildingId } : {},
        null,
        500
      );
      
      const tasks = await base44.entities.BuildingTask.filter(
        buildingId 
          ? { building_id: buildingId, status: { $in: ['open', 'assigned', 'in_progress'] } }
          : { status: { $in: ['open', 'assigned', 'in_progress'] } },
        null,
        100
      );

      const tenants = await base44.entities.Tenant.filter(
        { status: 'active' },
        null,
        100
      );

      const messages = await base44.entities.TenantMessage.filter(
        { is_read: false },
        '-created_date',
        50
      );

      const metersNeedReading = meters.filter(m => {
        if (!m.last_reading_date) return true;
        const daysSince = (new Date() - new Date(m.last_reading_date)) / (1000 * 60 * 60 * 24);
        return daysSince > 90;
      });

      return {
        metersNeedReading: metersNeedReading.length,
        totalMeters: meters.length,
        openTasks: tasks.length,
        activeTenants: tenants.length,
        unreadMessages: messages.length
      };
    }
  });

  const statCards = [
    {
      icon: Camera,
      label: 'Zähler fällig',
      value: stats?.metersNeedReading || 0,
      total: stats?.totalMeters || 0,
      color: 'bg-orange-50 border-orange-200 text-orange-600'
    },
    {
      icon: Wrench,
      label: 'Offene Tasks',
      value: stats?.openTasks || 0,
      color: 'bg-blue-50 border-blue-200 text-blue-600'
    },
    {
      icon: Users,
      label: 'Aktive Mieter',
      value: stats?.activeTenants || 0,
      color: 'bg-green-50 border-green-200 text-green-600'
    },
    {
      icon: MessageSquare,
      label: 'Neue Nachrichten',
      value: stats?.unreadMessages || 0,
      color: 'bg-purple-50 border-purple-200 text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statCards.map((stat, idx) => (
        <Card key={idx} className={`border-2 ${stat.color}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" />
              <p className="text-xs font-semibold">{stat.label}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.total && (
                <p className="text-xs text-slate-600">/{stat.total}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}