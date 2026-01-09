import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAdaptiveNavigation() {
  const [visibleFeatures, setVisibleFeatures] = useState(new Set(['dashboard', 'finanzen', 'steuer', 'account']));
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNavigationState();
  }, []);

  const loadNavigationState = async () => {
    try {
      setLoading(true);
      
      // Update navigation state on server
      const response = await base44.functions.invoke('updateNavigationState', {});
      
      if (response.data.visibleFeatures) {
        setVisibleFeatures(new Set(response.data.visibleFeatures));
      }

      // Check for new unlocks
      const unlocks = await base44.entities.FeatureUnlock.filter({});
      const newUnlocks = unlocks.filter(u => !u.notification_shown);
      setUnlockedCount(newUnlocks.length);
      
    } catch (error) {
      console.error('Error loading navigation:', error);
    } finally {
      setLoading(false);
    }
  };

  return { visibleFeatures, unlockedCount, loading, refresh: loadNavigationState };
}