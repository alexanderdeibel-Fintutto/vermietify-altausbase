import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, CreditCard, Home, BarChart3, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionCards() {
  const actions = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Neue Rechnung',
      link: createPageUrl('Invoices'),
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Neuer Mieter',
      link: createPageUrl('Tenants'),
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Mietvertrag',
      link: createPageUrl('LeaseContracts'),
      color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
    },
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Neues Gebäude',
      link: createPageUrl('Buildings'),
      color: 'bg-orange-50 border-orange-200 hover:border-orange-400'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'BK-Abrechnung',
      link: createPageUrl('OperatingCosts'),
      color: 'bg-red-50 border-red-200 hover:border-red-400'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Meter ablesen',
      link: createPageUrl('MeterDashboard'),
      color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {actions.map((action, idx) => (
        <Link key={idx} to={action.link}>
          <Card className={`border-2 transition-all cursor-pointer h-full ${action.color}`}>
            <CardContent className="p-4 flex flex-col items-center gap-2 h-full justify-center text-center">
              <div className="text-2xl">{action.icon}</div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}