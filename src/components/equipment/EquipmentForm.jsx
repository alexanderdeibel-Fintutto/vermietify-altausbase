import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function EquipmentForm({ equipment, onSubmit }) {
  const [formData, setFormData] = useState(equipment || {
    name: '',
    category: '',
    manufacturer: '',
    installation_date: '',
    next_maintenance: ''
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
        label="Kategorie"
        value={formData.category}
        onChange={(v) => setFormData({ ...formData, category: v })}
        options={[
          { value: 'heating', label: 'Heizung' },
          { value: 'elevator', label: 'Aufzug' },
          { value: 'boiler', label: 'Warmwasser' },
          { value: 'hvac', label: 'Lüftung' }
        ]}
      />

      <VfInput
        label="Hersteller"
        value={formData.manufacturer}
        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
      />

      <VfDatePicker
        label="Installationsdatum"
        value={formData.installation_date}
        onChange={(v) => setFormData({ ...formData, installation_date: v })}
      />

      <VfDatePicker
        label="Nächste Wartung"
        value={formData.next_maintenance}
        onChange={(v) => setFormData({ ...formData, next_maintenance: v })}
      />

      <Button variant="gradient" className="w-full" onClick={() => onSubmit(formData)}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}