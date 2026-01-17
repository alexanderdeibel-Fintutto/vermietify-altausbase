import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function RecentActivityWidget({ limit = 10 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent entities changes
      const buildings = await base44.entities.Building.list('-updated_date', 3);
      const tenants = await base44.entities.Tenant.list('-updated_date', 3);
      const contracts = await base44.entities.LeaseContract.list('-updated_date', 3);
      const invoices = await base44.entities.Invoice.list('-updated_date', 3);

      const all = [
        ...buildings.map(b => ({ type: 'building', entity: b, text: `Objekt "${b.name}" aktualisiert` })),
        ...tenants.map(t => ({ type: 'tenant', entity: t, text: `Mieter "${t.name}" aktualisiert` })),
        ...contracts.map(c => ({ type: 'contract', entity: c, text: `Vertrag aktualisiert` })),
        ...invoices.map(i => ({ type: 'invoice', entity: i, text: `Rechnung erstellt` }))
      ];

      return all
        .sort((a, b) => new Date(b.entity.updated_date) - new Date(a.entity.updated_date))
        .slice(0, limit);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-muted)] text-center py-4">
            Keine Aktivitäten
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-[var(--vf-primary-500)] mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[var(--theme-text-primary)]">{activity.text}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    {new Date(activity.entity.updated_date).toLocaleString('de-DE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}