import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const COMMON_ENTITIES = [
    { value: 'Building', label: 'Gebäude' },
    { value: 'LeaseContract', label: 'Mietvertrag' },
    { value: 'Invoice', label: 'Rechnung' },
    { value: 'Unit', label: 'Wohneinheit' },
    { value: 'Tenant', label: 'Mieter' },
];

const ROLES = [
    { value: 'admin', label: 'Administrator' },
    { value: 'property_manager', label: 'Hausverwalter' },
    { value: 'owner', label: 'Eigentümer' },
    { value: 'tenant', label: 'Mieter' },
];

const ACCESS_LEVELS = [
    { value: 'hidden', label: 'Verborgen', color: 'bg-red-100 text-red-800' },
    { value: 'read', label: 'Lesezugriff', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'write', label: 'Schreibzugriff', color: 'bg-green-100 text-green-800' },
];

export default function FieldPermissionManager() {
    const [selectedEntity, setSelectedEntity] = useState('Building');
    const [selectedRole, setSelectedRole] = useState('tenant');
    const queryClient = useQueryClient();

    const { data: fieldPermissions, isLoading } = useQuery({
        queryKey: ['fieldPermissions:manage', selectedEntity, selectedRole],
        queryFn: () => base44.entities.FieldPermission.filter({
            entity_type: selectedEntity,
            role: selectedRole
        })
    });

    const deletePermissionMutation = useMutation({
        mutationFn: (permissionId) => base44.entities.FieldPermission.delete(permissionId),
        onSuccess: () => {
            toast.success('Feldberechtigungen entfernt.');
            queryClient.invalidateQueries({ queryKey: ['fieldPermissions:manage'] });
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Entity-Typ</label>
                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {COMMON_ENTITIES.map(entity => (
                                <SelectItem key={entity.value} value={entity.value}>
                                    {entity.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Rolle</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Feldberechtigungen</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Wird geladen...</p>
                    ) : fieldPermissions?.length === 0 ? (
                        <p className="text-slate-500">Keine Feldberechtigungen definiert.</p>
                    ) : (
                        <div className="space-y-3">
                            {fieldPermissions?.map(perm => (
                                <div key={perm.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{perm.field_name}</p>
                                        <p className="text-xs text-slate-600">{perm.description || '-'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge className={ACCESS_LEVELS.find(l => l.value === perm.access_level)?.color}>
                                                {ACCESS_LEVELS.find(l => l.value === perm.access_level)?.label}
                                            </Badge>
                                            {perm.is_sensitive && (
                                                <Badge variant="destructive">Sensibel</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deletePermissionMutation.mutate(perm.id)}
                                        disabled={deletePermissionMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}