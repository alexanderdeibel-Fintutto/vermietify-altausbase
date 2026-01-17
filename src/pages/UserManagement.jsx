import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import InviteUserDialog from '@/components/users/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import TimeAgo from '@/components/shared/TimeAgo';

export default function UserManagement() {
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Benutzerverwaltung"
        subtitle={`${users.length} Benutzer`}
        actions={
          <Button variant="gradient" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer einladen
          </Button>
        }
      />

      <div className="mt-6 vf-table-container">
        <table className="vf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusBadge status={user.role} />
                </td>
                <td>
                  <TimeAgo date={user.created_date} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}