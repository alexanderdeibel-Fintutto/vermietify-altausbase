import { useEffect, useRef, useState } from 'react';

export function useAutoSave(data, saveFn, delay = 2000) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSaving(true);

    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        setLastSaved(new Date());
        setSaving(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaving(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, saveFn, delay]);

  return { saving, lastSaved };
}