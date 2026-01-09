import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Building2, Users, Briefcase, Menu, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function MobileMainNavigation() {
  const [isOpen, setIsOpen] = useState(false);
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

  const activeSectionData = sections.find(s => s.key === activeSection);
  const Icon = activeSectionData?.icon || Home;

  return (
    <>
      {/* Mobile Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-extralight text-slate-700"
      >
        <Icon className="w-4 h-4" />
        {activeSectionData?.label}
        <Menu className="w-4 h-4 ml-auto" />
      </button>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg z-50">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const isActive = activeSection === section.key;
              
              return (
                <a
                  key={section.key}
                  href={createPageUrl(section.page)}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 font-light text-sm border-b border-slate-50 transition-colors",
                    isActive ? section.colorActive : `text-slate-600 ${section.colorHover}`
                  )}
                >
                  <SectionIcon className="w-5 h-5" />
                  {section.label}
                </a>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}