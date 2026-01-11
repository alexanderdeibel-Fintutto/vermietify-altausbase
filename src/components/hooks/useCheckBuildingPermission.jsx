import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useCheckBuildingPermission = (buildingId, requiredLevel = 'read') => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['buildingPermission', buildingId, requiredLevel],
        queryFn: async () => {
            const response = await base44.functions.invoke('checkBuildingPermission', {
                building_id: buildingId,
                required_level: requiredLevel
            });
            return response.data;
        },
        enabled: !!buildingId,
        retry: 1
    });

    return {
        isAllowed: data?.allowed || false,
        permissionLevel: data?.permission_level || 'none',
        isLoading,
        error,
        canRead: data?.permission_level === 'read' || data?.permission_level === 'write',
        canWrite: data?.permission_level === 'write'
    };
};