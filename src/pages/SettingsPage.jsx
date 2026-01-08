import React, { useState } from 'react';
import SettingsNavigation from '@/components/settings/SettingsNavigation';
import SettingsContent from '@/components/settings/SettingsContent';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Einstellungen</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Kontoeinstellungen und Präferenzen</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <SettingsNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="col-span-2">
          <SettingsContent activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
}