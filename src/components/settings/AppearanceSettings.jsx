import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { Palette } from 'lucide-react';

export default function AppearanceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Design & Darstellung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Farbschema</label>
            <ThemeSwitcher />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Darstellungsmodus</label>
            <ThemeToggle />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}