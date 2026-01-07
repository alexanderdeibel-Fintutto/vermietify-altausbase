import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function RoleEditor({ open, onOpenChange, roleId = null }) {
  const queryClient = useQueryClient();
  
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
    queryFn: () => base44.asServiceRole.entities.Permission.list()
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    permissions: []
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

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (roleId) {
        return await base44.asServiceRole.entities.Role.update(roleId, data);
      } else {
        return await base44.asServiceRole.entities.Role.create({
          ...data,
          is_predefined: false,
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(roleId ? 'Rolle aktualisiert' : 'Rolle erstellt');
      onOpenChange(false);
    }
  });

  const handleTogglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Gruppiere Permissions nach Modul
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roleId ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Rollenname</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="mitarbeiter">Mitarbeiter</SelectItem>
                  <SelectItem value="extern">Extern</SelectItem>
                  <SelectItem value="dienstleister">Dienstleister</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-3 block">Berechtigungen ({formData.permissions.length} ausgewählt)</Label>
            <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <div className="font-medium text-sm text-slate-700 mb-2">{module}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={() => handleTogglePermission(permission.id)}
                        />
                        <label 
                          htmlFor={permission.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {permission.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {permission.action}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {roleId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}