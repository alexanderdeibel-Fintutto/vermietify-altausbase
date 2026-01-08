import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield } from 'lucide-react';

export default function RoleEditor({ roleId, onSave, onCancel }) {
  const { data: role } = useQuery({
    queryKey: ['role', roleId],
    queryFn: async () => {
      if (!roleId) return null;
      const roles = await base44.asServiceRole.entities.Role.filter({ id: roleId });
      return roles[0];
    },
    enabled: !!roleId
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.filter({ is_active: true })
  });

  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    category: role?.category || 'custom',
    permissions: role?.permissions || []
  });

  React.useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        category: role.category,
        permissions: role.permissions || []
      });
    }
  }, [role]);

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    const module = perm.module || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {roleId ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. Hauswart"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Beschreibung</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Beschreiben Sie die Rolle..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Kategorie</label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="mitarbeiter">Mitarbeiter</SelectItem>
              <SelectItem value="extern">Externe</SelectItem>
              <SelectItem value="dienstleister">Dienstleister</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">
            Berechtigungen ({formData.permissions.length} ausgewählt)
          </label>
          <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module}>
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Badge variant="outline">{module}</Badge>
                  <span className="text-slate-600">
                    ({perms.filter(p => formData.permissions.includes(p.id)).length}/{perms.length})
                  </span>
                </div>
                <div className="space-y-2 ml-4">
                  {perms.map(perm => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label className="text-sm cursor-pointer flex-1">
                        {perm.name}
                        <span className="text-xs text-slate-500 ml-2">({perm.code})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={() => onSave(formData)} className="flex-1">
            {roleId ? 'Speichern' : 'Erstellen'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}