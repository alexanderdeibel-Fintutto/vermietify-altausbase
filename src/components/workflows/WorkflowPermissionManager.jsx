import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Lock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function WorkflowPermissionManager({ workflowId, companyId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [grantType, setGrantType] = useState('user');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [permissions, setPermissions] = useState({
    view: false,
    execute: false,
    edit: false,
    manage: false
  });
  const queryClient = useQueryClient();

  const { data: permissions_list = [], isLoading } = useQuery({
    queryKey: ['workflow-permissions', workflowId],
    queryFn: () =>
      base44.functions.invoke('getWorkflowPermissions', {
        workflow_id: workflowId,
        company_id: companyId
      }).then(res => res.data?.permissions || [])
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.CustomRole.filter({
        company_id: companyId,
        is_active: true
      });
      return result;
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.UserGroup.filter({
        company_id: companyId,
        is_active: true
      });
      return result;
    }
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageWorkflowPermissions', {
        company_id: companyId,
        workflow_id: workflowId,
        action: 'grant',
        role_id: grantType === 'role' ? selectedTarget : undefined,
        user_email: grantType === 'user' ? selectedTarget : undefined,
        group_id: grantType === 'group' ? selectedTarget : undefined,
        permissions
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-permissions'] });
      setShowDialog(false);
      setSelectedTarget('');
      setPermissions({ view: false, execute: false, edit: false, manage: false });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (permId) =>
      base44.functions.invoke('manageWorkflowPermissions', {
        company_id: companyId,
        workflow_id: workflowId,
        action: 'revoke',
        role_id: permId.role_id,
        user_email: permId.user_email,
        group_id: permId.group_id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-permissions'] });
    }
  });

  const togglePermission = (perm) => {
    setPermissions(prev => ({
      ...prev,
      [perm]: !prev[perm]
    }));
  };

  if (isLoading) return <div className="text-center py-4">Lädt Berechtigungen...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Workflow-Berechtigungen
        </h3>
        <Button
          onClick={() => setShowDialog(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Berechtigung erteilen
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Berechtigung erteilen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Berechtigungstyp</label>
              <Select value={grantType} onValueChange={setGrantType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Benutzer</SelectItem>
                  <SelectItem value="role">Rolle</SelectItem>
                  <SelectItem value="group">Gruppe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {grantType === 'user' && 'E-Mail-Adresse'}
                {grantType === 'role' && 'Rolle'}
                {grantType === 'group' && 'Gruppe'}
              </label>
              {grantType === 'user' ? (
                <Input
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  placeholder="benutzer@example.com"
                  className="mt-1"
                />
              ) : (
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(grantType === 'role' ? roles : groups).map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Berechtigungen</label>
              <div className="space-y-2 p-3 border rounded-lg bg-slate-50">
                {[
                  { key: 'view', label: 'Anzeigen', desc: 'Workflow anzeigen' },
                  { key: 'execute', label: 'Ausführen', desc: 'Workflow starten' },
                  { key: 'edit', label: 'Bearbeiten', desc: 'Workflow ändern' },
                  { key: 'manage', label: 'Verwalten', desc: 'Berechtigungen ändern' }
                ].map(p => (
                  <label key={p.key} className="flex items-start gap-2 cursor-pointer hover:bg-white p-2 rounded">
                    <Checkbox
                      checked={permissions[p.key]}
                      onCheckedChange={() => togglePermission(p.key)}
                    />
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-slate-600">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={() => grantMutation.mutate()}
                disabled={!selectedTarget || !Object.values(permissions).some(p => p) || grantMutation.isPending}
                className="flex-1"
              >
                {grantMutation.isPending ? 'Wird erteilt...' : 'Erteilen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions List */}
      <div className="space-y-2">
        {permissions_list.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Berechtigungen erteilt
            </CardContent>
          </Card>
        ) : (
          permissions_list.map(perm => (
            <Card key={perm.id} className={perm.is_expired ? 'opacity-60' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {perm.target_info?.type === 'user' && perm.target_info?.email}
                        {perm.target_info?.type === 'role' && `[Rolle] ${perm.target_info?.name}`}
                        {perm.target_info?.type === 'group' && `[Gruppe] ${perm.target_info?.name} (${perm.target_info?.members_count})`}
                      </h4>
                      {perm.is_expired && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Abgelaufen
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {perm.permissions?.view && <Badge className="text-xs">Ansicht</Badge>}
                      {perm.permissions?.execute && <Badge className="text-xs">Ausführung</Badge>}
                      {perm.permissions?.edit && <Badge className="text-xs">Bearbeitung</Badge>}
                      {perm.permissions?.manage && <Badge className="text-xs">Verwaltung</Badge>}
                    </div>

                    <p className="text-xs text-slate-600">
                      Erteilt von: {perm.granted_by}
                      {perm.expires_at && (
                        <span> • Läuft ab: {format(new Date(perm.expires_at), 'dd.MM.yyyy', { locale: de })}</span>
                      )}
                    </p>
                    {perm.notes && <p className="text-xs text-slate-600 mt-1">{perm.notes}</p>}
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => revokeMutation.mutate(perm)}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}