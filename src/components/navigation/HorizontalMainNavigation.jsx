import React from 'react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Building2, Users, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function HorizontalMainNavigation({ activeCategory = null }) {
  const location = useLocation();
  
  const getActiveSection = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('wealth') || path.includes('vermogen')) return 'vermogen';
    if (path.includes('building') || path.includes('unit') || path.includes('insurance') || path.includes('finanzen')) return 'immobilien';
    if (path.includes('tenant') || path.includes('contract') || path.includes('operating')) return 'mieter';
    if (path.includes('firma') || path.includes('company')) return 'firma';
    return 'privat';
  };

  const activeSection = getActiveSection();
  
  // All sections with category mapping
  const allSections = [
    {
      key: 'privat',
      label: 'Privat',
      icon: Home,
      page: 'Dashboard',
      colorActive: 'bg-blue-50 text-blue-700',
      colorHover: 'hover:bg-blue-50/50',
      category: 'private'
    },
    {
      key: 'immobilien',
      label: 'Immobilien',
      icon: Building2,
      page: 'Buildings',
      colorActive: 'bg-violet-50 text-violet-700',
      colorHover: 'hover:bg-violet-50/50',
      category: 'real_estate'
    },
    {
      key: 'mieter',
      label: 'Mieter',
      icon: Users,
      page: 'Tenants',
      colorActive: 'bg-emerald-50 text-emerald-700',
      colorHover: 'hover:bg-emerald-50/50',
      category: 'tenants'
    },
    {
      key: 'vermogen',
      label: 'Mein Vermögen',
      icon: TrendingUp,
      page: 'WealthManagement',
      colorActive: 'bg-amber-50 text-amber-700',
      colorHover: 'hover:bg-amber-50/50',
      category: 'wealth'
    },
    {
      key: 'firma',
      label: 'Meine Firma',
      icon: Briefcase,
      page: 'Dashboard',
      colorActive: 'bg-orange-50 text-orange-700',
      colorHover: 'hover:bg-orange-50/50',
      category: 'business'
    }
  ];
  
  // Filter sections based on active category
  const sections = activeCategory
    ? allSections.filter(s => s.category === activeCategory)
    : allSections;

  const activeSectionData = sections.find(s => s.key === activeSection);
  const ActiveIcon = activeSectionData?.icon || Home;

  return (
    <nav className="border-b border-slate-100 bg-white">
      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center h-12 px-8 gap-1">
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

      {/* Mobile Navigation - Expandable */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-extralight text-slate-700">
            <ActiveIcon className="w-4 h-4" />
            {activeSectionData?.label}
          </div>
        </div>
      </div>
    </nav>
  );
}