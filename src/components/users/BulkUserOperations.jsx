import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserX, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkUserOperations() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers;
    }
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: () => base44.asServiceRole.entities.Role.list()
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ userIds, roleId }) => {
      const promises = userIds.map(userId => 
        base44.functions.invoke('assignRoleToUser', {
          userId,
          roleId,
          validFrom: new Date().toISOString().split('T')[0]
        })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`Rolle ${selectedUsers.length} Benutzern zugewiesen`);
      setSelectedUsers([]);
    }
  });

  const bulkActivateMutation = useMutation({
    mutationFn: async (userIds) => {
      const promises = userIds.map(userId =>
        base44.asServiceRole.entities.User.update(userId, { is_tester: true })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(`${selectedUsers.length} Benutzer als Tester aktiviert`);
      setSelectedUsers([]);
    }
  });

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) return;
    
    switch(bulkAction) {
      case 'assign_role':
        if (!targetRole) {
          toast.error('Bitte Rolle auswählen');
          return;
        }
        bulkAssignMutation.mutate({ userIds: selectedUsers, roleId: targetRole });
        break;
      case 'activate_tester':
        bulkActivateMutation.mutate(selectedUsers);
        break;
      default:
        toast.error('Bitte Aktion auswählen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk-Operationen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Aktion wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assign_role">Rolle zuweisen</SelectItem>
                <SelectItem value="activate_tester">Als Tester aktivieren</SelectItem>
              </SelectContent>
            </Select>

            {bulkAction === 'assign_role' && (
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Rolle wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button 
              onClick={handleBulkAction}
              disabled={selectedUsers.length === 0 || !bulkAction}
            >
              Ausführen ({selectedUsers.length})
            </Button>
          </div>

          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {users.map(user => (
                <div 
                  key={user.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    selectedUsers.includes(user.id) ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => handleToggleUser(user.id)}
                >
                  <Checkbox 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleToggleUser(user.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-sm text-slate-600">{user.email}</div>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                  {user.is_tester && <Badge variant="secondary">Tester</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}