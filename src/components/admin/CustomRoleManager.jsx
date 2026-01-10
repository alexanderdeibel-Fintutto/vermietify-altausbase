import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Edit, Trash2 } from 'lucide-react';
import RoleEditorDialog from './RoleEditorDialog';

export default function CustomRoleManager({ companyId }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['custom-roles', companyId],
    queryFn: async () => {
      return await base44.asServiceRole.entities.CustomRole.filter({
        company_id: companyId
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId) => base44.functions.invoke('manageCustomRole', {
      action: 'delete',
      role_id: roleId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles', companyId] });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Benutzerdefinierte Rollen</h3>
        <Button onClick={() => {
          setSelectedRole(null);
          setShowEditor(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Rolle
        </Button>
      </div>

      {showEditor && (
        <RoleEditorDialog
          companyId={companyId}
          role={selectedRole}
          onClose={() => {
            setShowEditor(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['custom-roles', companyId] });
            setShowEditor(false);
            setSelectedRole(null);
          }}
        />
      )}

      <div className="space-y-2">
        {roles.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine benutzerdefinierten Rollen erstellt
            </CardContent>
          </Card>
        ) : (
          roles.map(role => (
            <Card key={role.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{role.name}</h4>
                      {role.is_active && (
                        <Badge variant="outline" className="text-xs bg-green-50">
                          Aktiv
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{role.description}</p>

                    {/* Permissions Summary */}
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.entity_permissions || {}).map(([entity, perms]) => {
                        const enabled = Object.values(perms).filter(Boolean).length;
                        return (
                          <Badge key={entity} variant="secondary" className="text-xs">
                            {entity}: {enabled}/{Object.keys(perms).length}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowEditor(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}