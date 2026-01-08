import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Wand2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    category: 'custom',
    selectedModules: [],
    selectedPermissions: []
  });
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.asServiceRole.entities.Permission.filter({ is_active: true })
  });

  const modules = [...new Set(permissions.map(p => p.module))];
  
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const selectedPerms = roleData.selectedModules.flatMap(module => 
        permissionsByModule[module]?.map(p => p.id) || []
      );
      
      return await base44.asServiceRole.entities.Role.create({
        name: roleData.name,
        description: roleData.description,
        category: roleData.category,
        is_predefined: false,
        is_active: true,
        permissions: [...selectedPerms, ...roleData.selectedPermissions]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rolle erfolgreich erstellt');
      onComplete?.();
    }
  });

  const toggleModule = (module) => {
    setRoleData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(module)
        ? prev.selectedModules.filter(m => m !== module)
        : [...prev.selectedModules, module]
    }));
  };

  const togglePermission = (permId) => {
    setRoleData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permId)
        ? prev.selectedPermissions.filter(id => id !== permId)
        : [...prev.selectedPermissions, permId]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Rollen-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s < step ? 'bg-green-600 text-white' :
                s === step ? 'bg-blue-600 text-white' :
                'bg-slate-200 text-slate-600'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className="w-20 h-0.5 bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rollen-Name</label>
              <Input
                placeholder="z.B. Hauswart"
                value={roleData.name}
                onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                placeholder="Was macht diese Rolle?"
                value={roleData.description}
                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Wählen Sie Module aus. Alle Permissions des Moduls werden automatisch hinzugefügt.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {modules.map(module => (
                <div key={module} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={roleData.selectedModules.includes(module)}
                    onCheckedChange={() => toggleModule(module)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{module}</div>
                    <div className="text-xs text-slate-500">
                      {permissionsByModule[module]?.length || 0} Permissions
                    </div>
                  </div>
                  {roleData.selectedModules.includes(module) && (
                    <Badge variant="secondary">Ausgewählt</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Feinabstimmung: Zusätzliche Permissions hinzufügen.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {permissions.filter(p => !roleData.selectedModules.includes(p.module)).map(perm => (
                <div key={perm.id} className="flex items-center gap-3 p-2 border rounded">
                  <Checkbox
                    checked={roleData.selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{perm.name}</div>
                    <Badge variant="outline" className="text-xs">{perm.module}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !roleData.name}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => createRoleMutation.mutate()}
              disabled={createRoleMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Rolle erstellen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}