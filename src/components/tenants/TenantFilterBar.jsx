import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function TenantFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Name, E-Mail suchen..."
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
            { value: 'inactive', label: 'Inaktiv' },
            { value: 'former', label: 'Ehemalig' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || 'name'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: 'name', label: 'Name' },
            { value: '-created_date', label: 'Neueste zuerst' },
            { value: 'created_date', label: 'Älteste zuerst' }
          ]}
        />
      </div>
    </div>
  );
}