import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { VfRadio } from '@/components/shared/VfRadio';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function InviteUserDialog({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      showSuccess('Einladung gesendet', 'Der Benutzer erhält eine E-Mail');
      setEmail('');
      setRole('user');
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Benutzer einladen"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => inviteMutation.mutate({ email, role })}
            disabled={!email || inviteMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {inviteMutation.isPending ? 'Lädt...' : 'Einladen'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfInput
          type="email"
          label="E-Mail-Adresse"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />

        <VfRadio
          label="Rolle"
          value={role}
          onValueChange={setRole}
          options={[
            { value: 'user', label: 'Benutzer - Normaler Zugriff' },
            { value: 'admin', label: 'Admin - Voller Zugriff' }
          ]}
        />
      </div>
    </VfModal>
  );
}