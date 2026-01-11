import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AppThemeContext = createContext({});

export const useAppTheme = () => useContext(AppThemeContext);

const appThemes = {
  'vermieter-app': {
    name: 'Vermieter',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    fontFamily: 'Montserrat, sans-serif'
  },
  'vermieter-go-app': {
    name: 'Vermieter Go',
    primaryColor: '#059669',
    accentColor: '#10b981',
    backgroundColor: '#ecfdf5',
    fontFamily: 'Montserrat, sans-serif'
  },
  'meter-app': {
    name: 'Meter',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    fontFamily: 'Montserrat, sans-serif'
  },
  'haushaltsbuch-app': {
    name: 'Haushaltsbuch',
    primaryColor: '#059669',
    accentColor: '#10b981',
    backgroundColor: '#f0fdf4',
    fontFamily: 'Montserrat, sans-serif'
  },
  'steuer-app': {
    name: 'Steuer',
    primaryColor: '#2563eb',
    accentColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
    fontFamily: 'Montserrat, sans-serif'
  },
  'vollversion-app': {
    name: 'Vollversion',
    primaryColor: '#0f172a',
    accentColor: '#7c3aed',
    backgroundColor: '#1e293b',
    fontFamily: 'Montserrat, sans-serif'
  },
  'default': {
    name: 'Default',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    fontFamily: 'Montserrat, sans-serif'
  }
};

export default function AppThemeProvider({ children }) {
  const location = useLocation();
  const [currentTheme, setCurrentTheme] = useState(appThemes.default);

  useEffect(() => {
    const path = location.pathname.replace('/', '');
    const theme = appThemes[path] || appThemes.default;
    setCurrentTheme(theme);

    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--app-primary-color', theme.primaryColor);
    root.style.setProperty('--app-accent-color', theme.accentColor);
    root.style.setProperty('--app-background-color', theme.backgroundColor);
    root.style.setProperty('--app-font-family', theme.fontFamily);

    // Update theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme.primaryColor;
  }, [location]);

  return (
    <AppThemeContext.Provider value={currentTheme}>
      {children}
    </AppThemeContext.Provider>
  );
}