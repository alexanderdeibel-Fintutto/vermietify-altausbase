import { useEffect, useState } from 'react';

export const THEMES = {
  VERMIETER: 'vermieter',
  MIETER: 'mieter',
  B2B: 'b2b',
  KOMFORT: 'komfort',
  INVEST: 'invest'
};

export function useVermitifyTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vf-theme') || THEMES.VERMIETER;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('vf-dark') === 'true';
  });

  useEffect(() => {
    // Remove all theme classes
    Object.values(THEMES).forEach(t => {
      document.body.classList.remove(`theme-${t}`);
    });
    document.body.classList.remove('dark');

    // Apply selected theme
    if (theme !== THEMES.VERMIETER) {
      document.body.classList.add(`theme-${theme}`);
    }

    // Apply dark mode (not for invest theme)
    if (darkMode && theme !== THEMES.INVEST) {
      document.body.classList.add('dark');
    }

    // Save to localStorage
    localStorage.setItem('vf-theme', theme);
    localStorage.setItem('vf-dark', darkMode);
  }, [theme, darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    darkMode,
    toggleDarkMode,
    changeTheme,
    THEMES
  };
}