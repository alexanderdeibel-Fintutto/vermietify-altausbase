import { useState, useEffect } from 'react';

const CACHE_KEY = 'nav_state_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useNavigationCache(key, fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `${CACHE_KEY}_${key}`;
      
      // Check cache first
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch fresh data
      const startTime = performance.now();
      const freshData = await fetchFn();
      const duration = performance.now() - startTime;
      
      // Log performance warning if > 100ms
      if (duration > 100) {
        console.warn(`Navigation state calculation took ${duration.toFixed(2)}ms (target: <100ms)`);
      }

      setData(freshData);
      setLoading(false);

      // Update cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
    };

    loadData();
  }, deps);

  const invalidateCache = () => {
    const cacheKey = `${CACHE_KEY}_${key}`;
    sessionStorage.removeItem(cacheKey);
  };

  return { data, loading, invalidateCache };
}