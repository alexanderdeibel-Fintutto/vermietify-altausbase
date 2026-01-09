import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Building2, DollarSign, Calculator } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function QuickActions({ visibleFeatures = [] }) {
  const navigate = useNavigate();

  const actions = [
    { key: 'newBuilding', label: 'Neues Gebäude', icon: Building2, page: 'Buildings', requiresFeature: 'immobilien' },
    { key: 'newTenant', label: 'Neuer Mieter', icon: Users, page: 'Tenants', requiresFeature: 'mieter' },
    { key: 'newInvoice', label: 'Neue Rechnung', icon: FileText, page: 'Invoices' },
    { key: 'newTransaction', label: 'Neue Buchung', icon: DollarSign, page: 'FinancialItems' },
    { key: 'newContract', label: 'Neuer Vertrag', icon: FileText, page: 'Contracts', requiresFeature: 'vertraege' },
    { key: 'operatingCosts', label: 'Nebenkostenabrechnung', icon: Calculator, page: 'OperatingCosts', requiresFeature: 'betriebskostenabrechnung' },
  ];

  const visibleActions = actions.filter(action => 
    !action.requiresFeature || visibleFeatures.includes(action.requiresFeature)
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Neu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {visibleActions.map((action, idx) => {
          const Icon = action.icon;
          const needsSeparator = idx === 2 || idx === 4;
          
          return (
            <React.Fragment key={action.key}>
              {needsSeparator && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => navigate(createPageUrl(action.page))}>
                <Icon className="w-4 h-4 mr-2" />
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}