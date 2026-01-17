import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Building, Globe, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsProfile() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company_name: user?.company_name || '',
    language: user?.language || 'de',
    timezone: user?.timezone || 'Europe/Berlin',
    date_format: user?.date_format || 'DD.MM.YYYY',
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
    <div className="vf-settings">
      <div className="vf-settings__nav">
        <div className="vf-settings__nav-item vf-settings__nav-item--active">
          <User className="h-4 w-4" />
          Profil
        </div>
        <div className="vf-settings__nav-item">
          <Building className="h-4 w-4" />
          Firma
        </div>
        <div className="vf-settings__nav-item">
          <Globe className="h-4 w-4" />
          Einstellungen
        </div>
      </div>

      <div className="vf-settings__content">
        <div className="vf-settings__section">
          <h1 className="vf-settings__section-title">Profil</h1>

          <form onSubmit={handleSubmit}>
            <div className="vf-form-section">
              <div className="vf-form-section__title">Persönliche Daten</div>
              
              <div className="vf-form-row">
                <div>
                  <Label required>Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 170 1234567"
                  />
                </div>
              </div>

              <div>
                <Label required>E-Mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-[var(--theme-surface)]"
                />
                <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                  E-Mail kann nicht geändert werden
                </p>
              </div>
            </div>

            <div className="vf-form-section">
              <div className="vf-form-section__title">Firmendaten</div>
              
              <div>
                <Label>Firmenname</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Mustermann Immobilien GmbH"
                />
              </div>
            </div>

            <div className="vf-form-section">
              <div className="vf-form-section__title">Präferenzen</div>
              
              <div className="vf-form-row">
                <div>
                  <Label>Sprache</Label>
                  <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zeitzone</Label>
                  <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                      <SelectItem value="Europe/Vienna">Europe/Vienna</SelectItem>
                      <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="vf-form-row">
                <div>
                  <Label>Datumsformat</Label>
                  <Select value={formData.date_format} onValueChange={(v) => setFormData({ ...formData, date_format: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Währung</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gradient"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}