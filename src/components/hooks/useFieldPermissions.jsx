import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useFieldPermissions = (entityType, userRole) => {
    const { data: permissions, isLoading, error } = useQuery({
        queryKey: ['fieldPermissions', entityType, userRole],
        queryFn: async () => {
            const response = await base44.functions.invoke('getFieldPermissions', {
                entity_type: entityType,
                user_role: userRole
            });
            return response.data;
        },
        enabled: !!entityType && !!userRole,
        retry: 1
    });

    const canViewField = (fieldName) => {
        if (!permissions) return true; // Default to visible if permissions not loaded
        const fieldPerm = permissions.field_permissions?.[fieldName];
        if (!fieldPerm) {
            // Use default access if no specific permission defined
            return permissions.default_access !== 'write' && 
                   permissions.default_access !== 'minimal';
        }
        return fieldPerm.access_level !== 'hidden';
    };

    const canEditField = (fieldName) => {
        if (!permissions) return false;
        const fieldPerm = permissions.field_permissions?.[fieldName];
        if (!fieldPerm) {
            return permissions.default_access === 'write';
        }
        return fieldPerm.access_level === 'write';
    };

    const isSensitiveField = (fieldName) => {
        if (!permissions) return false;
        const fieldPerm = permissions.field_permissions?.[fieldName];
        return fieldPerm?.is_sensitive || false;
    };

    const getFieldLabel = (fieldName) => {
        if (!permissions) return fieldName;
        const fieldPerm = permissions.field_permissions?.[fieldName];
        return fieldPerm?.description || fieldName;
    };

    return {
        permissions,
        isLoading,
        error,
        canViewField,
        canEditField,
        isSensitiveField,
        getFieldLabel,
        allowedActions: permissions?.allowed_actions || []
    };
};