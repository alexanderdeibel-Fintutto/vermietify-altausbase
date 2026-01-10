import { useCallback, useRef } from 'react';

/**
 * Custom hook für optimiertes Caching mit Auto-Cleanup
 */
export const useOptimizedCache = (maxSize = 50) => {
  const cacheRef = useRef(new Map());
  const timestampsRef = useRef(new Map());

  const get = useCallback((key) => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key, value, ttl = 5 * 60 * 1000) => {
    // Cleanup wenn Cache zu groß wird
    if (cacheRef.current.size >= maxSize) {
      const oldestKey = Array.from(timestampsRef.current.entries())
        .sort(([, a], [, b]) => a - b)[0][0];
      cacheRef.current.delete(oldestKey);
      timestampsRef.current.delete(oldestKey);
    }

    cacheRef.current.set(key, value);
    timestampsRef.current.set(key, Date.now());

    // TTL cleanup
    if (ttl) {
      setTimeout(() => {
        cacheRef.current.delete(key);
        timestampsRef.current.delete(key);
      }, ttl);
    }
  }, [maxSize]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    timestampsRef.current.clear();
  }, []);

  return { get, set, clear };
};

/**
 * Infinity Scroll Hook
 */
export const useInfinityScroll = (onLoadMore, threshold = 0.1) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, threshold]);

  return observerTarget;
};