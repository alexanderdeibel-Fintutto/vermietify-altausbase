import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiUserRoleManager() {
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAllUsers', {});
      return response.data.users;
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.functions.invoke('updateUserRole', { user_id: userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Rolle aktualisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Benutzer-Rechteverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            <Select
              value={user.role}
              onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Benutzer</SelectItem>
                <SelectItem value="viewer">Nur Ansicht</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}