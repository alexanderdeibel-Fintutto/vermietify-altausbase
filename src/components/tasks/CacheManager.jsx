import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Cache-Manager für optimale Performance
 * 
 * Implementiert intelligentes Caching und Prefetching
 */
export function useCacheOptimization() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Prefetch häufig genutzte Daten
        queryClient.prefetchQuery({
            queryKey: ['taskPriorities'],
            staleTime: 5 * 60 * 1000, // 5 Minuten
        });

        queryClient.prefetchQuery({
            queryKey: ['workflows'],
            staleTime: 5 * 60 * 1000,
        });

        // Cleanup alte Cache-Einträge
        const cleanup = setInterval(() => {
            queryClient.removeQueries({
                predicate: (query) => {
                    const age = Date.now() - (query.state.dataUpdatedAt || 0);
                    return age > 30 * 60 * 1000; // Älter als 30 Minuten
                }
            });
        }, 10 * 60 * 1000); // Alle 10 Minuten

        return () => clearInterval(cleanup);
    }, [queryClient]);

    return {
        invalidateAll: () => {
            queryClient.invalidateQueries();
        },
        clearCache: () => {
            queryClient.clear();
        }
    };
}

/**
 * Optimierte Query-Defaults für React Query
 */
export const optimizedQueryDefaults = {
    queries: {
        staleTime: 30000, // 30 Sekunden
        cacheTime: 5 * 60 * 1000, // 5 Minuten
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1
    }
};