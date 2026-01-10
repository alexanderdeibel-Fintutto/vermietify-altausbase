import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function FieldPermissions() {
  const [selectedEntity, setSelectedEntity] = useState('Building');
  const [selectedRole, setSelectedRole] = useState('user');
  const queryClient = useQueryClient();

  const { data: permissions = {} } = useQuery({
    queryKey: ['fieldPermissions', selectedEntity, selectedRole],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFieldPermissions', {
        entity: selectedEntity,
        role: selectedRole
      });
      return response.data.permissions;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (newPermissions) => {
      await base44.functions.invoke('saveFieldPermissions', {
        entity: selectedEntity,
        role: selectedRole,
        permissions: newPermissions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldPermissions'] });
      toast.success('Berechtigungen gespeichert');
    }
  });

  const fields = {
    Building: ['name', 'address', 'market_value', 'purchase_price', 'units_count'],
    Tenant: ['name', 'email', 'phone', 'income', 'credit_score'],
    LeaseContract: ['rent', 'deposit', 'start_date', 'end_date', 'terms'],
    Document: ['content', 'category', 'recipient_address', 'file_url']
  };

  const togglePermission = (field, permission) => {
    const updated = { ...permissions };
    if (!updated[field]) updated[field] = {};
    updated[field][permission] = !updated[field][permission];
    saveMutation.mutate(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Granulare Feld-Berechtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold mb-2 block">Entität</label>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Building">Gebäude</SelectItem>
                <SelectItem value="Tenant">Mieter</SelectItem>
                <SelectItem value="LeaseContract">Mietvertrag</SelectItem>
                <SelectItem value="Document">Dokument</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Rolle</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="user">Benutzer</SelectItem>
                <SelectItem value="viewer">Betrachter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-600 pb-2 border-b">
            <span>Feld</span>
            <span className="text-center">Lesen</span>
            <span className="text-center">Schreiben</span>
            <span className="text-center">Löschen</span>
          </div>

          {(fields[selectedEntity] || []).map(field => (
            <div key={field} className="grid grid-cols-4 gap-2 items-center p-2 bg-slate-50 rounded">
              <span className="text-sm font-semibold">{field}</span>
              <div className="flex justify-center">
                <Checkbox
                  checked={permissions[field]?.read || false}
                  onCheckedChange={() => togglePermission(field, 'read')}
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={permissions[field]?.write || false}
                  onCheckedChange={() => togglePermission(field, 'write')}
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={permissions[field]?.delete || false}
                  onCheckedChange={() => togglePermission(field, 'delete')}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <Lock className="w-4 h-4 inline mr-1" />
            Änderungen werden automatisch gespeichert und sofort wirksam
          </p>
        </div>
      </CardContent>
    </Card>
  );
}