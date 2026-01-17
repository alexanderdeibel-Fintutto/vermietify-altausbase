import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function DocumentFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-4 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Dokument suchen..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <VfSelect
          label="Typ"
          value={filters.type || 'all'}
          onChange={(v) => onChange({ ...filters, type: v })}
          options={[
            { value: 'all', label: 'Alle Typen' },
            { value: 'Mietvertrag', label: 'Mietvertrag' },
            { value: 'Rechnung', label: 'Rechnung' },
            { value: 'BK-Abrechnung', label: 'BK-Abrechnung' },
            { value: 'Sonstige', label: 'Sonstige' }
          ]}
        />

        <VfSelect
          label="Objekt"
          value={filters.building || 'all'}
          onChange={(v) => onChange({ ...filters, building: v })}
          options={[
            { value: 'all', label: 'Alle Objekte' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || '-created_date'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: '-created_date', label: 'Neueste' },
            { value: 'created_date', label: 'Älteste' },
            { value: 'name', label: 'Name A-Z' }
          ]}
        />
      </div>
    </div>
  );
}