import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Users, Building, Activity } from 'lucide-react';

export default function RecentActivitiesWidget() {
  const { data: recentDocuments = [] } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 5)
  });

  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-payments-activity'],
    queryFn: () => base44.entities.Payment.list('-created_date', 5)
  });

  const { data: recentTenants = [] } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: () => base44.entities.Tenant.list('-created_date', 5)
  });

  const activities = [
    ...recentDocuments.map(d => ({
      type: 'document',
      icon: FileText,
      title: d.name,
      time: d.created_date,
      color: 'text-blue-600'
    })),
    ...recentPayments.map(p => ({
      type: 'payment',
      icon: DollarSign,
      title: `Zahlung ${p.amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`,
      time: p.created_date,
      color: 'text-green-600'
    })),
    ...recentTenants.map(t => ({
      type: 'tenant',
      icon: Users,
      title: `Neuer Mieter: ${t.first_name} ${t.last_name}`,
      time: t.created_date,
      color: 'text-purple-600'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Gerade eben';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 48) return 'Gestern';
    return `vor ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 ${activity.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-slate-500">{getTimeAgo(activity.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine Aktivitäten
          </p>
        )}
      </CardContent>
    </Card>
  );
}