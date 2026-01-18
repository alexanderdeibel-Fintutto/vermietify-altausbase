import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function AdvancedSearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <VfInput
          leftIcon={Search}
          placeholder="Suchen Sie nach Objekten, Mietern, Verträgen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="gradient" onClick={() => onSearch({ query, entityType })}>
          Suchen
        </Button>
      </div>

      {showFilters && (
        <VfSelect
          label="Typ"
          value={entityType}
          onChange={setEntityType}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'buildings', label: 'Objekte' },
            { value: 'tenants', label: 'Mieter' },
            { value: 'contracts', label: 'Verträge' },
            { value: 'invoices', label: 'Rechnungen' }
          ]}
        />
      )}
    </div>
  );
}