import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function InvoiceForm({ invoice, onSubmit }) {
  const [formData, setFormData] = useState(invoice || {
    rechnungsnummer: '',
    lieferant: '',
    betrag: '',
    datum: '',
    faelligkeitsdatum: '',
    kategorie: '',
    beschreibung: ''
  });

  return (
    <div className="space-y-4">
      <VfInput
        label="Rechnungsnummer"
        required
        value={formData.rechnungsnummer}
        onChange={(e) => setFormData({ ...formData, rechnungsnummer: e.target.value })}
      />

      <VfInput
        label="Lieferant"
        required
        value={formData.lieferant}
        onChange={(e) => setFormData({ ...formData, lieferant: e.target.value })}
      />

      <VfInput
        label="Betrag"
        type="number"
        rightAddon="€"
        required
        value={formData.betrag}
        onChange={(e) => setFormData({ ...formData, betrag: e.target.value })}
      />

      <VfDatePicker
        label="Rechnungsdatum"
        value={formData.datum}
        onChange={(v) => setFormData({ ...formData, datum: v })}
      />

      <VfDatePicker
        label="Fälligkeitsdatum"
        value={formData.faelligkeitsdatum}
        onChange={(v) => setFormData({ ...formData, faelligkeitsdatum: v })}
      />

      <VfSelect
        label="Kategorie"
        value={formData.kategorie}
        onChange={(v) => setFormData({ ...formData, kategorie: v })}
        options={[
          { value: 'maintenance', label: 'Instandhaltung' },
          { value: 'insurance', label: 'Versicherung' },
          { value: 'utilities', label: 'Nebenkosten' },
          { value: 'tax', label: 'Steuern' }
        ]}
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