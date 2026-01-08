import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkUserOperations() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.asServiceRole.entities.Role.filter({ is_active: true })
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedUsers.map(userId =>
        base44.functions.invoke('assignRoleToUser', {
          userId,
          roleId: selectedRole,
          validFrom: new Date().toISOString().split('T')[0]
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      toast.success(`Rolle zu ${selectedUsers.length} Benutzern zugewiesen`);
      setSelectedUsers([]);
    }
  });

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    setSelectedUsers(prev => prev.length === users.length ? [] : users.map(u => u.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Bulk-Operationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b">
          <Checkbox
            checked={selectedUsers.length === users.length}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm font-medium">
            Alle auswählen ({selectedUsers.length} ausgewählt)
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-2 border rounded-lg">
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={() => toggleUser(user.id)}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{user.full_name || user.email}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-3 border-t">
          <div>
            <label className="text-sm font-medium">Rolle zuweisen</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => assignRoleMutation.mutate()}
            disabled={selectedUsers.length === 0 || !selectedRole || assignRoleMutation.isPending}
            className="w-full"
          >
            {assignRoleMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verarbeite...</>
            ) : (
              `Rolle zu ${selectedUsers.length} Benutzern zuweisen`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}