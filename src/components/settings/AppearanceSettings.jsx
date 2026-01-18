import React from 'react';
import { VfSelect } from '@/components/shared/VfSelect';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useVermitifyTheme } from '@/components/theme/useVermitifyTheme';

export default function AppearanceSettings() {
  const { currentTheme, setTheme } = useVermitifyTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Darstellung</h3>
        
        <VfSelect
          label="Theme"
          value={currentTheme}
          onChange={setTheme}
          options={[
            { value: 'vermieter', label: 'Vermieter (Standard)' },
            { value: 'mieter', label: 'Mieter' },
            { value: 'b2b', label: 'B2B' },
            { value: 'komfort', label: 'Komfort' },
            { value: 'invest', label: 'Invest' }
          ]}
          hint="Wählen Sie ein Theme passend zu Ihrer Nutzung"
        />
      </div>

      <div>
        <ThemeToggle />
      </div>
    </div>
  );
}