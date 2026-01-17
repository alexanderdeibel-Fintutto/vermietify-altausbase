import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function UnitForm({ unit, buildingId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    building_id: unit?.building_id || buildingId,
    unit_number: unit?.unit_number || '',
    unit_type: unit?.unit_type || 'apartment',
    living_area: unit?.living_area || '',
    rooms: unit?.rooms || '',
    rent_cold: unit?.rent_cold || '',
    status: unit?.status || 'vacant'
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Einheitsnummer"
        required
        placeholder="z.B. 1A, EG links"
        value={formData.unit_number}
        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
      />

      <VfSelect
        label="Typ"
        value={formData.unit_type}
        onChange={(v) => setFormData({ ...formData, unit_type: v })}
        options={[
          { value: 'apartment', label: 'Wohnung' },
          { value: 'commercial', label: 'Gewerbe' },
          { value: 'parking', label: 'Stellplatz' },
          { value: 'storage', label: 'Lagerraum' }
        ]}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <VfInput
          label="Wohnfläche (m²)"
          type="number"
          value={formData.living_area}
          onChange={(e) => setFormData({ ...formData, living_area: e.target.value })}
        />
        <VfInput
          label="Zimmer"
          type="number"
          step="0.5"
          value={formData.rooms}
          onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
        />
      </div>

      <VfInput
        label="Kaltmiete (€)"
        type="number"
        value={formData.rent_cold}
        onChange={(e) => setFormData({ ...formData, rent_cold: e.target.value })}
      />

      <VfSelect
        label="Status"
        value={formData.status}
        onChange={(v) => setFormData({ ...formData, status: v })}
        options={[
          { value: 'vacant', label: 'Leer' },
          { value: 'occupied', label: 'Vermietet' },
          { value: 'maintenance', label: 'In Wartung' }
        ]}
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