import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function EquipmentForm({ equipment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: equipment?.name || '',
    equipment_type: equipment?.equipment_type || 'heating',
    location: equipment?.location || '',
    purchase_date: equipment?.purchase_date || '',
    last_maintenance: equipment?.last_maintenance || '',
    status: equipment?.status || 'active'
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Bezeichnung"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <VfSelect
        label="Typ"
        value={formData.equipment_type}
        onChange={(v) => setFormData({ ...formData, equipment_type: v })}
        options={[
          { value: 'heating', label: 'Heizung' },
          { value: 'elevator', label: 'Aufzug' },
          { value: 'hvac', label: 'Lüftung' },
          { value: 'plumbing', label: 'Sanitär' },
          { value: 'electrical', label: 'Elektrik' }
        ]}
      />

      <VfInput
        label="Standort"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />

      <VfDatePicker
        label="Kaufdatum"
        value={formData.purchase_date}
        onChange={(v) => setFormData({ ...formData, purchase_date: v })}
      />

      <VfDatePicker
        label="Letzte Wartung"
        value={formData.last_maintenance}
        onChange={(v) => setFormData({ ...formData, last_maintenance: v })}
      />

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button variant="gradient" onClick={() => onSubmit(formData)} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}