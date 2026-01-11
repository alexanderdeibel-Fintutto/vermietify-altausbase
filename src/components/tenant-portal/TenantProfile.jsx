import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantProfile({ tenant }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: tenant?.first_name || '',
    last_name: tenant?.last_name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    date_of_birth: tenant?.date_of_birth || '',
    notes: tenant?.notes || ''
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.update(tenant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantData'] });
      setIsEditing(false);
      toast.success('Profil aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      first_name: tenant?.first_name || '',
      last_name: tenant?.last_name || '',
      email: tenant?.email || '',
      phone: tenant?.phone || '',
      date_of_birth: tenant?.date_of_birth || '',
      notes: tenant?.notes || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Persönliche Daten */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Persönliche Daten</CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Bearbeiten
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Speichern
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Abbrechen
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Vorname</label>
              {isEditing ? (
                <Input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-slate-900">{tenant?.first_name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Nachname</label>
              {isEditing ? (
                <Input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-slate-900">{tenant?.last_name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">E-Mail</label>
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-slate-900">{tenant?.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Telefon</label>
              {isEditing ? (
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-slate-900">{tenant?.phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Geburtsdatum</label>
              {isEditing ? (
                <Input
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-slate-900">{tenant?.date_of_birth || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zusätzliche Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ihre Notizen..."
              className="min-h-24"
            />
          ) : (
            <p className="text-slate-700">{tenant?.notes || 'Keine zusätzlichen Informationen'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}