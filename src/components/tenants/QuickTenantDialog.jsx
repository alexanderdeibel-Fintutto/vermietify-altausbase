import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function QuickTenantDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [tenant, setTenant] = useState({ name: '', email: '', phone: '' });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      showSuccess('Mieter erstellt');
      onClose();
      setTenant({ name: '', email: '', phone: '' });
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Neuer Mieter"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="gradient" onClick={() => createMutation.mutate(tenant)}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfInput
          label="Name"
          required
          value={tenant.name}
          onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
        />
        <VfInput
          label="E-Mail"
          type="email"
          value={tenant.email}
          onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
        />
        <VfInput
          label="Telefon"
          value={tenant.phone}
          onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
        />
      </div>
    </VfModal>
  );
}