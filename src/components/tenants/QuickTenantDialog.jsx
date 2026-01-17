import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';

export default function QuickTenantDialog({ open, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
      setFormData({ name: '', email: '', phone: '' });
      onClose();
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
          <Button 
            variant="gradient"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Erstellen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfInput
          label="Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <VfInput
          label="E-Mail"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <VfInput
          label="Telefon"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
    </VfModal>
  );
}