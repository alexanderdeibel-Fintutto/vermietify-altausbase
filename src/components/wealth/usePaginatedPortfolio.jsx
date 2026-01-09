import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';

/**
 * Hook für paginiertes Asset-Portfolio mit Caching
 */
export function usePaginatedPortfolio(userId, pageSize = 50) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['assetPortfolio', userId, currentPage],
    queryFn: async () => {
      if (!userId) return { data: [], pagination: {} };
      
      const response = await base44.functions.invoke('paginateAssetPortfolio', {
        page: currentPage,
        limit: pageSize,
        status: 'active'
      });

      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!userId
  });

  return {
    assets: data?.data || [],
    pagination: data?.pagination || {},
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    pageSize
  };
}