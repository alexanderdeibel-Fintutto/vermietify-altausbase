import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, Settings, Bell, Plug, CreditCard, 
  Shield, Database, Palette 
} from 'lucide-react';

export function VfSettingsLayout({ children, activeSection = 'profile' }) {
  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'account', label: 'Konto', icon: Settings },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'integrations', label: 'Integrationen', icon: Plug },
    { id: 'billing', label: 'Abrechnung', icon: CreditCard },
    { id: 'security', label: 'Sicherheit', icon: Shield },
    { id: 'data', label: 'Daten', icon: Database },
    { id: 'appearance', label: 'Darstellung', icon: Palette }
  ];

  return (
    <div className="vf-settings">
      <div className="vf-settings__nav">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "vf-settings__nav-item",
                activeSection === section.id && "vf-settings__nav-item--active"
              )}
            >
              <SectionIcon className="h-4 w-4" />
              {section.label}
            </a>
          );
        })}
      </div>

      <div className="vf-settings__content">
        {children}
      </div>
    </div>
  );
}