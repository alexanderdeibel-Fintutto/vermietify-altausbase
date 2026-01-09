import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Wallet, 
  Building2, 
  Users, 
  FileText, 
  Briefcase,
  User,
  ChevronRight
} from 'lucide-react';
import { useAdaptiveNavigation } from './useAdaptiveNavigation';

export default function AdaptiveNavigation({ currentPageName }) {
  const { visibleFeatures, unlockedCount, loading } = useAdaptiveNavigation();

  // Keyboard shortcuts (Ctrl/Cmd + Number)
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      const keyMap = {
        '1': 'Dashboard',
        '2': 'Finanzen',
        '3': 'Buildings',
        '4': 'Tenants',
        '5': 'Tax'
      };
      
      if (keyMap[e.key]) {
        e.preventDefault();
        window.location.href = createPageUrl(keyMap[e.key]);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navigationItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { key: 'finanzen', label: 'Finanzen', icon: Wallet, page: 'Finanzen' },
    { key: 'immobilien', label: 'Immobilien', icon: Building2, page: 'Buildings' },
    { key: 'mieter', label: 'Mieter', icon: Users, page: 'Tenants' },
    { key: 'steuer', label: 'Steuer', icon: FileText, page: 'Tax' },
    { key: 'firma', label: 'Firma', icon: Briefcase, page: 'AdminDashboard' },
    { key: 'account', label: 'Account', icon: User, page: 'MyAccount' },
  ];

  if (loading) {
    return (
      <nav className="flex items-center gap-2 px-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </nav>
    );
  }

  return (
    <nav 
      className="flex items-center gap-2 px-4 overflow-x-auto"
      role="navigation"
      aria-label="Hauptnavigation"
    >
      {navigationItems.map((item) => {
        if (!visibleFeatures.has(item.key)) return null;
        
        const isActive = currentPageName === item.page;
        const Icon = item.icon;
        const hasNewFeatures = item.key !== 'account' && unlockedCount > 0;

        return (
          <Link
            key={item.key}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
              isActive 
                ? "bg-emerald-50 text-emerald-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            role="link"
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
            <span className="hidden md:inline">{item.label}</span>
            {hasNewFeatures && item.key === 'dashboard' && (
              <Badge className="ml-1 h-5 px-1.5 text-xs bg-orange-600">
                {unlockedCount}
              </Badge>
            )}
            {isActive && (
              <ChevronRight className="w-3 h-3 ml-auto text-emerald-500 hidden lg:inline" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}