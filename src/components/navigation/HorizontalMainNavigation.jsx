import React from 'react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Building2, Users, Briefcase } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function HorizontalMainNavigation() {
  const location = useLocation();
  
  const getActiveSection = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('building') || path.includes('unit') || path.includes('insurance') || path.includes('finanzen')) return 'immobilien';
    if (path.includes('tenant') || path.includes('contract') || path.includes('operating')) return 'mieter';
    if (path.includes('firma') || path.includes('company')) return 'firma';
    return 'privat';
  };

  const activeSection = getActiveSection();

  const sections = [
    {
      key: 'privat',
      label: 'Privat',
      icon: Home,
      page: 'Dashboard',
      colorActive: 'bg-blue-50 text-blue-700',
      colorHover: 'hover:bg-blue-50/50'
    },
    {
      key: 'immobilien',
      label: 'Immobilien',
      icon: Building2,
      page: 'Buildings',
      colorActive: 'bg-violet-50 text-violet-700',
      colorHover: 'hover:bg-violet-50/50'
    },
    {
      key: 'mieter',
      label: 'Mieter',
      icon: Users,
      page: 'Tenants',
      colorActive: 'bg-emerald-50 text-emerald-700',
      colorHover: 'hover:bg-emerald-50/50'
    },
    {
      key: 'firma',
      label: 'Meine Firma',
      icon: Briefcase,
      page: 'Dashboard',
      colorActive: 'bg-orange-50 text-orange-700',
      colorHover: 'hover:bg-orange-50/50'
    }
  ];

  return (
    <nav className="h-12 border-b border-slate-100 bg-white">
      <div className="flex items-center h-full px-8 gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;
          
          return (
            <a
              key={section.key}
              href={createPageUrl(section.page)}
              className={cn(
                "flex items-center gap-2 px-4 h-full font-light text-sm transition-colors",
                isActive ? section.colorActive : `text-slate-500 ${section.colorHover}`
              )}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}