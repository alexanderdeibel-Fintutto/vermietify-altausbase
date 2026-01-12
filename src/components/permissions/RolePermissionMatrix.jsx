import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

const FEATURE_MODULES = {
  'Mietverträge': ['Ansehen', 'Erstellen', 'Bearbeiten', 'Löschen'],
  'Finanzen': ['Ansehen', 'Buchen', 'Freigeben', 'Exportieren'],
  'Dokumente': ['Ansehen', 'Erstellen', 'Versenden', 'Löschen'],
  'Steuern': ['Ansehen', 'Generieren', 'Übertragen', 'ELSTER'],
  'Mieter': ['Ansehen', 'Erstellen', 'Bearbeiten', 'Löschen'],
  'Gebäude': ['Ansehen', 'Erstellen', 'Bearbeiten', 'Löschen']
};

export default function RolePermissionMatrix({ mandantId }) {
  const [permissions, setPermissions] = useState({});
  
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roleDefinitions'],
    queryFn: () => base44.entities.RoleDefinition.list()
  });

  const { data: existingPerms = [] } = useQuery({
    queryKey: ['rolePermissions', mandantId],
    queryFn: async () => {
      const perms = await base44.entities.UserMandantAccess.list();
      const permMap = {};
      perms.forEach(p => {
        if (p.berechtigungen) {
          const parsed = JSON.parse(p.berechtigungen || '{}');
          permMap[p.rolle] = parsed;
        }
      });
      return permMap;
    }
  });

  React.useEffect(() => {
    setPermissions(existingPerms);
  }, [existingPerms]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('updateRolePermissions', {
        mandant_id: mandantId,
        permissions
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rolePermissions']);
      toast.success('Berechtigungen gespeichert');
    }
  });

  const togglePermission = (role, module, action) => {
    setPermissions(prev => {
      const rolePerms = prev[role] || {};
      const modulePerms = rolePerms[module] || [];
      
      const updated = modulePerms.includes(action)
        ? modulePerms.filter(a => a !== action)
        : [...modulePerms, action];
      
      return {
        ...prev,
        [role]: {
          ...rolePerms,
          [module]: updated
        }
      };
    });
  };

  const hasPermission = (role, module, action) => {
    return permissions[role]?.[module]?.includes(action) || false;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle>Rollenberechtigungen</CardTitle>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Rolle</th>
                {Object.keys(FEATURE_MODULES).map(module => (
                  <th key={module} className="text-center py-2 font-medium" colSpan={FEATURE_MODULES[module].length}>
                    {module}
                  </th>
                ))}
              </tr>
              <tr className="border-b bg-slate-50">
                <th></th>
                {Object.entries(FEATURE_MODULES).map(([module, actions]) => 
                  actions.map(action => (
                    <th key={`${module}-${action}`} className="text-xs text-slate-600 py-2 px-1">
                      {action}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">
                    <Badge variant="outline">{role.rolle_name}</Badge>
                  </td>
                  {Object.entries(FEATURE_MODULES).map(([module, actions]) => 
                    actions.map(action => (
                      <td key={`${role.rolle_name}-${module}-${action}`} className="text-center px-1">
                        <Checkbox
                          checked={hasPermission(role.rolle_name, module, action)}
                          onCheckedChange={() => togglePermission(role.rolle_name, module, action)}
                        />
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}