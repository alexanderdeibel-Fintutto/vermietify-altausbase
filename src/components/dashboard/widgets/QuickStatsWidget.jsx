import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, FileText, DollarSign } from 'lucide-react';

export default function QuickStatsWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const totalRevenue = financialItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const stats = [
    { label: 'Objekte', value: buildings.length, icon: Building2, color: 'text-blue-600' },
    { label: 'Verträge', value: contracts.length, icon: FileText, color: 'text-green-600' },
    { label: 'Umsatz', value: `${totalRevenue.toLocaleString('de-DE')}€`, icon: DollarSign, color: 'text-purple-600' }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center">
          <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
          <div className="text-xl font-bold">{stat.value}</div>
          <div className="text-xs text-slate-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}