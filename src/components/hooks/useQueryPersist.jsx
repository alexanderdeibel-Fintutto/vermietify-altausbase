/**
 * Persistent query cache helpers using localStorage
 */
export const createPersistenceAdapter = () => ({
  getState: () => {
    try {
      const cached = localStorage.getItem('base44_query_cache');
      return cached ? JSON.parse(cached) : undefined;
    } catch (e) {
      console.warn('Failed to load cached queries:', e);
      return undefined;
    }
  },
  setState: (state) => {
    try {
      localStorage.setItem('base44_query_cache', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save query cache:', e);
    }
  },
  removeItem: () => {
    try {
      localStorage.removeItem('base44_query_cache');
    } catch (e) {
      console.warn('Failed to remove query cache:', e);
    }
  },
});

/**
 * Predefined cache times by query type
 */
export const getCacheTime = (queryKey) => {
  const key = queryKey[0];
  
  // User data: 30 min
  if (['navigationState', 'userPackageConfig', 'userOnboarding'].includes(key)) {
    return 30 * 60 * 1000;
  }
  
  // Analytics: 15 min
  if (['uxPatterns', 'aiInsights', 'abTests', 'testerAnalytics'].includes(key)) {
    return 15 * 60 * 1000;
  }
  
  // Default: 5 min
  return 5 * 60 * 1000;
};