import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign } from 'lucide-react';

export default function WhiteLabelSaaS() {
  const { data: instances = [] } = useQuery({
    queryKey: ['white-label-instances'],
    queryFn: () => base44.entities.WhiteLabelInstance.list()
  });

  const activeInstances = instances.filter(i => i.active);
  const totalRevenue = instances.reduce((sum, i) => sum + (i.monthly_revenue_share || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">White-Label SaaS</h1>
          <p className="text-slate-600">Steuerberater-Partnerprogramm</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{activeInstances.length}</div>
            <p className="text-sm text-slate-600">Aktive Partner</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">€{totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-slate-600">Monatliche Einnahmen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {instances.reduce((sum, i) => sum + (i.users_count || 0), 0)}
            </div>
            <p className="text-sm text-slate-600">Gesamt-Nutzer</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {instances.map(instance => (
          <Card key={instance.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{instance.account_holder}</p>
                  <p className="text-sm text-slate-600">{instance.domain}</p>
                </div>
                <Badge className={instance.active ? 'bg-green-100 text-green-800' : ''}>
                  {instance.subscription_tier}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 flex items-center gap-1"><Users className="w-3 h-3" /> Nutzer</p>
                  <p className="font-bold">{instance.users_count}</p>
                </div>
                <div>
                  <p className="text-slate-600 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Monatlich</p>
                  <p className="font-bold">€{instance.monthly_revenue_share}</p>
                </div>
                <div>
                  <p className="text-slate-600">Bis</p>
                  <p className="font-bold">{new Date(instance.contract_until).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}