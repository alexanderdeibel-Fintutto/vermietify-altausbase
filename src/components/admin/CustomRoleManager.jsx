import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSION_PROFILES = [
  { value: 'admin', label: 'Administrator', description: 'Vollständiger Zugriff' },
  { value: 'manager', label: 'Manager', description: 'Verwaltungs- und Analysezugriff' },
  { value: 'analyst', label: 'Analyst', description: 'Lesezugriff und Analyse' },
  { value: 'read-only', label: 'Nur Lesezugriff', description: 'Nur Datenansicht' },
  { value: 'custom', label: 'Benutzerdefiniert', description: 'Maßgeschneiderte Berechtigungen' }
];

const PERMISSION_CATEGORIES = [
  {
    name: 'Finanzdaten',
    permissions: [
      { code: 'view_financial_data', label: 'Anzeigen' },
      { code: 'export_financial_data', label: 'Exportieren' },
      { code: 'edit_financial_data', label: 'Bearbeiten' }
    ]
  },
  {
    name: 'Benutzerverwaltung',
    permissions: [
      { code: 'view_users', label: 'Anzeigen' },
      { code: 'create_users', label: 'Erstellen' },
      { code: 'edit_users', label: 'Bearbeiten' },
      { code: 'delete_users', label: 'Löschen' }
    ]
  },
  {
    name: 'Rollenverwaltung',
    permissions: [
      { code: 'view_roles', label: 'Anzeigen' },
      { code: 'create_roles', label: 'Erstellen' },
      { code: 'edit_roles', label: 'Bearbeiten' },
      { code: 'delete_roles', label: 'Löschen' }
    ]
  },
  {
    name: 'Audit & Reporting',
    permissions: [
      { code: 'view_audit_log', label: 'Audit-Log anzeigen' },
      { code: 'generate_reports', label: 'Berichte generieren' },
      { code: 'export_reports', label: 'Berichte exportieren' }
    ]
  }
];

