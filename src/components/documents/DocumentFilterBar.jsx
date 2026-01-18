import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function DocumentFilterBar({ filters, onChange }) {
  return (
    <div className="vf-filter-bar">
      <VfInput
        leftIcon={Search}
        placeholder="Dokumente durchsuchen..."
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="flex-1"
      />

      <VfSelect
        value={filters.type || 'all'}
        onChange={(v) => onChange({ ...filters, type: v })}
        options={[
          { value: 'all', label: 'Alle Typen' },
          { value: 'contract', label: 'Verträge' },
          { value: 'invoice', label: 'Rechnungen' },
          { value: 'certificate', label: 'Bescheinigungen' }
        ]}
      />

      <VfSelect
        value={filters.status || 'all'}
        onChange={(v) => onChange({ ...filters, status: v })}
        options={[
          { value: 'all', label: 'Alle Status' },
          { value: 'draft', label: 'Entwurf' },
          { value: 'final', label: 'Final' }
        ]}
      />
    </div>
  );
}