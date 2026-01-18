import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function BuildingFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Name, Adresse suchen..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <VfSelect
          label="Typ"
          value={filters.type || 'all'}
          onChange={(v) => onChange({ ...filters, type: v })}
          options={[
            { value: 'all', label: 'Alle Typen' },
            { value: 'wohnung', label: 'Wohnung' },
            { value: 'haus', label: 'Haus' },
            { value: 'gewerbe', label: 'Gewerbe' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || 'name'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: 'name', label: 'Name' },
            { value: '-created_date', label: 'Neueste' },
            { value: 'address', label: 'Adresse' }
          ]}
        />
      </div>
    </div>
  );
}