import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, DollarSign, FileText } from 'lucide-react';

export default function QuickStatsWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-count'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-count'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-month'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const all = await base44.entities.Payment.list('-date', 500);
      return all.filter(p => new Date(p.date) >= firstDay);
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents-count'],
    queryFn: () => base44.entities.Document.list()
  });

  const monthlyRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    {
      label: 'Gebäude',
      value: buildings.length,
      icon: Building,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Mieter',
      value: tenants.length,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Einnahmen (Monat)',
      value: monthlyRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Dokumente',
      value: documents.length,
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}