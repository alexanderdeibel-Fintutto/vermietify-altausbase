import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { ChevronDown } from 'lucide-react';

const CATEGORY_NAV = {
  real_estate: [
    { label: 'Gebäude', page: 'Buildings', icon: '🏢' },
    { label: 'Einheiten', page: 'UnitsManagement', icon: '🚪' },
    { label: 'Verträge', page: 'LeaseContracts', icon: '📄' },
    { label: 'Versicherung', page: 'InsuranceManagement', icon: '🛡️' },
    { label: 'Betriebskosten', page: 'OperatingCosts', icon: '💸' },
    { label: 'Finanzierung', page: 'Financing', icon: '🏦' },
  ],
  tenants: [
    { label: 'Mieter', page: 'Tenants', icon: '👥' },
    { label: 'Kommunikation', page: 'TenantCommunication', icon: '💬' },
    { label: 'Zahlungen', page: 'Payments', icon: '💳' },
    { label: 'Portalzugang', page: 'TenantPortal', icon: '📋' },
    { label: 'Wartung', page: 'MaintenanceTasks', icon: '🔧' },
  ],
  private: [
    { label: 'Vermögensverwaltung', page: 'WealthManagement', icon: '💼' },
    { label: 'Steuern', page: 'TaxDashboard', icon: '📊' },
    { label: 'Dokumentation', page: 'DocumentManagement', icon: '📁' },
    { label: 'Investitionen', page: 'InvestmentsCH', icon: '📈' },
  ],
  wealth: [
    { label: 'Portfolio', page: 'WealthManagement', icon: '📈' },
    { label: 'Analysen', page: 'WealthAnalytics', icon: '📊' },
    { label: 'Automatisierung', page: 'WealthAutomation', icon: '⚙️' },
    { label: 'Integrationen', page: 'WealthIntegrations', icon: '🔗' },
    { label: 'Rebalancing', page: 'WealthManagement', icon: '⚖️' },
  ],
  business: [
    { label: 'Überblick', page: 'Dashboard', icon: '📋' },
    { label: 'Finanzen', page: 'Finanzen', icon: '💰' },
    { label: 'Berichte', page: 'ReportingDashboard', icon: '📊' },
    { label: 'Mitarbeiter', page: 'UserManagement', icon: '👨‍💼' },
    { label: 'Aufgaben', page: 'Tasks', icon: '✓' },
  ],
};

export default function CategorySubNavigation({ activeCategory }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = CATEGORY_NAV[activeCategory] || [];

  if (!navItems.length) return null;

  return (
    <nav className="bg-white border-b border-slate-100">
      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center px-8 h-12 gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-2 px-4 h-full text-sm font-light transition-colors whitespace-nowrap",
              "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-6 py-3 text-sm font-light text-slate-700 hover:bg-slate-50"
        >
          <span>Navigation</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", mobileMenuOpen && "rotate-180")} />
        </button>
        
        {mobileMenuOpen && (
          <div className="bg-slate-50 border-t border-slate-200 max-h-60 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-6 py-3 text-sm font-light text-slate-700 border-b border-slate-200 hover:bg-white"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}