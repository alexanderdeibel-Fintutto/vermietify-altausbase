import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Palette, Building2, Users, Briefcase, Type, TrendingUp, Moon, Sun } from 'lucide-react';

const THEMES = [
  { id: 'vermieter', name: 'Vermieter Pro', icon: Building2, color: '#1E3A8A' },
  { id: 'mieter', name: 'Mieter', icon: Users, color: '#16A34A' },
  { id: 'b2b', name: 'B2B', icon: Briefcase, color: '#1E3A5F' },
  { id: 'komfort', name: 'Komfort', icon: Type, color: '#7C3AED' },
  { id: 'invest', name: 'Invest', icon: TrendingUp, color: '#D4AF37' },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('vermieter');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('vf-theme') || 'vermieter';
    const savedDark = localStorage.getItem('vf-dark') === 'true';
    setCurrentTheme(savedTheme);
    setIsDark(savedDark);
    applyTheme(savedTheme, savedDark);
  }, []);

  const applyTheme = (theme, dark) => {
    document.body.className = '';
    if (theme !== 'vermieter') {
      document.body.classList.add(`theme-${theme}`);
    }
    if (dark && theme !== 'invest') {
      document.body.classList.add('dark');
    }
  };

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('vf-theme', themeId);
    applyTheme(themeId, isDark);
  };

  const handleDarkToggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('vf-dark', newDark.toString());
    applyTheme(currentTheme, newDark);
  };

  const activeTheme = THEMES.find(t => t.id === currentTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="vf-navbar-icon-btn">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Design-Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((theme) => {
          const Icon = theme.icon;
          return (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={currentTheme === theme.id ? 'bg-slate-100' : ''}
            >
              <Icon className="w-4 h-4 mr-2" style={{ color: theme.color }} />
              {theme.name}
              {currentTheme === theme.id && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
        {currentTheme !== 'invest' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDarkToggle}>
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}