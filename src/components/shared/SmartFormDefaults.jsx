import React, { useEffect } from 'react';

export default function useSmartFormDefaults(storageKey = 'form-defaults') {
  const [defaults, setDefaults] = React.useState({});

  // Load defaults from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setDefaults(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading form defaults:', e);
      }
    }
  }, [storageKey]);

  const saveDefaults = React.useCallback((formData) => {
    localStorage.setItem(storageKey, JSON.stringify(formData));
    setDefaults(formData);
  }, [storageKey]);

  const clearDefaults = React.useCallback(() => {
    localStorage.removeItem(storageKey);
    setDefaults({});
  }, [storageKey]);

  return { defaults, saveDefaults, clearDefaults };
}