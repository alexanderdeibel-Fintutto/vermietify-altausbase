import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Dynamische SubNavigation die echte Daten lädt:
 * - Gebäude: konkrete Gebäude aus DB
 * - Mieter: verschiedene Perspektiven (Mieter | Verträge | Kommunikation)
 * - Finanzen: Banking | Rechnungen | Buchungen
 */
export default function DynamicSubNavigation({ mainSection, visibleFeatures = [] }) {
  const location = useLocation();
  const scrollRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (scrollRef.current) {
      if (isLeftSwipe) scrollRef.current.scrollLeft += 200;
      if (isRightSwipe) scrollRef.current.scrollLeft -= 200;
    }
  };

  useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('touchstart', onTouchStart);
      ref.addEventListener('touchmove', onTouchMove);
      ref.addEventListener('touchend', onTouchEnd);
      return () => {
        ref.removeEventListener('touchstart', onTouchStart);
        ref.removeEventListener('touchmove', onTouchMove);
        ref.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [touchStart, touchEnd]);

  // === DATEN LADEN BASIEREND AUF SECTION ===
  
  // Gebäude-Liste für immobilien section
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings-nav', mainSection],
    queryFn: async () => {
      if (mainSection !== 'immobilien') return [];
      const res = await base44.entities.Building.list('-updated_date', 10);
      return res || [];
    },
    enabled: mainSection === 'immobilien',
    staleTime: 5 * 60 * 1000
  });

  // Für mieter section: zeige verschiedene Perspektiven
  const meterPerspectives = mainSection === 'mieter' ? [
    { key: 'Tenants', label: 'Mieter', alwaysVisible: true },
    { key: 'Contracts', label: 'Verträge', requiresFeature: 'vertraege' },
    { key: 'Kommunikation', label: 'Kommunikation', requiresFeature: 'mieterKommunikation' },
    { key: 'OperatingCosts', label: 'Betriebskosten', requiresFeature: 'betriebskostenabrechnung' }
  ] : [];

  // Für finanzen section: zeige verschiedene Module
  const financeModules = mainSection === 'finanzen' ? [
    { key: 'BankAccounts', label: 'Banking', alwaysVisible: true },
    { key: 'Invoices', label: 'Rechnungen', alwaysVisible: true },
    { key: 'FinancialItems', label: 'Buchungen', alwaysVisible: true },
    { key: 'BankReconciliation', label: 'Kontoabgleich', requiresFeature: 'reconciliation' }
  ] : [];

  // === ELEMENTS ZUSAMMENBAUEN ===

  let navItems = [];

  if (mainSection === 'immobilien') {
    // Dynamische Gebäude
    if (buildingsLoading) {
      navItems = [
        { type: 'loading', label: 'Laden...', key: 'loading' }
      ];
    } else if (buildings.length > 0) {
      navItems = buildings.map(building => ({
        type: 'building',
        key: `building-${building.id}`,
        label: building.name || 'Gebäude',
        id: building.id,
        alwaysVisible: true
      }));
    } else {
      navItems = [
        { type: 'static', key: 'Buildings', label: 'Gebäude', alwaysVisible: true }
      ];
    }
  } else if (mainSection === 'mieter') {
    // Mieter-Perspektiven (Module)
    navItems = meterPerspectives.filter(item => {
      if (item.alwaysVisible) return true;
      return visibleFeatures.includes(item.requiresFeature || item.key);
    });
  } else if (mainSection === 'finanzen') {
    // Finanz-Module
    navItems = financeModules.filter(item => {
      if (item.alwaysVisible) return true;
      return visibleFeatures.includes(item.requiresFeature || item.key);
    });
  } else if (mainSection === 'steuer') {
    navItems = [
      { key: 'TaxManagement', label: 'Steuerübersicht', alwaysVisible: true },
      { key: 'TaxLibraryManagement', label: 'Steuer-Bibliothek', alwaysVisible: true },
      { key: 'ElsterIntegration', label: 'ELSTER', requiresFeature: 'elster' }
    ].filter(item => {
      if (item.alwaysVisible) return true;
      return visibleFeatures.includes(item.requiresFeature || item.key);
    });
  }

  if (navItems.length === 0) return null;

  const renderNavItem = (item) => {
    // Loading state
    if (item.type === 'loading') {
      return (
        <div key={item.key} className="flex items-center gap-2 px-4 py-2.5 text-sm font-extralight text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {item.label}
        </div>
      );
    }

    // Building oder Static Navigation Item
    const pageKey = item.type === 'building' ? 'BuildingDetail' : item.key;
    const isActive = item.type === 'building'
      ? location.pathname.includes(`/building/${item.id}`)
      : location.pathname === createPageUrl(pageKey);
    
    const isLocked = !item.alwaysVisible && !visibleFeatures.includes(item.requiresFeature || item.key);

    const href = item.type === 'building'
      ? `${createPageUrl('BuildingDetail')}?id=${item.id}`
      : createPageUrl(pageKey);

    return (
      <Link
        key={item.key}
        to={href}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-extralight whitespace-nowrap transition-colors",
          isActive ? "bg-white text-slate-700 shadow-none border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
          isLocked && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => isLocked && e.preventDefault()}
        aria-current={isActive ? 'page' : undefined}
        tabIndex={isLocked ? -1 : 0}
      >
        {isLocked && <Lock className="w-3 h-3" />}
        {item.label}
      </Link>
    );
  };

  return (
    <div className="bg-slate-50 border-b border-slate-100 px-4 lg:px-8 py-2">
      <div 
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scroll-smooth"
        role="navigation"
        aria-label="Dynamische Sub-Navigation"
      >
        {navItems.map(item => renderNavItem(item))}
      </div>
    </div>
  );
}