export default function CustomRoleManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionProfile, setPermissionProfile] = useState('custom');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['customRoles'],
    queryFn: () => base44.entities.UserRole.filter({ role_type: 'custom' }, '-created_at', 50),
    initialData: []
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: () => base44.entities.UserPermission.list('-created_date', 100),
    initialData: []
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createCustomRole', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Rolle erstellt');
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error(`Fehler: ${error.message}`)
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateCustomRole', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Rolle aktualisiert');
      resetForm();
      setIsEditOpen(false);
    },
    onError: (error) => toast.error(`Fehler: ${error.message}`)
  });

  const resetForm = () => {
    setRoleName('');
    setDescription('');
    setPermissionProfile('custom');
    setSelectedPermissions([]);
    setEditingRole(null);
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error('Rollenname erforderlich');
      return;
    }

    createRoleMutation.mutate({
      role_name: roleName,
      description,
      permission_profile: permissionProfile,
      permissions: selectedPermissions
    });
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleName(role.role_name);
    setDescription(role.description);
    setPermissionProfile(role.permission_profile);
    setSelectedPermissions(role.permissions || []);
    setIsEditOpen(true);
  };

  const handleUpdateRole = async () => {
    updateRoleMutation.mutate({
      role_id: editingRole.id,
      description,
      permission_profile: permissionProfile,
      permissions: selectedPermissions
    });
  };

  const togglePermission = (permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleProfileChange = (profile) => {
    setPermissionProfile(profile);
    if (profile !== 'custom') {
      // Auto-select permissions based on profile
      const profilePermissions = getPermissionsForProfile(profile);
      setSelectedPermissions(profilePermissions);
    }
  };

  const getPermissionsForProfile = (profile) => {
    switch (profile) {
      case 'admin':
        return allPermissions.map(p => p.permission_code);
      case 'manager':
        return allPermissions
          .filter(p => !p.permission_code.includes('delete'))
          .map(p => p.permission_code);
      case 'analyst':
        return allPermissions
          .filter(p => p.permission_code.includes('view') || p.permission_code.includes('read'))
          .map(p => p.permission_code);
      case 'read-only':
        return allPermissions
          .filter(p => p.permission_code.includes('view'))
          .map(p => p.permission_code);
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Benutzerdefinierte Rollen</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Neue Rolle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Rolle erstellen</DialogTitle>
            </DialogHeader>
            <RoleForm
              roleName={roleName}
              setRoleName={setRoleName}
              description={description}
              setDescription={setDescription}
              permissionProfile={permissionProfile}
              setPermissionProfile={handleProfileChange}
              selectedPermissions={selectedPermissions}
              togglePermission={togglePermission}
              onSubmit={handleCreateRole}
              isLoading={createRoleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {roles.map(role => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{role.role_name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                  </div>
                  <Badge className={
                    role.permission_profile === 'admin' ? 'bg-red-100 text-red-800' :
                    role.permission_profile === 'manager' ? 'bg-blue-100 text-blue-800' :
                    role.permission_profile === 'analyst' ? 'bg-purple-100 text-purple-800' :
                    role.permission_profile === 'read-only' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {PERMISSION_PROFILES.find(p => p.value === role.permission_profile)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Berechtigungen</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 5).map(perm => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions?.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 5} mehr
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Dialog open={isEditOpen && editingRole?.id === role.id} onOpenChange={isEditOpen ? setIsEditOpen : () => {}}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Bearbeiten
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Rolle bearbeiten</DialogTitle>
                      </DialogHeader>
                      <RoleForm
                        roleName={roleName}
                        setRoleName={setRoleName}
                        description={description}
                        setDescription={setDescription}
                        permissionProfile={permissionProfile}
                        setPermissionProfile={handleProfileChange}
                        selectedPermissions={selectedPermissions}
                        togglePermission={togglePermission}
                        onSubmit={handleUpdateRole}
                        isLoading={updateRoleMutation.isPending}
                        isEdit={true}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleForm({
  roleName,
  setRoleName,
  description,
  setDescription,
  permissionProfile,
  setPermissionProfile,
  selectedPermissions,
  togglePermission,
  onSubmit,
  isLoading,
  isEdit = false
}) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <Label className="text-sm font-semibold">Rollenname *</Label>
        <Input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="z.B. Senior Analyst"
          disabled={isEdit}
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <Label className="text-sm font-semibold">Beschreibung</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreiben Sie die Rolle..."
          className="mt-1 h-20"
        />
      </div>

      {/* Permission Profile */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Berechtigungsprofil</Label>
        <div className="grid grid-cols-2 gap-2">
          {PERMISSION_PROFILES.map(profile => (
            <button
              key={profile.value}
              onClick={() => setPermissionProfile(profile.value)}
              className={`p-2 border rounded text-sm transition-all ${
                permissionProfile === profile.value
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-xs">{profile.label}</p>
              <p className="text-xs text-slate-600">{profile.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Permissions */}
      {permissionProfile === 'custom' && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">Spezifische Berechtigungen</Label>
          <div className="space-y-3 max-h-40 overflow-y-auto border border-slate-200 rounded p-3 bg-slate-50">
            {PERMISSION_CATEGORIES.map(category => (
              <div key={category.name}>
                <p className="text-xs font-semibold text-slate-700 mb-2">{category.name}</p>
                <div className="grid grid-cols-2 gap-2 ml-2">
                  {category.permissions.map(perm => (
                    <label key={perm.code} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.code)}
                        onChange={() => togglePermission(perm.code)}
                        className="cursor-pointer"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isLoading || !roleName.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Wird {isEdit ? 'aktualisiert' : 'erstellt'}...
          </>
        ) : (
          isEdit ? 'Rolle aktualisieren' : 'Rolle erstellen'
        )}
      </Button>
    </div>
  );
}