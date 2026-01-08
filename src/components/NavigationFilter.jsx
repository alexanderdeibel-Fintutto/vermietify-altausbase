import React, { useMemo } from 'react';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';

// Maps Module-Namen zu Navigation Items
const MODULE_MAP = {
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

export function useFilteredNavigation(baseNavigation) {
  const { packageTemplate, hasModuleAccess } = usePackageAccess();

  const filteredNavigation = useMemo(() => {
    if (!packageTemplate) return baseNavigation;

    return baseNavigation.map(item => {
      // Wenn Item ein Modul hat, prüfe Zugriff
      if (item.moduleRequired) {
        if (!hasModuleAccess(item.moduleRequired)) {
          return null; // Verstecke das Item
        }
      }
      
      // Wenn Item SubItems hat, filtere diese auch
      if (item.subItems) {
        item.subItems = item.subItems.filter(subItem => {
          if (subItem.moduleRequired) {
            return hasModuleAccess(subItem.moduleRequired);
          }
          return true;
        });
      }

      return item;
    }).filter(Boolean);
  }, [baseNavigation, packageTemplate, hasModuleAccess]);

  return filteredNavigation;
}

export { MODULE_MAP };