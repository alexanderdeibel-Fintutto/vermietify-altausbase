import { useQuery } from '@tanstack/react-query';

export function useAggressiveCache(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    cacheTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if cache exists
    retry: 2,
    ...options
  });
}

export function usePrefetchEntities(entityNames) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    entityNames.forEach(entityName => {
      queryClient.prefetchQuery({
        queryKey: [entityName, 'list'],
        queryFn: () => base44.entities[entityName].list(),
        staleTime: 10 * 60 * 1000
      });
    });
  }, [entityNames]);
}