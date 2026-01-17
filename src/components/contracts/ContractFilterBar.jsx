import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function ContractFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Mieter, Einheit suchen..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <VfSelect
          label="Status"
          value={filters.status || 'all'}
          onChange={(v) => onChange({ ...filters, status: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'active', label: 'Aktiv' },
            { value: 'ended', label: 'Beendet' },
            { value: 'draft', label: 'Entwurf' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || '-start_date'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: '-start_date', label: 'Neueste' },
            { value: 'start_date', label: 'Älteste' },
            { value: '-rent_cold', label: 'Höchste Miete' }
          ]}
        />
      </div>
    </div>
  );
}