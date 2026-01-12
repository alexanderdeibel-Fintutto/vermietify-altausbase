import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DollarSign, Home, Users, Building2, Calculator, ChevronRight, FileText, MessageSquare, Mail, Bell, Phone, Send, Package, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import BuildingSelector from './BuildingSelector';
import OrgLogoSelector from './OrgLogoSelector';

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
      { name: 'ReportingDashboard', label: 'Reports' },
      { name: 'RoleManagementPage', label: 'Rollen & Rechte' },
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
      { name: 'TenantPortalAdminDashboard', label: 'Portal Admin' },
    ],
    subMenu: [
      {
        id: 'tenant-portal',
        label: 'Mieterportal',
        pages: [
          { name: 'TenantPortalAdminDashboard', label: 'Dashboard' },
          { name: 'TenantOnboardingManager', label: 'Onboarding' },
          { name: 'TenantFeedbackManager', label: 'Feedback' },
          { name: 'AdminMessagingCenter', label: 'Nachrichten' },
          { name: 'TenantCommunicationCenter', label: 'Kommunikation' },
          { name: 'AdminAnnouncementCenter', label: 'Ankündigungen' },
        ]
      }
    ]
  },
  {
    id: 'unternehmen',
    label: 'Unternehmen',
    icon: Building2,
    pages: [
      { name: 'Companies', label: 'Firmen' },
      { name: 'AdminSettings', label: 'Einstellungen' },
      { name: 'PermissionManagement', label: 'Berechtigungen' },
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
    id: 'vermoegen',
    label: 'Vermögen',
    icon: TrendingUp,
    pages: [
      { name: 'PortfolioManagement', label: 'Portfolios' },
      { name: 'AssetManagement', label: 'Assets' },
    ]
  },
  {
    id: 'kommunikation',
    label: 'Kommunikation',
    icon: MessageSquare,
    pages: [
      { name: 'KommunikationDashboard', label: 'Übersicht' },
    ],
    subMenu: [
      {
        id: 'nachrichtenkanal',
        label: 'Nachrichtenkanäle',
        pages: [
          { name: 'AdminMessagingCenter', label: 'Direktnachrichten' },
          { name: 'TenantCommunicationCenter', label: 'Mieter-Chat' },
          { name: 'AdminIssueReports', label: 'Beschwerde-Portal' },
          { name: 'CommunityForum', label: 'Community-Forum' },
        ]
      },
      {
        id: 'ankuendigungen',
        label: 'Ankündigungen & Massen',
        pages: [
          { name: 'AdminAnnouncementCenter', label: 'Ankündigungen' },
          { name: 'BulkMessaging', label: 'Massen-Versand' },
          { name: 'WhatsAppCommunication', label: 'WhatsApp' },
        ]
      },
      {
        id: 'email-vorlagen',
        label: 'E-Mail & Vorlagen',
        pages: [
          { name: 'EmailTemplates', label: 'E-Mail-Vorlagen' },
          { name: 'CommunicationTemplates', label: 'Nachrichtenvorlagen' },
          { name: 'EmailTemplateManager', label: 'Template-Verwaltung' },
          { name: 'AITemplateGenerator', label: 'KI-Generator' },
        ]
      },
      {
        id: 'support-tickets',
        label: 'Support & Tickets',
        pages: [
          { name: 'SupportCenter', label: 'Support-Center' },
          { name: 'SupportTicketManager', label: 'Ticket-Verwaltung' },
          { name: 'TenantFeedbackManager', label: 'Feedback-Manager' },
          { name: 'KnowledgeBaseAdmin', label: 'Wissensdatenbank' },
        ]
      },
      {
        id: 'benachrichtigungen',
        label: 'Benachrichtigungen',
        pages: [
          { name: 'NotificationCenter', label: 'Benachrichtigungsverwaltung' },
          { name: 'NotificationManagement', label: 'Push-Einstellungen' },
          { name: 'NotificationPreferences', label: 'Nutzer-Präferenzen' },
          { name: 'NotificationHistory', label: 'Versand-Verlauf' },
        ]
      },
      {
        id: 'postversand',
        label: 'Postversand',
        pages: [
          { name: 'LetterXpressManagement', label: 'LetterXpress' },
          { name: 'DocumentManagement', label: 'Dokumente zum Versand' },
        ]
      },
      {
        id: 'analyse-automatisierung',
        label: 'Analyse & Automatisierung',
        pages: [
          { name: 'CommunicationAnalytics', label: 'Kommunikations-Analysen' },
          { name: 'AutomatedCommunication', label: 'Automatisierte Kommunikation' },
          { name: 'CommunicationAuditLog', label: 'Audit-Log' },
        ]
      }
    ]
  }
];

export default function MainSidebar() {
  const [expandedCategory, setExpandedCategory] = React.useState('kommunikation-submenu');
  const { selectedBuilding } = useSelectedBuilding();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });

  const currentBuilding = buildings.find(b => b.id === selectedBuilding);
  const themeColor = currentBuilding?.theme_color || '#1e293b';

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen" style={{
      borderRightColor: `${themeColor}20`,
    }}>
      {/* Logo/Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">FinX</span>
          </div>
          <OrgLogoSelector />
        </div>

        {/* Building Selector */}
        <BuildingSelector />
      </div>

      <div className="border-b border-slate-200" />

      {/* Navigation Categories */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {MAIN_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;
          const subMenuId = `${category.id}-submenu`;
          const isSubMenuExpanded = expandedCategory === subMenuId;

          return (
            <div key={category.id} className="space-y-1">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: themeColor,
                  backgroundColor: isExpanded ? `${themeColor}08` : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${themeColor}12`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? `${themeColor}08` : 'transparent'}
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

                  {category.subMenu && category.subMenu.length > 0 && category.subMenu.map((subCategory) => (
                    <div key={subCategory?.id || 'submenu'} className="space-y-1 mt-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => setExpandedCategory(isSubMenuExpanded ? null : subMenuId)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                        style={{
                          color: themeColor,
                          backgroundColor: isSubMenuExpanded ? `${themeColor}08` : 'transparent',
                        }}
                        onMouseEnter={(e) => e.currentTarget?.style && (e.currentTarget.style.backgroundColor = `${themeColor}12`)}
                        onMouseLeave={(e) => e.currentTarget?.style && (e.currentTarget.style.backgroundColor = isSubMenuExpanded ? `${themeColor}08` : 'transparent')}
                      >
                        <span>{subCategory?.label || 'Menü'}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${isSubMenuExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isSubMenuExpanded && subCategory?.pages && (
                        <div className="pl-4 space-y-1">
                          {subCategory.pages.map((page) => (
                            <Link
                              key={page?.name || 'page'}
                              to={createPageUrl(page?.name || '#')}
                              className="block px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                            >
                              {page?.label || 'Seite'}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
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
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: themeColor,
                  backgroundColor: isExpanded ? `${themeColor}08` : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${themeColor}12`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? `${themeColor}08` : 'transparent'}
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