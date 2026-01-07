import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useModuleAccess(moduleName) {
    return useQuery({
        queryKey: ['module-access', moduleName],
        queryFn: async () => {
            const response = await base44.functions.invoke('checkUserModuleAccess', {
                module_name: moduleName
            });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

export function useUserSuites() {
    return useQuery({
        queryKey: ['user-active-suites'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getUserActiveSuites');
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}