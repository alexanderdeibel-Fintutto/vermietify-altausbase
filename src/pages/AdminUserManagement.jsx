import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPage, VfListPageHeader } from '@/components/list-pages/VfListPage';
import { VfDataTable } from '@/components/list-pages/VfDataTable';
import { Button } from '@/components/ui/button';
import { VfBadge } from '@/components/shared/VfBadge';
import { UserPlus, Mail, Shield } from 'lucide-react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, data.role);
      await base44.functions.invoke('sendWelcomeEmail', {
        email: data.email,
        name: '',
        user_type: 'vermieter'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setShowInviteDialog(false);
      setInviteData({ email: '', role: 'user' });
    }
  });

  const columns = [
    { key: 'full_name', label: 'Name', sortable: true },
    { key: 'email', label: 'E-Mail', sortable: true },
    { 
      key: 'role', 
      label: 'Rolle',
      render: (row) => (
        <VfBadge variant={row.role === 'admin' ? 'accent' : 'default'}>
          <Shield className="h-3 w-3 mr-1" />
          {row.role}
        </VfBadge>
      )
    },
    { 
      key: 'created_date', 
      label: 'Registriert',
      render: (row) => new Date(row.created_date).toLocaleDateString('de-DE')
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.open(`mailto:${row.email}`)}
        >
          <Mail className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <VfListPage>
      <VfListPageHeader
        title="Benutzer-Verwaltung"
        description={`${users.length} Benutzer registriert`}
        actions={
          <Button variant="gradient" onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer einladen
          </Button>
        }
      />

      <VfDataTable columns={columns} data={users} />

      <VfModal
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        title="Benutzer einladen"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInviteDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="gradient"
              onClick={() => inviteMutation.mutate(inviteData)}
              disabled={!inviteData.email}
            >
              Einladung senden
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <VfInput
            label="E-Mail"
            type="email"
            required
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            placeholder="benutzer@example.com"
          />
          
          <VfSelect
            label="Rolle"
            value={inviteData.role}
            onChange={(v) => setInviteData({ ...inviteData, role: v })}
            options={[
              { value: 'user', label: 'Benutzer' },
              { value: 'admin', label: 'Administrator' }
            ]}
          />
        </div>
      </VfModal>
    </VfListPage>
  );
}