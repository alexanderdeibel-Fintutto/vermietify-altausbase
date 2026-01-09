import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, DollarSign, Building2, Users, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function MobileBottomNav({ visibleFeatures = [] }) {
  const location = useLocation();

  const navItems = [
    { key: 'Dashboard', label: 'Start', icon: Home, alwaysVisible: true },
    { key: 'Finanzen', label: 'Finanzen', icon: DollarSign, alwaysVisible: true },
    { key: 'Buildings', label: 'Objekte', icon: Building2, requiresFeature: 'immobilien' },
    { key: 'Tenants', label: 'Mieter', icon: Users, requiresFeature: 'mieter' },
    { key: 'MyAccount', label: 'Profil', icon: User, alwaysVisible: true },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.alwaysVisible) return true;
    return visibleFeatures.includes(item.requiresFeature);
  });

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === createPageUrl(item.key);
          
          return (
            <Link
              key={item.key}
              to={createPageUrl(item.key)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                isActive ? "text-slate-700" : "text-slate-400"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-extralight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}