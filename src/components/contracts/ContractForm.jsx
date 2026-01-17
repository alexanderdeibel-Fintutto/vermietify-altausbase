import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ContractForm({ contract, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    tenant_id: contract?.tenant_id || '',
    unit_id: contract?.unit_id || '',
    start_date: contract?.start_date || '',
    rent_cold: contract?.rent_cold || '',
    rent_warm: contract?.rent_warm || '',
    status: contract?.status || 'active'
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const tenantOptions = tenants.map(t => ({ value: t.id, label: t.name }));
  const unitOptions = units.map(u => ({ value: u.id, label: u.unit_number || u.name }));

  return (
    <div className="space-y-4">
      <SearchableSelect
        label="Mieter"
        options={tenantOptions}
        value={formData.tenant_id}
        onChange={(v) => setFormData({ ...formData, tenant_id: v })}
      />

      <SearchableSelect
        label="Einheit"
        options={unitOptions}
        value={formData.unit_id}
        onChange={(v) => setFormData({ ...formData, unit_id: v })}
      />

      <VfDatePicker
        label="Mietbeginn"
        value={formData.start_date}
        onChange={(v) => setFormData({ ...formData, start_date: v })}
      />

      <VfInput
        label="Kaltmiete (€)"
        type="number"
        value={formData.rent_cold}
        onChange={(e) => setFormData({ ...formData, rent_cold: e.target.value })}
      />

      <VfInput
        label="Warmmiete (€)"
        type="number"
        value={formData.rent_warm}
        onChange={(e) => setFormData({ ...formData, rent_warm: e.target.value })}
      />

      <VfSelect
        label="Status"
        value={formData.status}
        onChange={(v) => setFormData({ ...formData, status: v })}
        options={[
          { value: 'active', label: 'Aktiv' },
          { value: 'draft', label: 'Entwurf' },
          { value: 'ended', label: 'Beendet' }
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