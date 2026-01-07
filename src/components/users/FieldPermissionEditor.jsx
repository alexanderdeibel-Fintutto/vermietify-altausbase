import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const ENTITY_FIELDS = {
  Building: [
    { name: 'name', displayName: 'Name' },
    { name: 'address', displayName: 'Adresse' },
    { name: 'purchase_price', displayName: 'Kaufpreis' },
    { name: 'purchase_date', displayName: 'Kaufdatum' },
    { name: 'total_units', displayName: 'Anzahl Einheiten' }
  ],
  LeaseContract: [
    { name: 'base_rent', displayName: 'Grundmiete' },
    { name: 'additional_costs', displayName: 'Nebenkosten' },
    { name: 'contract_start', displayName: 'Vertragsbeginn' },
    { name: 'contract_end', displayName: 'Vertragsende' },
    { name: 'deposit', displayName: 'Kaution' }
  ],
  FinancialItem: [
    { name: 'amount', displayName: 'Betrag' },
    { name: 'due_date', displayName: 'Fälligkeit' },
    { name: 'description', displayName: 'Beschreibung' },
    { name: 'cost_type', displayName: 'Kostenart' }
  ]
};

export default function FieldPermissionEditor({ userId }) {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState('Building');

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserRolesAndPermissions', { userId });
      return response.data;
    },
    enabled: !!userId
  });

  const { data: fieldPermissions = [] } = useQuery({
    queryKey: ['field-permissions', userId],
    queryFn: async () => {
      if (!userPermissions?.permissions) return [];
      const permissionIds = userPermissions.permissions.map(p => p.id);
      return await base44.asServiceRole.entities.FieldPermission.filter({
        permission_id: { $in: permissionIds }
      });
    },
    enabled: !!userPermissions?.permissions
  });

  const updateFieldPermissionMutation = useMutation({
    mutationFn: async ({ entity, field, accessLevel, permissionId }) => {
      const existing = fieldPermissions.find(fp => 
        fp.entity_name === entity && fp.field_name === field && fp.permission_id === permissionId
      );

      if (existing) {
        return await base44.asServiceRole.entities.FieldPermission.update(existing.id, {
          access_level: accessLevel
        });
      } else {
        return await base44.asServiceRole.entities.FieldPermission.create({
          permission_id: permissionId,
          entity_name: entity,
          field_name: field,
          access_level: accessLevel
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      toast.success('Feld-Berechtigung aktualisiert');
    }
  });

  const getFieldPermission = (entityName, fieldName) => {
    const fp = fieldPermissions.find(fp => 
      fp.entity_name === entityName && fp.field_name === fieldName
    );
    return fp?.access_level || 'none';
  };

  const handleFieldPermissionChange = (entity, field, accessLevel) => {
    if (!userPermissions?.permissions || userPermissions.permissions.length === 0) {
      toast.error('Benutzer hat keine Permissions');
      return;
    }
    
    const permissionId = userPermissions.permissions[0].id;
    updateFieldPermissionMutation.mutate({ entity, field, accessLevel, permissionId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feld-Berechtigungen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(ENTITY_FIELDS).map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENTITY_FIELDS[selectedEntity]?.map(field => (
            <div key={field.name} className="space-y-2">
              <div className="font-medium text-sm">{field.displayName}</div>
              <Select 
                value={getFieldPermission(selectedEntity, field.name)}
                onValueChange={(value) => handleFieldPermissionChange(selectedEntity, field.name, value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Zugriff</SelectItem>
                  <SelectItem value="read">Nur lesen</SelectItem>
                  <SelectItem value="write">Lesen & Schreiben</SelectItem>
                  <SelectItem value="admin">Admin-Zugriff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}