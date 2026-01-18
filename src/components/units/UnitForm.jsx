import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function UnitForm({ unit, onSubmit }) {
  const [formData, setFormData] = useState(unit || {
    building_id: '',
    einheit_nummer: '',
    typ: 'Wohnung',
    flaeche: '',
    zimmer: '',
    stockwerk: '',
    beschreibung: ''
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Einheit-Nummer"
        required
        placeholder="z.B. 3B, EG rechts"
        value={formData.einheit_nummer}
        onChange={(e) => setFormData({ ...formData, einheit_nummer: e.target.value })}
      />

      <VfSelect
        label="Typ"
        value={formData.typ}
        onChange={(v) => setFormData({ ...formData, typ: v })}
        options={[
          { value: 'Wohnung', label: 'Wohnung' },
          { value: 'Gewerbe', label: 'Gewerbe' },
          { value: 'Lager', label: 'Lager' },
          { value: 'Garage', label: 'Garage' }
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <VfInput
          label="Fläche"
          type="number"
          rightAddon="m²"
          value={formData.flaeche}
          onChange={(e) => setFormData({ ...formData, flaeche: e.target.value })}
        />

        <VfInput
          label="Zimmer"
          type="number"
          value={formData.zimmer}
          onChange={(e) => setFormData({ ...formData, zimmer: e.target.value })}
        />
      </div>

      <VfInput
        label="Stockwerk"
        placeholder="z.B. EG, 1. OG"
        value={formData.stockwerk}
        onChange={(e) => setFormData({ ...formData, stockwerk: e.target.value })}
      />

      <VfTextarea
        label="Beschreibung"
        value={formData.beschreibung}
        onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
        rows={3}
      />

      <Button variant="gradient" className="w-full" onClick={() => onSubmit(formData)}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}