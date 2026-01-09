import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

const CATEGORY_NAV = {
  real_estate: [
    { label: 'Gebäude', page: 'Buildings', icon: '🏢' },
    { label: 'Einheiten', page: 'UnitsManagement', icon: '🚪' },
    { label: 'Verträge', page: 'LeaseContracts', icon: '📄' },
    { label: 'Versicherung', page: 'InsuranceManagement', icon: '🛡️' },
  ],
  tenants: [
    { label: 'Mieter', page: 'Tenants', icon: '👥' },
    { label: 'Kommunikation', page: 'TenantCommunication', icon: '💬' },
    { label: 'Zahlungen', page: 'Payments', icon: '💳' },
    { label: 'Beschwerde', page: 'TenantPortal', icon: '📋' },
  ],
  private: [
    { label: 'Vermögensverwaltung', page: 'WealthManagement', icon: '💼' },
    { label: 'Steuern', page: 'TaxDashboard', icon: '📊' },
    { label: 'Dokumentation', page: 'DocumentManagement', icon: '📁' },
  ],
  wealth: [
    { label: 'Portfolio', page: 'WealthManagement', icon: '📈' },
    { label: 'Analysen', page: 'WealthAnalytics', icon: '📊' },
    { label: 'Automatisierung', page: 'WealthAutomation', icon: '⚙️' },
    { label: 'Integrationen', page: 'WealthIntegrations', icon: '🔗' },
  ],
  business: [
    { label: 'Überblick', page: 'Dashboard', icon: '📋' },
    { label: 'Finanzen', page: 'Finanzen', icon: '💰' },
    { label: 'Berichte', page: 'ReportingDashboard', icon: '📊' },
    { label: 'Mitarbeiter', page: 'UserManagement', icon: '👨‍💼' },
  ],
};

export default function CategorySubNavigation({ activeCategory }) {
  const navItems = CATEGORY_NAV[activeCategory] || [];

  if (!navItems.length) return null;

  return (
    <nav className="bg-white border-b border-slate-100">
      <div className="px-8 flex items-center gap-1 h-12">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-2 px-4 h-full text-sm font-light transition-colors",
              "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}