import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function ContractForm({ contract, onSubmit }) {
  const [formData, setFormData] = useState(contract || {
    unit_id: '',
    tenant_id: '',
    beginn_datum: '',
    ende_datum: '',
    kaltmiete: '',
    nebenkosten_vorauszahlung: '',
    kaution: ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <VfDatePicker
          label="Beginn"
          required
          value={formData.beginn_datum}
          onChange={(v) => setFormData({ ...formData, beginn_datum: v })}
        />
        <VfDatePicker
          label="Ende"
          value={formData.ende_datum}
          onChange={(v) => setFormData({ ...formData, ende_datum: v })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <VfInput
          label="Kaltmiete"
          type="number"
          rightAddon="€"
          required
          value={formData.kaltmiete}
          onChange={(e) => setFormData({ ...formData, kaltmiete: e.target.value })}
        />
        <VfInput
          label="Nebenkosten"
          type="number"
          rightAddon="€"
          value={formData.nebenkosten_vorauszahlung}
          onChange={(e) => setFormData({ ...formData, nebenkosten_vorauszahlung: e.target.value })}
        />
        <VfInput
          label="Kaution"
          type="number"
          rightAddon="€"
          value={formData.kaution}
          onChange={(e) => setFormData({ ...formData, kaution: e.target.value })}
        />
      </div>

      <Button variant="gradient" className="w-full" onClick={() => onSubmit(formData)}>
        <Save className="h-4 w-4 mr-2" />
        Speichern
      </Button>
    </div>
  );
}