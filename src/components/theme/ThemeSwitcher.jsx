import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function ThemeSwitcher() {
  const { currentThemeKey, availableThemes, switchTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {availableThemes.map(theme => (
        <button
          key={theme.id}
          onClick={() => switchTheme(theme.key)}
          className="relative p-4 rounded-lg border-2 transition-all"
          style={{
            borderColor: currentThemeKey === theme.key 
              ? theme.design_tokens.colors.primary_700
              : theme.design_tokens.colors.primary_200,
            backgroundColor: theme.design_tokens.colors.primary_50,
          }}
        >
          {/* Color palette preview */}
          <div className="flex gap-1 mb-3">
            {[
              theme.design_tokens.colors.primary_500,
              theme.design_tokens.colors.success,
              theme.design_tokens.colors.warning,
              theme.design_tokens.colors.error,
            ].map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <p className="text-sm font-medium" style={{ color: theme.design_tokens.colors.primary_900 }}>
            {theme.name}
          </p>

          {currentThemeKey === theme.key && (
            <div className="absolute top-2 right-2">
              <Check className="w-5 h-5" style={{ color: theme.design_tokens.colors.success }} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}