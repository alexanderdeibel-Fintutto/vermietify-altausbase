import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Save, Sun, Moon } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function SettingsAppearance() {
  const [settings, setSettings] = useState({
    theme: 'vermieter',
    darkMode: 'auto',
    density: 'comfortable',
    fontSize: 'normal'
  });

  const handleSave = () => {
    localStorage.setItem('vermitify-theme', settings.theme);
    document.body.className = `theme-${settings.theme}`;
    showSuccess('Darstellung gespeichert');
  };

  return (
    <div className="vf-settings__section">
      <h2 className="vf-settings__section-title">Darstellung</h2>

      <div className="vf-form-section">
        <h3 className="vf-form-section__title">Theme</h3>
        <VfSelect
          label="Farbschema"
          value={settings.theme}
          onChange={(v) => setSettings({ ...settings, theme: v })}
          options={[
            { value: 'vermieter', label: 'Vermieter (Blau/Orange)' },
            { value: 'mieter', label: 'Mieter (Grün)' },
            { value: 'b2b', label: 'B2B (Kompakt)' },
            { value: 'komfort', label: 'Komfort (Große Elemente)' },
            { value: 'invest', label: 'Investor (Dunkel/Gold)' }
          ]}
        />

        <div className="mt-4 grid grid-cols-5 gap-3">
          {['vermieter', 'mieter', 'b2b', 'komfort', 'invest'].map((theme) => (
            <div 
              key={theme}
              className={`cursor-pointer p-4 border-2 rounded-lg text-center ${
                settings.theme === theme ? 'border-[var(--theme-primary)]' : 'border-[var(--theme-border)]'
              }`}
              onClick={() => setSettings({ ...settings, theme })}
            >
              <div className="w-full h-12 rounded mb-2" style={{
                background: theme === 'vermieter' ? 'linear-gradient(135deg, #1E3A8A, #F97316)' :
                           theme === 'mieter' ? 'linear-gradient(135deg, #16A34A, #1E3A8A)' :
                           theme === 'b2b' ? '#1E3A5F' :
                           theme === 'komfort' ? '#7C3AED' :
                           'linear-gradient(135deg, #0F172A, #D4AF37)'
              }} />
              <div className="text-xs capitalize">{theme}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="vf-form-section">
        <h3 className="vf-form-section__title">Ansicht</h3>
        <VfSelect
          label="Dichte"
          value={settings.density}
          onChange={(v) => setSettings({ ...settings, density: v })}
          options={[
            { value: 'comfortable', label: 'Komfortabel' },
            { value: 'compact', label: 'Kompakt' }
          ]}
        />

        <VfSelect
          label="Schriftgröße"
          value={settings.fontSize}
          onChange={(v) => setSettings({ ...settings, fontSize: v })}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Groß' },
            { value: 'extra-large', label: 'Sehr groß' }
          ]}
        />
      </div>

      <Button variant="gradient" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}