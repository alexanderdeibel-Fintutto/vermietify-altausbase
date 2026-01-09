import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function SubNavigation({ mainSection, visibleFeatures = [] }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSection = (key) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedSections(newSet);
  };

  const subNavStructure = {
    finanzen: [
      { key: 'BankAccounts', label: 'Banking', level: 1, alwaysVisible: true },
      { key: 'Invoices', label: 'Rechnungen', level: 1, alwaysVisible: true },
      { key: 'FinancialItems', label: 'Buchungen', level: 1, alwaysVisible: true },
      { key: 'BankReconciliation', label: 'Kontoabgleich', level: 1, requiresFeature: 'reconciliation' },
      { key: 'Budgetierung', label: 'Budgetierung', level: 1, requiresFeature: 'budgetierung', badge: '🚧' },
      { key: 'ReportsPage', label: 'Auswertungen', level: 1, requiresFeature: 'auswertungen' },
    ],
    immobilien: [
      { key: 'Buildings', label: 'Gebäude', level: 1, alwaysVisible: true },
      { key: 'UnitsManagement', label: 'Einheiten', level: 1, requiresFeature: 'einheiten' },
      { key: 'zaehlerVerwaltung', label: 'Zählerverwaltung', level: 1, requiresFeature: 'zaehlerVerwaltung' },
      { key: 'InsuranceManagement', label: 'Versicherungen', level: 1, requiresFeature: 'versicherungen' },
      { key: 'PropertyValuation', label: 'Wertermittlung', level: 1, requiresFeature: 'wertermittlung', badge: '🚧' },
    ],
    mieter: [
      { key: 'Tenants', label: 'Mieter', level: 1, alwaysVisible: true },
      { key: 'Contracts', label: 'Mietverträge', level: 1, requiresFeature: 'vertraege' },
      { key: 'mieterKommunikation', label: 'Kommunikation', level: 1, requiresFeature: 'mieterKommunikation' },
      { key: 'OperatingCosts', label: 'Betriebskosten', level: 1, requiresFeature: 'betriebskostenabrechnung' },
      { key: 'TenantPortal', label: 'Mieter-Portal', level: 1, requiresFeature: 'tenantPortal', badge: '🚧' },
    ],
    steuer: [
      { key: 'TaxManagement', label: 'Steuerübersicht', level: 1, alwaysVisible: true },
      { key: 'TaxLibraryManagement', label: 'Steuer-Bibliothek', level: 1, alwaysVisible: true },
      { key: 'ElsterIntegration', label: 'ELSTER', level: 1, requiresFeature: 'elster' },
      { key: 'AnlageV', label: 'Anlage V', level: 1, requiresFeature: 'anlageV' },
    ]
  };

  const items = subNavStructure[mainSection] || [];
  const visibleItems = items.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.requiresFeature) {
      return visibleFeatures.includes(item.requiresFeature);
    }
    return true;
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-2">
      <div className="flex items-center gap-4 overflow-x-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === createPageUrl(item.key);
          const isLocked = !item.alwaysVisible && !visibleFeatures.includes(item.requiresFeature || item.key);
          
          return (
            <Link
              key={item.key}
              to={createPageUrl(item.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
                isLocked && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              {isLocked && <Lock className="w-3 h-3" />}
              {item.label}
              {item.badge && <Badge variant="outline" className="ml-1 text-xs">{item.badge}</Badge>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}