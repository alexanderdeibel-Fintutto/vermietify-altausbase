import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Search } from 'lucide-react';

export default function InvoiceFilterBar({ filters, onChange }) {
  return (
    <div className="vf-card p-4">
      <div className="grid md:grid-cols-4 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Lieferant, Nummer..."
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
          label="Kategorie"
          value={filters.category || 'all'}
          onChange={(v) => onChange({ ...filters, category: v })}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'maintenance', label: 'Instandhaltung' },
            { value: 'utilities', label: 'Nebenkosten' },
            { value: 'insurance', label: 'Versicherung' }
          ]}
        />

        <VfSelect
          label="Sortierung"
          value={filters.sort || '-invoice_date'}
          onChange={(v) => onChange({ ...filters, sort: v })}
          options={[
            { value: '-invoice_date', label: 'Neueste' },
            { value: 'invoice_date', label: 'Älteste' },
            { value: '-amount', label: 'Höchster Betrag' }
          ]}
        />
      </div>
    </div>
  );
}