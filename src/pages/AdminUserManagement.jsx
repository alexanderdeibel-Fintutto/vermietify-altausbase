import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfFilterBar } from '@/components/list-pages/VfFilterBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail } from 'lucide-react';
import { VfAvatar } from '@/components/shared/VfAvatar';
import { cn } from '@/lib/utils';

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    }
  });

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    return user.email.toLowerCase().includes(search.toLowerCase()) ||
           user.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6">
      <VfListPageHeader
        title="Benutzerverwaltung"
        description={`${users.length} Benutzer • ${users.filter(u => u.role === 'admin').length} Admins`}
        actions={
          <Button variant="gradient">
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer einladen
          </Button>
        }
      />

      <VfFilterBar
        searchPlaceholder="Benutzer suchen..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="vf-data-table-container">
        <table className="vf-data-table">
          <thead>
            <tr>
              <th>Benutzer</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Registriert</th>
              <th>Letzte Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <VfAvatar 
                      fallback={user.full_name || user.email} 
                      size="sm"
                    />
                    <span className="font-medium">{user.full_name || 'Kein Name'}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <Select 
                    value={user.role} 
                    onValueChange={(v) => updateRoleMutation.mutate({ userId: user.id, role: v })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="vf-table-cell-date">
                  {new Date(user.created_date).toLocaleDateString('de-DE')}
                </td>
                <td className="vf-table-cell-date">
                  {new Date(user.updated_date).toLocaleDateString('de-DE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}