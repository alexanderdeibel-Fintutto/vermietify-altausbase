import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for lazy loading large lists with infinite scroll
 * @param {Function} fetchFn - Function to fetch data (receives skip and limit)
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, isLoading, hasMore, loadMore, refresh }
 */
export function useLazyLoadedList(fetchFn, options = {}) {
  const {
    pageSize = 20,
    cacheTime = 5 * 60 * 1000,
    queryKey = 'lazyList'
  } = options;

  const [allItems, setAllItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [queryKey, skip],
    queryFn: async () => {
      const items = await fetchFn(skip, pageSize);
      return items;
    },
    staleTime: cacheTime,
    enabled: hasMore
  });

  useEffect(() => {
    if (data) {
      if (skip === 0) {
        setAllItems(data);
      } else {
        setAllItems(prev => [...prev, ...data]);
      }
      
      if (data.length < pageSize) {
        setHasMore(false);
      }
    }
  }, [data, skip, pageSize]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setSkip(prev => prev + pageSize);
    }
  };

  const refresh = () => {
    setSkip(0);
    setAllItems([]);
    setHasMore(true);
    refetch();
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading]);

  return {
    data: allItems,
    isLoading: isLoading && skip === 0,
    isLoadingMore: isLoading && skip > 0,
    hasMore,
    loadMore,
    refresh,
    observerTarget
  };
}