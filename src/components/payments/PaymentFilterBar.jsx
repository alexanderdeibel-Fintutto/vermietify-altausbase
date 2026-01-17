import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function PaymentFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Mieter suchen..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <VfSelect
          label="Status"
          value={filters.status || 'all'}
          onChange={(v) => onChange({ ...filters, status: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'paid', label: 'Bezahlt' },
            { value: 'pending', label: 'Ausstehend' },
            { value: 'overdue', label: 'Überfällig' }
          ]}
        />

        <VfSelect
          label="Zeitraum"
          value={filters.period || 'all'}
          onChange={(v) => onChange({ ...filters, period: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'current_month', label: 'Dieser Monat' },
            { value: 'last_month', label: 'Letzter Monat' },
            { value: 'current_year', label: 'Dieses Jahr' }
          ]}
        />
      </div>
    </div>
  );
}