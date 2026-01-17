import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function TenantForm({ tenant, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    birth_date: tenant?.birth_date || '',
    notes: tenant?.notes || ''
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <div className="grid md:grid-cols-2 gap-4">
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

      <VfInput
        label="Geburtsdatum"
        type="date"
        value={formData.birth_date}
        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
      />

      <VfTextarea
        label="Notizen"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button 
          variant="gradient"
          onClick={() => onSubmit(formData)}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}