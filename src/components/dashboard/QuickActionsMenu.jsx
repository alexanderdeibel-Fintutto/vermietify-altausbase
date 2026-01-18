import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Users, Building2, Calculator, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionsMenu() {
  const actions = [
    { icon: Building2, label: 'Objekt', page: 'Buildings', color: 'text-blue-600' },
    { icon: Users, label: 'Mieter', page: 'Tenants', color: 'text-green-600' },
    { icon: FileText, label: 'Vertrag', page: 'Contracts', color: 'text-purple-600' },
    { icon: FileSpreadsheet, label: 'Rechnung', page: 'Invoices', color: 'text-orange-600' },
    { icon: Calculator, label: 'BK-Abrechnung', page: 'OperatingCosts', color: 'text-indigo-600' }
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {actions.map((action, index) => (
        <Link key={index} to={createPageUrl(action.page)}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full bg-[var(--theme-surface)] flex items-center justify-center mb-2 ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}