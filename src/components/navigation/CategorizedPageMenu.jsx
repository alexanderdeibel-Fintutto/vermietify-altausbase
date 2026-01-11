import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, FileText, Home, DollarSign, Users, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIZED_PAGES = {
  dokumente: {
    icon: FileText,
    label: 'Dokumente',
    color: 'text-blue-600',
    pages: [
      { name: 'Documents', label: 'Dokumente Übersicht' },
      { name: 'DocumentTemplateManager', label: 'Template Manager' },
      { name: 'DocumentManagement', label: 'Dokumentenverwaltung' },
      { name: 'DocumentSearch', label: 'Dokument Suche' },
      { name: 'DocumentInbox', label: 'Dokumenteingang' },
    ]
  },
  immobilien: {
    icon: Home,
    label: 'Immobilien',
    color: 'text-green-600',
    pages: [
      { name: 'Buildings', label: 'Gebäude' },
      { name: 'BuildingDetail', label: 'Gebäude Details' },
      { name: 'Units', label: 'Einheiten' },
      { name: 'BuildingsMap', label: 'Gebäude Karte' },
    ]
  },
  finanzen: {
    icon: DollarSign,
    label: 'Finanzen',
    color: 'text-amber-600',
    pages: [
      { name: 'FinanceManagement', label: 'Finanzmanagement' },
      { name: 'Invoices', label: 'Rechnungen' },
      { name: 'BankAccounts', label: 'Bankkonten' },
      { name: 'Payments', label: 'Zahlungen' },
      { name: 'OperatingCostsManagement', label: 'Betriebskosten' },
    ]
  },
  mieter: {
    icon: Users,
    label: 'Mieter & Verträge',
    color: 'text-purple-600',
    pages: [
      { name: 'Tenants', label: 'Mieter' },
      { name: 'TenantDetail', label: 'Mieter Details' },
      { name: 'LeaseContracts', label: 'Mietverträge' },
      { name: 'Contracts', label: 'Verträge' },
    ]
  },
  aufgaben: {
    icon: CheckSquare,
    label: 'Aufgaben & Wartung',
    color: 'text-red-600',
    pages: [
      { name: 'Tasks', label: 'Aufgaben' },
      { name: 'MaintenanceTasks', label: 'Wartungsaufgaben' },
      { name: 'MaintenanceManager', label: 'Wartungsmanagement' },
    ]
  }
};

export default function CategorizedPageMenu() {
  const [expandedCategory, setExpandedCategory] = useState('dokumente');

  return (
    <div className="w-full space-y-2">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Navigation
      </div>
      
      {Object.entries(CATEGORIZED_PAGES).map(([key, category]) => {
        const Icon = category.icon;
        const isExpanded = expandedCategory === key;
        
        return (
          <div key={key} className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategory(isExpanded ? null : key)}
              className="w-full justify-start text-sm font-medium hover:bg-slate-100"
            >
              <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
              <span className="flex-1 text-left">{category.label}</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
            
            {isExpanded && (
              <div className="pl-6 space-y-1 border-l border-slate-200">
                {category.pages.map(page => (
                  <Link
                    key={page.name}
                    to={createPageUrl(page.name)}
                    className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors"
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}