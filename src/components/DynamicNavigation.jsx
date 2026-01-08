import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

// Module zu Navigation Item Mapping
const NAVIGATION_MODULES = {
  'objekte': { name: '🏠 Objekte', page: 'Buildings' },
  'mieter': { name: '👥 Mieter', page: 'Contracts' },
  'vertraege': { name: '📋 Verträge & Kosten', page: 'Contracts' },
  'finanzen': { name: '💰 Finanzen', page: 'Finanzen' },
  'banking': { name: '🏦 Banking', page: 'BankAccounts' },
  'steuer': { name: '📈 Steuern', page: 'TaxForms' },
  'betriebskosten': { name: '📊 Betriebskosten', page: 'OperatingCosts' },
  'dokumentation': { name: '📄 Dokumente', page: 'Documents' },
  'kommunikation': { name: '📧 Kommunikation', page: 'Kommunikation' },
  'aufgaben': { name: '✅ Aufgaben', page: 'Tasks' }
};

const BASE_NAVIGATION = [
  { name: '📊 Dashboard', href: createPageUrl('Dashboard'), page: 'Dashboard' },
  { 
    name: 'Verwaltung',
    items: [
      { module: 'objekte', ...NAVIGATION_MODULES['objekte'] },
      { module: 'mieter', ...NAVIGATION_MODULES['mieter'] },
      { module: 'vertraege', ...NAVIGATION_MODULES['vertraege'] },
      { module: 'betriebskosten', ...NAVIGATION_MODULES['betriebskosten'] }
    ]
  },
  {
    name: 'Finanzen & Steuern',
    items: [
      { module: 'finanzen', ...NAVIGATION_MODULES['finanzen'] },
      { module: 'banking', ...NAVIGATION_MODULES['banking'] },
      { module: 'steuer', ...NAVIGATION_MODULES['steuer'] }
    ]
  },
  {
    name: 'Add-ons',
    items: [
      { module: 'dokumentation', ...NAVIGATION_MODULES['dokumentation'] },
      { module: 'kommunikation', ...NAVIGATION_MODULES['kommunikation'] },
      { module: 'aufgaben', ...NAVIGATION_MODULES['aufgaben'] }
    ]
  }
];

export function DynamicNavigation({ currentPageName, onNavigate }) {
  const { hasModuleAccess } = usePackageAccess();

  return (
    <nav className="p-4 space-y-1">
      {BASE_NAVIGATION.map((section, idx) => {
        // Wenn Section Items hat, filtere nach Modul-Zugriff
        if (section.items) {
          const visibleItems = section.items.filter(item => hasModuleAccess(item.module));
          
          if (visibleItems.length === 0) return null; // Ganze Section verstecken wenn kein Zugriff

          return (
            <div key={idx} className="py-2">
              <p className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {section.name}
              </p>
              {visibleItems.map(item => (
                <Link
                  key={item.module}
                  to={createPageUrl(item.page)}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    currentPageName === item.page
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {item.name}
                  {currentPageName === item.page && (
                    <ChevronRight className="w-4 h-4 ml-auto text-emerald-500" />
                  )}
                </Link>
              ))}
            </div>
          );
        }

        // Einzelne Navigation Items (ohne Modul-Check)
        return (
          <Link
            key={idx}
            to={section.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              currentPageName === section.page
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {section.name}
            {currentPageName === section.page && (
              <ChevronRight className="w-4 h-4 ml-auto text-emerald-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}