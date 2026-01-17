import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function InviteUserDialog({ open, onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'user'
  });

  const inviteMutation = useMutation({
    mutationFn: () => base44.users.inviteUser(formData.email, formData.role),
    onSuccess: () => {
      showSuccess('Einladung versendet');
      setFormData({ email: '', role: 'user' });
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
            onClick={() => inviteMutation.mutate()}
            disabled={!formData.email || inviteMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Einladen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfInput
          label="E-Mail-Adresse"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <VfSelect
          label="Rolle"
          value={formData.role}
          onChange={(v) => setFormData({ ...formData, role: v })}
          options={[
            { value: 'user', label: 'Benutzer' },
            { value: 'admin', label: 'Administrator' }
          ]}
        />
      </div>
    </VfModal>
  );
}