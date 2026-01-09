import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function BreadcrumbNavigation() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  const breadcrumbMap = {
    'dashboard': 'Dashboard',
    'finanzen': 'Finanzen',
    'buildings': 'Immobilien',
    'tenants': 'Mieter',
    'contracts': 'Verträge',
    'invoices': 'Rechnungen',
    'bankaccounts': 'Konten',
    'taxmanagement': 'Steuern',
    'elsterintegration': 'ELSTER',
    'operatingcosts': 'Betriebskosten',
    'documents': 'Dokumente',
    'myaccount': 'Profil',
  };

  const breadcrumbs = pathParts.map((part, index) => {
    const label = breadcrumbMap[part.toLowerCase()] || part;
    const path = '/' + pathParts.slice(0, index + 1).join('/');
    const isLast = index === pathParts.length - 1;
    
    return { label, path, isLast };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600 py-2 px-4 lg:px-8 bg-slate-50 border-b border-slate-200">
      <Link to={createPageUrl('Dashboard')} className="hover:text-slate-900 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-900">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-slate-900 transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}