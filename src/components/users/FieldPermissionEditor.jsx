import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FieldPermissionEditor({ permissionId }) {
  const [newFieldPerm, setNewFieldPerm] = useState({
    entity_name: '',
    field_name: '',
    access_level: 'read'
  });
  const queryClient = useQueryClient();

  const { data: fieldPermissions = [] } = useQuery({
    queryKey: ['field-permissions', permissionId],
    queryFn: () => base44.asServiceRole.entities.FieldPermission.filter({ permission_id: permissionId }),
    enabled: !!permissionId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.FieldPermission.create({
      ...data,
      permission_id: permissionId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      toast.success('Feld-Berechtigung erstellt');
      setNewFieldPerm({ entity_name: '', field_name: '', access_level: 'read' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.FieldPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions'] });
      toast.success('Feld-Berechtigung gelöscht');
    }
  });

  const entities = [
    'Building', 'Unit', 'Tenant', 'LeaseContract', 'Invoice', 
    'Document', 'Payment', 'BankAccount', 'User'
  ];

  const accessLevels = [
    { value: 'none', label: 'Kein Zugriff', color: 'bg-slate-100 text-slate-800' },
    { value: 'read', label: 'Lesen', color: 'bg-blue-100 text-blue-800' },
    { value: 'write', label: 'Schreiben', color: 'bg-green-100 text-green-800' },
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Feld-Berechtigungen ({fieldPermissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Entity</label>
              <Select value={newFieldPerm.entity_name} onValueChange={(value) => setNewFieldPerm({ ...newFieldPerm, entity_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity wählen" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(entity => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Feld-Name</label>
              <Input
                placeholder="z.B. rent_amount"
                value={newFieldPerm.field_name}
                onChange={(e) => setNewFieldPerm({ ...newFieldPerm, field_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Zugriffslevel</label>
              <Select value={newFieldPerm.access_level} onValueChange={(value) => setNewFieldPerm({ ...newFieldPerm, access_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accessLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate(newFieldPerm)}
            disabled={!newFieldPerm.entity_name || !newFieldPerm.field_name || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Erstelle...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Feld-Berechtigung hinzufügen</>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {fieldPermissions.map(fp => {
            const levelConfig = accessLevels.find(l => l.value === fp.access_level);
            return (
              <div key={fp.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{fp.entity_name}.{fp.field_name}</div>
                  <Badge className={levelConfig?.color || 'bg-slate-100'}>
                    {levelConfig?.label || fp.access_level}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(fp.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            );
          })}
        </div>

        {fieldPermissions.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Keine Feld-Berechtigungen definiert
          </div>
        )}
      </CardContent>
    </Card>
  );
}