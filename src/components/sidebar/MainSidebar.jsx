import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DollarSign, Home, Users, Building2, Calculator, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import BuildingSelector from './BuildingSelector';

const MAIN_CATEGORIES = [
  {
    id: 'finanzen',
    label: 'Finanzen',
    icon: DollarSign,
    pages: [
      { name: 'FinanceManagement', label: 'Übersicht' },
      { name: 'Invoices', label: 'Rechnungen' },
      { name: 'BankAccounts', label: 'Bankkonten' },
      { name: 'Payments', label: 'Zahlungen' },
    ]
  },
  {
    id: 'immobilien',
    label: 'Immobilien',
    icon: Home,
    pages: [
      { name: 'Buildings', label: 'Gebäude' },
      { name: 'Units', label: 'Einheiten' },
      { name: 'BuildingsMap', label: 'Karte' },
    ]
  },
  {
    id: 'mieter',
    label: 'Mieter',
    icon: Users,
    pages: [
      { name: 'Tenants', label: 'Übersicht' },
      { name: 'LeaseContracts', label: 'Verträge' },
    ]
  },
  {
    id: 'unternehmen',
    label: 'Unternehmen',
    icon: Building2,
    pages: [
      { name: 'Companies', label: 'Firmen' },
      { name: 'AdminSettings', label: 'Einstellungen' },
    ]
  }
];

const SECONDARY_CATEGORIES = [
  {
    id: 'dokumente',
    label: 'Dokumente',
    icon: FileText,
    pages: [
      { name: 'DocumentManagement', label: 'Verwaltung' },
      { name: 'DocumentInbox', label: 'Eingang' },
      { name: 'DocumentTemplateManager', label: 'Vorlagen' },
    ]
  },
  {
    id: 'steuern',
    label: 'Steuern',
    icon: Calculator,
    pages: [
      { name: 'TaxManagement', label: 'Übersicht' },
      { name: 'TaxDocumentManager', label: 'Dokumente' },
    ]
  },
  {
    id: 'kommunikation',
    label: 'Kommunikation',
    icon: MessageSquare,
    pages: [
      { name: 'TenantCommunicationCenter', label: 'Übersicht' },
      { name: 'AdminMessagingCenter', label: 'Nachrichten' },
      { name: 'AdminAnnouncementCenter', label: 'Ankündigungen' },
    ]
  }
];

export default function MainSidebar() {
  const [expandedCategory, setExpandedCategory] = React.useState('immobilien');
  const { selectedBuilding } = useSelectedBuilding();

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Logo/Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">FinX</span>
        </div>
      </div>

      {/* Building Selector */}
      <div className="p-4 border-b border-slate-200">
        <BuildingSelector />
      </div>

      {/* Navigation Categories */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {MAIN_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="space-y-1">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {category.label}
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="pl-8 space-y-1">
                  {category.pages.map((page) => (
                    <Link
                      key={page.name}
                      to={createPageUrl(page.name)}
                      className="block px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Secondary Categories Separator */}
        <div className="my-4 h-px bg-slate-200" />

        {SECONDARY_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="space-y-1">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {category.label}
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="pl-8 space-y-1">
                  {category.pages.map((page) => (
                    <Link
                      key={page.name}
                      to={createPageUrl(page.name)}
                      className="block px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        FinX v1.0
      </div>
    </div>
  );
}