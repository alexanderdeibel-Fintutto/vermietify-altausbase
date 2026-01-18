import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function SettingsProfile() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    language: 'de',
    timezone: 'Europe/Berlin',
    currency: 'EUR'
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showSuccess('Profil aktualisiert');
    }
  });

  return (
    <div className="vf-settings__section">
      <h2 className="vf-settings__section-title">Profil</h2>

      <div className="vf-form-section">
        <h3 className="vf-form-section__title">Persönliche Daten</h3>
        <div className="vf-form-row">
          <VfInput
            label="Vollständiger Name"
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
        </div>
        <VfInput
          label="Telefon"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="vf-form-section">
        <h3 className="vf-form-section__title">Einstellungen</h3>
        <div className="vf-form-row">
          <VfSelect
            label="Sprache"
            value={formData.language}
            onChange={(v) => setFormData({ ...formData, language: v })}
            options={[
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' }
            ]}
          />
          <VfSelect
            label="Währung"
            value={formData.currency}
            onChange={(v) => setFormData({ ...formData, currency: v })}
            options={[
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'CHF', label: 'Schweizer Franken (CHF)' }
            ]}
          />
        </div>
      </div>

      <Button 
        variant="gradient" 
        onClick={() => updateMutation.mutate(formData)}
        disabled={updateMutation.isPending}
      >
        <Save className="h-4 w-4 mr-2" />
        Änderungen speichern
      </Button>
    </div>
  );
}