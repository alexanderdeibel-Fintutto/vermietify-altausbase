import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOfflineCache(entityName, options = {}) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const query = useQuery({
    queryKey: [entityName, 'list'],
    queryFn: async () => {
      try {
        const data = await base44.entities[entityName].list();
        
        // Save to localStorage for offline access
        if (typeof window !== 'undefined') {
          localStorage.setItem(`offline_${entityName}`, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }
        
        return data;
      } catch (error) {
        // If offline, try to load from localStorage
        if (!navigator.onLine && typeof window !== 'undefined') {
          const cached = localStorage.getItem(`offline_${entityName}`);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
            
            // Use cache if less than 24 hours old
            if (ageInHours < 24) {
              return data;
            }
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: isOffline ? false : 3,
    ...options
  });

  return {
    ...query,
    isOffline,
    isCached: query.data && isOffline
  };
}