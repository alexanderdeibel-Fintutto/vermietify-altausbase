import React from 'react';
import { useVermitifyTheme, THEMES } from './useVermitifyTheme';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VermitifyThemeSelector() {
  const { theme, darkMode, toggleDarkMode, changeTheme, THEMES: T } = useVermitifyTheme();

  const themes = [
    { 
      id: T.VERMIETER, 
      name: 'Vermieter', 
      description: 'Classic Ocean Sunset - Standard Theme',
      primary: '#1E3A8A',
      accent: '#F97316'
    },
    { 
      id: T.MIETER, 
      name: 'Mieter', 
      description: 'Freundlich & einladend',
      primary: '#16A34A',
      accent: '#1E3A8A'
    },
    { 
      id: T.B2B, 
      name: 'B2B', 
      description: 'Professionell & kompakt',
      primary: '#1E3A5F',
      accent: '#1E3A5F'
    },
    { 
      id: T.KOMFORT, 
      name: 'Komfort', 
      description: 'Große Elemente, hoher Kontrast',
      primary: '#7C3AED',
      accent: '#7C3AED'
    },
    { 
      id: T.INVEST, 
      name: 'Invest', 
      description: 'Dark Theme mit Gold-Akzenten',
      primary: '#0F172A',
      accent: '#D4AF37'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme-Auswahl</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((t) => (
              <div
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={cn(
                  "relative p-4 border-2 rounded-lg cursor-pointer transition-all",
                  theme === t.id 
                    ? "border-[var(--theme-primary)] bg-[var(--theme-primary-light)]" 
                    : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]"
                )}
              >
                {theme === t.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--theme-primary)] rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded" 
                    style={{ backgroundColor: t.primary }}
                  />
                  <div 
                    className="w-8 h-8 rounded" 
                    style={{ backgroundColor: t.accent }}
                  />
                </div>
                <div className="font-semibold mb-1">{t.name}</div>
                <div className="text-sm text-[var(--theme-text-secondary)]">{t.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {theme !== T.INVEST && (
        <Card>
          <CardHeader>
            <CardTitle>Dark Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Dark Mode aktivieren</Label>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}