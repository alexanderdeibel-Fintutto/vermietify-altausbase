import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Plus, Trash2, Edit2 } from 'lucide-react';

export default function WorkflowRoleManager({ companyId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState(''); // 'user' or 'group'
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['workflow-roles', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowRole.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['workflow-role-assignments', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowRoleAssignment.filter({
        company_id: companyId,
        is_active: true
      });
      return result;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.User.list();
      return result;
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.UserGroup.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('assignWorkflowRole', {
        company_id: companyId,
        role_id: selectedRole,
        user_email: selectedType === 'user' ? selectedTarget : null,
        group_id: selectedType === 'group' ? selectedTarget : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-role-assignments'] });
      setShowDialog(false);
      setSelectedType('');
      setSelectedRole('');
      setSelectedTarget('');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (assignmentId) =>
      base44.asServiceRole.entities.WorkflowRoleAssignment.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-role-assignments'] });
    }
  });

  const getTargetName = (assignment) => {
    if (assignment.user_email) {
      return assignment.user_email;
    }
    const group = groups.find(g => g.id === assignment.group_id);
    return group?.name || 'Unknown Group';
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.display_name || roleId;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Workflow-Rollen-Management
        </h3>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Rolle zuweisen
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Workflow-Rolle zuweisen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Target Type */}
            <div>
              <label className="text-sm font-medium">Zieltyp</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Benutzer</SelectItem>
                  <SelectItem value="group">Gruppe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selection */}
            {selectedType && (
              <div>
                <label className="text-sm font-medium">
                  {selectedType === 'user' ? 'Benutzer' : 'Gruppe'} wählen
                </label>
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType === 'user' ? (
                      users.map(user => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))
                    ) : (
                      groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium">Rolle</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Rolle wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={() => assignMutation.mutate()}
                disabled={!selectedType || !selectedTarget || !selectedRole || assignMutation.isPending}
                className="flex-1"
              >
                {assignMutation.isPending ? 'Zuweisen...' : 'Zuweisen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Assignments */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Aktive Zuweisungen</h4>
        {assignments.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Rollenzuweisungen
            </CardContent>
          </Card>
        ) : (
          assignments.map(assignment => (
            <Card key={assignment.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getTargetName(assignment)}</p>
                    <Badge className="mt-2">{getRoleName(assignment.role_id)}</Badge>
                    {assignment.expires_at && (
                      <p className="text-xs text-slate-600 mt-2">
                        Expires: {new Date(assignment.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => revokeMutation.mutate(assignment.id)}
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

      {/* Role Definitions */}
      <div className="pt-4 border-t">
        <h4 className="font-medium text-sm mb-3">Rollendefinitionen</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {roles.map(role => (
            <Card key={role.id} className="bg-slate-50">
              <CardContent className="pt-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{role.display_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(role.permissions).map(([perm, allowed]) =>
                        allowed ? (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </div>
                  {role.is_default && (
                    <Badge className="ml-2 bg-blue-100 text-blue-700">Standard</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}