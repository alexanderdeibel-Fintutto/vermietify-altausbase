import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('system');
  const [systemDarkMode, setSystemDarkMode] = useState(false);

  // Fetch available themes
  const { data: themes = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list(),
  });

  // Fetch user's theme preference
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  // Set initial theme from user preference
  useEffect(() => {
    if (user?.theme_preference) {
      setCurrentThemeKey(user.theme_preference);
    }
  }, [user]);

  // Monitor system dark mode
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handleChange);
    setSystemDarkMode(darkModeQuery.matches);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  // Get effective theme (resolve system theme)
  const effectiveThemeKey = currentThemeKey === 'system' 
    ? (systemDarkMode ? 'dark' : 'light')
    : currentThemeKey;

  const currentTheme = themes.find(t => t.key === effectiveThemeKey) || 
                       themes.find(t => t.key === 'light');

  // Apply theme to CSS variables with smooth transition
  useEffect(() => {
    if (!currentTheme) return;

    const root = document.documentElement;
    const tokens = currentTheme.design_tokens;

    // Start transition
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';

    // Apply colors
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }

    // Apply typography
    if (tokens.typography) {
      Object.entries(tokens.typography).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value);
      });
    }

    // Apply spacing
    if (tokens.spacing) {
      Object.entries(tokens.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, value);
      });
    }

    // Apply effects
    if (tokens.effects) {
      Object.entries(tokens.effects).forEach(([key, value]) => {
        root.style.setProperty(`--effect-${key}`, value);
      });
    }

    // Reset transition after 300ms
    const timer = setTimeout(() => {
      root.style.transition = '';
    }, 300);

    return () => clearTimeout(timer);
  }, [currentTheme]);

  const switchTheme = async (themeKey) => {
    setCurrentThemeKey(themeKey);
    if (user) {
      await base44.auth.updateMe({ theme_preference: themeKey });
    }
  };

  return (
    <ThemeContext.Provider value={{
      currentThemeKey,
      currentTheme,
      availableThemes: themes,
      switchTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}