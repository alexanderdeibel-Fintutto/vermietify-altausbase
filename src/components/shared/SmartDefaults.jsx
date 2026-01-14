import { useEffect } from 'react';

export function useSmartDefaults(entityType, setValue) {
  useEffect(() => {
    const getDefaults = () => {
      try {
        const history = JSON.parse(localStorage.getItem(`${entityType}_recent`) || '[]');
        if (history.length === 0) return null;
        
        const lastEntry = history[0];
        return lastEntry;
      } catch {
        return null;
      }
    };

    const defaults = getDefaults();
    if (defaults) {
      Object.entries(defaults).forEach(([key, value]) => {
        if (value && key !== 'id' && key !== 'created_date' && key !== 'updated_date') {
          setValue(key, value, { shouldValidate: false });
        }
      });
    }
  }, [entityType, setValue]);
}

export function saveToHistory(entityType, data) {
  try {
    const history = JSON.parse(localStorage.getItem(`${entityType}_recent`) || '[]');
    history.unshift(data);
    localStorage.setItem(`${entityType}_recent`, JSON.stringify(history.slice(0, 5)));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}