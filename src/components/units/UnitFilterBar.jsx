import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function UnitFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-4 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Einheitsnummer..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <VfSelect
          label="Status"
          value={filters.status || 'all'}
          onChange={(v) => onChange({ ...filters, status: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'occupied', label: 'Vermietet' },
            { value: 'vacant', label: 'Leer' },
            { value: 'maintenance', label: 'In Wartung' }
          ]}
        />

        <VfSelect
          label="Typ"
          value={filters.type || 'all'}
          onChange={(v) => onChange({ ...filters, type: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'apartment', label: 'Wohnung' },
            { value: 'commercial', label: 'Gewerbe' },
            { value: 'parking', label: 'Stellplatz' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || 'unit_number'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: 'unit_number', label: 'Nummer' },
            { value: '-living_area', label: 'Größte zuerst' },
            { value: '-rent_cold', label: 'Höchste Miete' }
          ]}
        />
      </div>
    </div>
  );
}