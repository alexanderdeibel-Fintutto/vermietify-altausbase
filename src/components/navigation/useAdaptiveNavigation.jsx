import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { usePackageAccess } from './usePackageAccess';

export function useAdaptiveNavigation() {
  const { checkFeatureAccess, isLoading: packageLoading } = usePackageAccess();
  const [visibleFeatures, setVisibleFeatures] = useState(new Set(['dashboard', 'finanzen', 'steuer', 'account']));
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({ calcTime: 0 });

  useEffect(() => {
    loadNavigationState();
  }, []);

  const loadNavigationState = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      
      // Update navigation state on server
      const response = await base44.functions.invoke('updateNavigationState', {});
      
      if (response.data.visibleFeatures) {
        let features = new Set(response.data.visibleFeatures);
        
        // Apply package-based access control
        if (checkFeatureAccess) {
          features = new Set([...features].filter(feature => checkFeatureAccess(feature)));
        }
        
        setVisibleFeatures(features);
      }

      // Check for new unlocks
      const unlocks = await base44.entities.FeatureUnlock.filter({});
      const newUnlocks = unlocks.filter(u => !u.notification_shown);
      setUnlockedCount(newUnlocks.length);
      
      const calcTime = performance.now() - startTime;
      setPerformanceMetrics({ calcTime });
      
      if (calcTime > 100) {
        console.warn(`Navigation calculation exceeded 100ms: ${calcTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error('Error loading navigation:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    visibleFeatures, 
    unlockedCount, 
    loading: loading || packageLoading, 
    performanceMetrics,
    refresh: loadNavigationState 
  };
}