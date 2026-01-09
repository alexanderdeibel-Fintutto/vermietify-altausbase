import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function UserRoleManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    permissions: []
  });

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      try {
        return await base44.entities.UserRole.list('-created_at', 50);
      } catch {
        return [];
      }
    }
  });

  const handleCreateRole = async () => {
    try {
      await base44.functions.invoke('manageUserRole', {
        action: 'create_role',
        ...formData
      });
      toast.success('Rolle erstellt');
      setFormData({ role_name: '', description: '', permissions: [] });
      setShowDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Diese Rolle wirklich löschen?')) return;
    try {
      await base44.asServiceRole.entities.UserRole.delete(roleId);
      toast.success('Rolle gelöscht');
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Rolle bearbeiten' : 'Neue Rolle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Rollenname</Label>
              <Input
                value={formData.role_name}
                onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                placeholder="z.B. Team-Lead"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Beschreibung</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Beschreibung dieser Rolle"
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Berechtigungen</Label>
              {['financial_data', 'reporting', 'user_management', 'audit'].map(perm => (
                <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm)}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        permissions: e.target.checked
                          ? [...formData.permissions, perm]
                          : formData.permissions.filter(p => p !== perm)
                      });
                    }}
                  />
                  {perm}
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateRole} className="flex-1 bg-blue-600">
                Speichern
              </Button>
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Rollen ({roles?.length || 0})</h3>
        <Button
          onClick={() => {
            setEditingRole(null);
            setFormData({ role_name: '', description: '', permissions: [] });
            setShowDialog(true);
          }}
          size="sm"
          className="bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          Neue Rolle
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : roles && roles.length > 0 ? (
        <div className="space-y-2">
          {roles.map(role => (
            <Card key={role.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{role.role_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {role.permissions?.slice(0, 3).map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                      {role.permissions?.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{role.permissions.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Keine Rollen vorhanden</p>
      )}
    </div>
  );
}