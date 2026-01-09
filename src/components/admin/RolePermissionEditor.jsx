import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ENTITIES = [
  'financial_data',
  'reports',
  'tax_forms',
  'users',
  'settings',
  'audit_log',
  'team_members'
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'export'];

export default function RolePermissionEditor({ role, onUpdate, profiles }) {
  const [selectedProfile, setSelectedProfile] = useState(role?.permission_profile || 'custom');
  const [granularPerms, setGranularPerms] = useState(role?.granular_permissions || {});
  const [loading, setLoading] = useState(false);

  const handleApplyProfile = async (profileId) => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('manageRolePermissions', {
        action: 'set_profile',
        role_id: role.id,
        permission_profile: profileId
      });
      setSelectedProfile(profileId);
      setGranularPerms(response.data.permissions);
      toast.success(`Profil '${profileId}' angewendet`);
      onUpdate?.();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (entity, action, checked) => {
    const updated = { ...granularPerms };
    if (!updated[entity]) updated[entity] = [];
    
    if (checked) {
      updated[entity].push(action);
    } else {
      updated[entity] = updated[entity].filter(a => a !== action);
    }

    try {
      await base44.functions.invoke('manageRolePermissions', {
        action: 'set_granular',
        role_id: role.id,
        entity_name: entity,
        actions_allowed: updated[entity]
      });
      setGranularPerms(updated);
      toast.success('Berechtigungen aktualisiert');
      onUpdate?.();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles">Profile</TabsTrigger>
          <TabsTrigger value="granular">Granulare Berechtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-3 mt-4">
          <p className="text-sm text-slate-600 mb-4">
            Wählen Sie ein vordefiniertes Profil oder passen Sie Berechtigungen manuell an
          </p>
          {profiles?.map(profile => (
            <Card
              key={profile.id}
              className={`cursor-pointer transition-all ${
                selectedProfile === profile.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleApplyProfile(profile.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{profile.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{profile.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.keys(profile.permissions).slice(0, 3).map(entity => (
                        <Badge key={entity} variant="outline" className="text-xs">
                          {entity}
                        </Badge>
                      ))}
                      {Object.keys(profile.permissions).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(profile.permissions).length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedProfile === profile.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyProfile(profile.id);
                    }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Anwenden'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="granular" className="space-y-4 mt-4">
          <p className="text-sm text-slate-600 mb-4">
            Definieren Sie granulare Berechtigungen für jede Entity
          </p>
          {ENTITIES.map(entity => (
            <Card key={entity}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm capitalize">{entity}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  {ACTIONS.map(action => (
                    <label
                      key={`${entity}-${action}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={(granularPerms[entity] || []).includes(action)}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(entity, action, checked)
                        }
                      />
                      <span className="text-xs capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}