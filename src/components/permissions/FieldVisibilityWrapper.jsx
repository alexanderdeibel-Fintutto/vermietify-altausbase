import React, { useMemo } from 'react';

/**
 * Filtert Objektattribute basierend auf Feldberechtigungen
 * Gibt ein Objekt mit nur sichtbaren Feldern zurück
 */
export const useVisibleFields = (data, entityType, userRole, fieldPermissions) => {
    return useMemo(() => {
        if (!data || !fieldPermissions) return data;

        const visibleData = { ...data };
        const fieldPerms = fieldPermissions.field_permissions || {};
        const defaultAccess = fieldPermissions.default_access;

        Object.keys(visibleData).forEach(fieldName => {
            const perm = fieldPerms[fieldName];
            const accessLevel = perm?.access_level || (defaultAccess === 'write' ? 'write' : 'read');

            if (accessLevel === 'hidden') {
                delete visibleData[fieldName];
            }
        });

        return visibleData;
    }, [data, fieldPermissions, entityType, userRole]);
};

/**
 * HOC zum Wrappen von Komponenten mit Feldberechtigungen
 */
export function withFieldPermissions(Component) {
    return function WithFieldPermissionsComponent(props) {
        const { userRole, entityType, data, ...restProps } = props;

        return <Component 
            {...restProps} 
            userRole={userRole} 
            entityType={entityType} 
            data={data} 
        />;
    };
}