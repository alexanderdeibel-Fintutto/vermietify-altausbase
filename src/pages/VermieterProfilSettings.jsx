import React, { useState } from 'react';
import { VfSettingsLayout } from '@/components/shared/VfSettingsLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfButton } from '@/components/shared/VfButton';
import { VfAvatar } from '@/components/shared/VfAvatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, Upload } from 'lucide-react';

export default function VermieterProfilSettings() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    company_name: user?.company_name || '',
    language: user?.language || 'de',
    timezone: user?.timezone || 'Europe/Berlin',
    currency: user?.currency || 'EUR'
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <VfSettingsLayout activeSection="profile">
      <div className="vf-settings__section">
        <h1 className="vf-settings__section-title">Profil</h1>

        <form onSubmit={handleSubmit}>
          <div className="vf-form-section">
            <div className="vf-form-section__title">Profilbild</div>
            <div className="flex items-center gap-4">
              <VfAvatar 
                src={user?.avatar} 
                fallback={user?.full_name} 
                size="xl" 
              />
              <VfButton variant="outline" icon={Upload}>
                Bild ändern
              </VfButton>
            </div>
          </div>

          <div className="vf-form-section">
            <div className="vf-form-section__title">Persönliche Daten</div>
            
            <div className="vf-form-row">
              <VfInput
                label="Name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Max Mustermann"
              />
              <VfInput
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 170 1234567"
              />
            </div>

            <VfInput
              label="E-Mail"
              value={user?.email || ''}
              disabled
              hint="E-Mail kann nicht geändert werden"
            />
          </div>

          <div className="vf-form-section">
            <div className="vf-form-section__title">Firmendaten</div>
            <VfInput
              label="Firmenname"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Mustermann Immobilien GmbH"
            />
          </div>

          <div className="vf-form-section">
            <div className="vf-form-section__title">Präferenzen</div>
            
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
                label="Zeitzone"
                value={formData.timezone}
                onChange={(v) => setFormData({ ...formData, timezone: v })}
                options={[
                  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
                  { value: 'Europe/Vienna', label: 'Europe/Vienna' },
                  { value: 'Europe/Zurich', label: 'Europe/Zurich' }
                ]}
              />
            </div>

            <div className="vf-form-row">
              <VfSelect
                label="Währung"
                value={formData.currency}
                onChange={(v) => setFormData({ ...formData, currency: v })}
                options={[
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'CHF', label: 'CHF (Fr.)' }
                ]}
              />
            </div>
          </div>

          <VfButton 
            type="submit" 
            variant="gradient"
            icon={Save}
            loading={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </VfButton>
        </form>
      </div>
    </VfSettingsLayout>
  );
}