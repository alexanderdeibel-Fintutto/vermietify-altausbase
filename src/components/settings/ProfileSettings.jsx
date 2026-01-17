import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { User, Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function ProfileSettings() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || ''
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      showSuccess('Profil aktualisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil-Einstellungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-xl">
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
          />

          <VfInput
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <VfInput
            label="Firma"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />

          <Button 
            variant="gradient"
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}