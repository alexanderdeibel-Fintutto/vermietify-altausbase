import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function DeepSubNavigation({ parentSection, currentPage, visibleFeatures = [] }) {
  const location = useLocation();

  // Level 3+ navigation based on current page context
  const deepNavStructure = {
    BankAccounts: [
      { key: 'BankAccounts', label: 'Übersicht', level: 3 },
      { key: 'BankReconciliation', label: 'Kontoabgleich', level: 3, requiresFeature: 'reconciliation' },
      { key: 'BankingManagement', label: 'Banking-Tools', level: 3, requiresFeature: 'bankingTools', badge: '🚧' },
    ],
    Invoices: [
      { key: 'Invoices', label: 'Übersicht', level: 3 },
      { key: 'InvoiceManagement', label: 'Verwaltung', level: 3, requiresFeature: 'invoiceManagement' },
      { key: 'DocumentGeneration', label: 'Dokumentenerstellung', level: 3, requiresFeature: 'documentGeneration', badge: '🚧' },
    ],
    Buildings: [
      { key: 'Buildings', label: 'Übersicht', level: 3 },
      { key: 'PropertyPortfolio', label: 'Portfolio', level: 3, requiresFeature: 'portfolioAnalytics' },
      { key: 'PropertyValuation', label: 'Wertermittlung', level: 3, requiresFeature: 'wertermittlung', badge: '🚧' },
    ],
    Tenants: [
      { key: 'Tenants', label: 'Übersicht', level: 3 },
      { key: 'TenantCommunication', label: 'Kommunikation', level: 3, requiresFeature: 'mieterKommunikation' },
      { key: 'TenantPortal', label: 'Mieter-Portal', level: 3, requiresFeature: 'tenantPortal', badge: '🚧' },
    ],
    TaxManagement: [
      { key: 'TaxManagement', label: 'Übersicht', level: 3 },
      { key: 'TaxLibraryManagement', label: 'Steuer-Bibliothek', level: 3 },
      { key: 'ElsterIntegration', label: 'ELSTER', level: 3, requiresFeature: 'elster' },
    ]
  };

  const items = deepNavStructure[currentPage] || [];
  const visibleItems = items.filter(item => {
    if (item.level <= 3) return true;
    if (item.requiresFeature) return visibleFeatures.includes(item.requiresFeature);
    return true;
  });

  if (visibleItems.length <= 1) return null;

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 lg:px-8 py-2">
      <div className="flex items-center gap-2 text-sm">
        {visibleItems.map((item, idx) => {
          const isActive = location.pathname === createPageUrl(item.key);
          const isLocked = item.requiresFeature && !visibleFeatures.includes(item.requiresFeature);
          
          return (
            <React.Fragment key={item.key}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              <Link
                to={createPageUrl(item.key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded transition-colors whitespace-nowrap",
                  isActive ? "text-indigo-700 font-medium" : "text-slate-600 hover:text-slate-900",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => isLocked && e.preventDefault()}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {item.label}
                {item.badge && <Badge variant="outline" className="ml-1 text-xs">{item.badge}</Badge>}
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}