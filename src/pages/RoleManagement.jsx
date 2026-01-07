import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Settings, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import RoleEditor from '../components/roles/RoleEditor';

export default function RoleManagement() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.list()
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: () => base44.asServiceRole.entities.UserRoleAssignment.list()
  });

  const toggleRoleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.asServiceRole.entities.Role.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rolle aktualisiert');
    }
  });

  const filteredRoles = roles.filter(role => {
    if (selectedCategory === 'all') return true;
    return role.category === selectedCategory;
  });

  const roleCategories = [
    { id: 'all', name: 'Alle Kategorien', count: roles.length },
    { id: 'admin', name: 'Administrator', count: roles.filter(r => r.category === 'admin').length },
    { id: 'mitarbeiter', name: 'Mitarbeiter', count: roles.filter(r => r.category === 'mitarbeiter').length },
    { id: 'extern', name: 'Externe', count: roles.filter(r => r.category === 'extern').length },
    { id: 'dienstleister', name: 'Dienstleister', count: roles.filter(r => r.category === 'dienstleister').length },
    { id: 'testing', name: 'Testing', count: roles.filter(r => r.category === 'testing').length },
    { id: 'custom', name: 'Custom', count: roles.filter(r => r.category === 'custom').length }
  ];

  const getUserCountForRole = (roleId) => {
    return roleAssignments.filter(ra => ra.role_id === roleId && ra.is_active).length;
  };

  const getRolePermissions = (role) => {
    if (!role.permissions) return [];
    return permissions.filter(p => role.permissions.includes(p.id));
  };

  const getRoleVariant = (category) => {
    const variants = {
      admin: 'default',
      mitarbeiter: 'secondary',
      extern: 'outline',
      dienstleister: 'outline',
      testing: 'outline',
      custom: 'outline'
    };
    return variants[category] || 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rollen-Verwaltung</h1>
          <p className="text-slate-600">Verwalten Sie Rollen und deren Berechtigungen</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            setEditingRoleId(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Custom Rolle erstellen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kategorien */}
        <Card>
          <CardHeader>
            <CardTitle>Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roleCategories.map(category => (
                <div 
                  key={category.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCategory === category.id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-slate-500">{category.count} Rollen</div>
                    </div>
                    <Badge variant={category.id === selectedCategory ? "default" : "secondary"}>
                      {category.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rollen-Liste */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              Rollen - {roleCategories.find(c => c.id === selectedCategory)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoles.map(role => {
                const rolePermissions = getRolePermissions(role);
                return (
                  <Card key={role.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <div className="font-medium">{role.name}</div>
                        </div>
                        <div className="text-sm text-slate-600">{role.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.is_predefined ? (
                          <Badge variant="secondary">System</Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingRoleId(role.id);
                            setEditorOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">
                        Berechtigungen ({rolePermissions.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rolePermissions.slice(0, 3).map(permission => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                        {rolePermissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rolePermissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-sm pt-3 border-t">
                      <div className="text-slate-500">
                        {getUserCountForRole(role.id)} Benutzer
                      </div>
                      <Switch 
                        checked={role.is_active}
                        onCheckedChange={(checked) => toggleRoleMutation.mutate({ id: role.id, is_active: checked })}
                        disabled={role.is_predefined}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <RoleEditor 
        open={editorOpen} 
        onOpenChange={setEditorOpen} 
        roleId={editingRoleId}
      />
    </div>
  );
}