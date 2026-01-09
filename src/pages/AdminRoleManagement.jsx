import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Lock, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRoleManagement() {
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    target_email: '',
    role_name: 'User'
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      try {
        return await base44.entities.UserRole.list('-created_at', 50);
      } catch {
        return [];
      }
    }
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['userPermissions'],
    queryFn: async () => {
      try {
        return await base44.entities.UserPermission.list('-created_at', 50);
      } catch {
        return [];
      }
    }
  });

  // Initialize system mutation
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('initializeRolePermissionSystem', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
      toast.success('Rollen- und Berechtigungssystem initialisiert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('assignUserRole', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Rolle "${data.role}" für ${data.user_email} zugewiesen`);
      setAssignDialogOpen(false);
      setFormData({ target_email: '', role_name: 'User' });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initializeMutation.mutateAsync();
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!formData.target_email) {
      toast.error('E-Mail erforderlich');
      return;
    }
    await assignRoleMutation.mutateAsync(formData);
  };

  if (!roles?.length && !permissions?.length) {
    return (
      <div className="space-y-6">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">System-Initialisierung erforderlich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-800">
              Das Rollen- und Berechtigungssystem wurde noch nicht initialisiert.
            </p>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initialisiere...
                </>
              ) : (
                'System initialisieren'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rollen & Berechtigungen</h1>
          <p className="text-sm text-slate-600 mt-1">Verwalten Sie Benutzerrollen und Zugriffsrechte</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Rolle zuweisen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer-Rolle zuweisen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="text-sm font-semibold">E-Mail</label>
                <Input
                  type="email"
                  value={formData.target_email}
                  onChange={(e) => setFormData({ ...formData, target_email: e.target.value })}
                  placeholder="benutzer@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Rolle</label>
                <select
                  value={formData.role_name}
                  onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2"
                >
                  {roles?.map(role => (
                    <option key={role.id} value={role.role_name}>{role.role_name}</option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                disabled={assignRoleMutation.isPending}
                className="w-full"
              >
                Zuweisen
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rollen</h2>
        {rolesLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {roles?.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {role.role_name}
                    </span>
                    <Badge className={
                      role.role_type === 'system' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-slate-100 text-slate-800'
                    }>
                      {role.role_type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">{role.description}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Berechtigungen:</p>
                    <div className="space-y-1">
                      {role.can_manage_users && <p className="text-xs text-slate-600">✓ Benutzer verwalten</p>}
                      {role.can_manage_roles && <p className="text-xs text-slate-600">✓ Rollen verwalten</p>}
                      {role.can_view_audit_log && <p className="text-xs text-slate-600">✓ Audit-Logs einsehen</p>}
                      {role.can_access_financial_data && <p className="text-xs text-slate-600">✓ Finanzdaten zugreifen</p>}
                      {role.can_export_data && <p className="text-xs text-slate-600">✓ Daten exportieren</p>}
                      {role.can_delete_data && <p className="text-xs text-slate-600">✓ Daten löschen</p>}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      {role.permissions?.length || 0} Berechtigungen
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Permissions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Verfügbare Berechtigungen</h2>
        {permissionsLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {permissions?.map(perm => (
                  <div key={perm.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                    <Lock className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{perm.permission_name}</p>
                      <p className="text-xs text-slate-600">{perm.permission_code}</p>
                      <div className="mt-1 flex gap-1">
                        <Badge variant="outline" className="text-xs">{perm.category}</Badge>
                        <Badge variant="outline" className="text-xs">{perm.resource}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}