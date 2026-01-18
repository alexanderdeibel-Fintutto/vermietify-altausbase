import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showSuccess('Profil aktualisiert');
    }
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Name"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
      />

      <VfInput
        label="E-Mail"
        type="email"
        value={formData.email}
        disabled
        hint="E-Mail kann nicht geändert werden"
      />

      <Button 
        variant="gradient" 
        onClick={() => updateMutation.mutate(formData)}
        disabled={updateMutation.isPending}
      >
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}