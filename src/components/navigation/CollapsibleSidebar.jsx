import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function CollapsibleSidebar({ section, visibleFeatures = [], isOpen, onClose }) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState(new Set(['overview']));

  const toggleExpand = (key) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedItems(newSet);
  };

  const sidebarStructure = {
    finanzen: {
      title: 'Finanzen',
      items: [
        {
          key: 'overview',
          label: 'Übersicht',
          children: [
            { key: 'Finanzen', label: 'Dashboard', alwaysVisible: true },
            { key: 'FinancialItems', label: 'Buchungen', alwaysVisible: true },
          ]
        },
        {
          key: 'banking',
          label: 'Banking',
          children: [
            { key: 'BankAccounts', label: 'Konten', alwaysVisible: true },
            { key: 'BankReconciliation', label: 'Kontoabgleich', requiresFeature: 'reconciliation' },
          ]
        },
        {
          key: 'invoicing',
          label: 'Rechnungen',
          children: [
            { key: 'Invoices', label: 'Alle Rechnungen', alwaysVisible: true },
            { key: 'InvoiceManagement', label: 'Verwaltung', requiresFeature: 'invoiceManagement' },
          ]
        },
        {
          key: 'analysis',
          label: 'Auswertungen',
          requiresFeature: 'auswertungen',
          children: [
            { key: 'ReportsPage', label: 'Standard Reports', requiresFeature: 'auswertungen' },
            { key: 'AdvancedReportBuilder', label: 'Custom Reports', requiresFeature: 'customReports', badge: '🚧' },
          ]
        },
      ]
    },
    immobilien: {
      title: 'Immobilien',
      items: [
        {
          key: 'overview',
          label: 'Übersicht',
          children: [
            { key: 'PropertyPortfolio', label: 'Portfolio', alwaysVisible: true },
            { key: 'Buildings', label: 'Gebäude', alwaysVisible: true },
          ]
        },
        {
          key: 'units',
          label: 'Einheiten',
          requiresFeature: 'einheiten',
          children: [
            { key: 'UnitsManagement', label: 'Wohnungen', requiresFeature: 'einheiten' },
          ]
        },
        {
          key: 'facility',
          label: 'Facility Management',
          requiresFeature: 'facilityManagement',
          children: [
            { key: 'zaehlerVerwaltung', label: 'Zähler', requiresFeature: 'zaehlerVerwaltung' },
            { key: 'MaintenanceManager', label: 'Wartung', requiresFeature: 'maintenance', badge: '🚧' },
          ]
        },
      ]
    },
    mieter: {
      title: 'Mieter',
      items: [
        {
          key: 'overview',
          label: 'Übersicht',
          children: [
            { key: 'Tenants', label: 'Mieter', alwaysVisible: true },
            { key: 'Contracts', label: 'Verträge', requiresFeature: 'vertraege' },
          ]
        },
        {
          key: 'communication',
          label: 'Kommunikation',
          requiresFeature: 'mieterKommunikation',
          children: [
            { key: 'TenantCommunication', label: 'Nachrichten', requiresFeature: 'mieterKommunikation' },
            { key: 'CommunicationCenter', label: 'Center', requiresFeature: 'communicationCenter', badge: '🚧' },
          ]
        },
        {
          key: 'operations',
          label: 'Betrieb',
          children: [
            { key: 'OperatingCosts', label: 'Betriebskosten', requiresFeature: 'betriebskostenabrechnung' },
            { key: 'Payments', label: 'Zahlungen', requiresFeature: 'zahlungsmanagement' },
          ]
        },
      ]
    },
  };

  const structure = sidebarStructure[section];
  if (!structure) return null;

  const isFeatureVisible = (item) => {
    if (item.alwaysVisible) return true;
    if (item.requiresFeature) return visibleFeatures.includes(item.requiresFeature);
    return true;
  };

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.key);
    const isActive = item.key && location.pathname === createPageUrl(item.key);
    const isLocked = !isFeatureVisible(item);
    const visibleChildren = item.children?.filter(isFeatureVisible) || [];

    if (!isFeatureVisible(item) && visibleChildren.length === 0) return null;

    return (
      <div key={item.key}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.key)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors",
              isLocked && "opacity-50"
            )}
            style={{ paddingLeft: `${level * 12 + 12}px` }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-medium">{item.label}</span>
            {item.badge && <Badge variant="outline" className="ml-auto text-xs">{item.badge}</Badge>}
          </button>
        ) : (
          <Link
            to={createPageUrl(item.key)}
            onClick={(e) => {
              if (isLocked) e.preventDefault();
              else onClose();
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
              isActive ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-700 hover:bg-slate-100",
              isLocked && "opacity-50 cursor-not-allowed"
            )}
            style={{ paddingLeft: `${level * 12 + 32}px` }}
          >
            {isLocked && <Lock className="w-3 h-3" />}
            {item.label}
            {item.badge && <Badge variant="outline" className="ml-auto text-xs">{item.badge}</Badge>}
          </Link>
        )}
        {hasChildren && isExpanded && (
          <div>
            {visibleChildren.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300", isOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{structure.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {structure.items.map(item => renderItem(item))}
        </div>
      </div>
    </div>
  );
}