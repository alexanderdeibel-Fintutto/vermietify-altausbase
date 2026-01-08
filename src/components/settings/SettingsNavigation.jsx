import React from 'react';
import { User, Lock, Bell, Palette, Building, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Sicherheit', icon: Lock },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
  { id: 'appearance', label: 'Erscheinungsbild', icon: Palette },
  { id: 'buildings', label: 'Gebäudeeinstellungen', icon: Building },
  { id: 'advanced', label: 'Erweitert', icon: BarChart3 },
];

export default function SettingsNavigation({ activeSection, onSectionChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-fit">
      <h3 className="font-semibold text-slate-900 mb-4">Einstellungen</h3>
      <nav className="space-y-2">
        {SETTINGS_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}