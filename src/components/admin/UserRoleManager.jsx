import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, Plus } from 'lucide-react';

export default function UserRoleManager({ companyId }) {
  const [userEmail, setUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.UserRole.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['role-assignments', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.UserRoleAssignment.filter({
        company_id: companyId,
        is_active: true
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('assignUserRole', {
        user_email: userEmail,
        role_id: selectedRole,
        company_id: companyId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments', companyId] });
      setUserEmail('');
      setSelectedRole('');
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: (assignmentId) =>
      base44.asServiceRole.entities.UserRoleAssignment.update(assignmentId, {
        is_active: false
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments', companyId] });
    }
  });

  const handleAssignRole = () => {
    if (userEmail && selectedRole) {
      assignRoleMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Assign Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rolle zuweisen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="E-Mail-Adresse"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              type="email"
            />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle auswählen" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignRole}
              disabled={!userEmail || !selectedRole || assignRoleMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Zuweisen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktuelle Zuweisungen</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Keine Rollenzuweisungen vorhanden</p>
          ) : (
            <div className="space-y-3">
              {assignments.map(assignment => {
                const role = roles.find(r => r.id === assignment.role_id);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">{assignment.user_email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          {role?.name || 'Unbekannt'}
                        </Badge>
                        {assignment.expires_at && (
                          <span className="text-xs text-slate-600">
                            Verfällt: {format(new Date(assignment.expires_at), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        )}
                      </div>
                      {assignment.notes && (
                        <p className="text-xs text-slate-600 mt-1">{assignment.notes}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRoleMutation.mutate(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}