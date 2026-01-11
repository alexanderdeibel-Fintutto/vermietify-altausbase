import React from 'react';
import { useFieldPermissions } from '@/components/hooks/useFieldPermissions';
import { Badge } from '@/components/ui/badge';

export default function ProtectedField({ 
    fieldName, 
    entityType, 
    userRole, 
    children, 
    label,
    isSensitive = false 
}) {
    const { canViewField, isSensitiveField } = useFieldPermissions(entityType, userRole);

    if (!canViewField(fieldName)) {
        return null;
    }

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    {isSensitiveField(fieldName) && (
                        <Badge variant="destructive" className="text-xs">Sensibel</Badge>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}