import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickSearch({ placeholder = 'Suchen...' }) {
  const [query, setQuery] = useState('');

  const { data: results = [] } = useQuery({
    queryKey: ['quick-search', query],
    queryFn: async () => {
      if (query.length < 2) return [];

      const [buildings, tenants, contracts] = await Promise.all([
        base44.entities.Building.list(),
        base44.entities.Tenant.list(),
        base44.entities.LeaseContract.list()
      ]);

      const searchTerm = query.toLowerCase();
      const matched = [];

      buildings.forEach(b => {
        if (b.name?.toLowerCase().includes(searchTerm) || b.address?.toLowerCase().includes(searchTerm)) {
          matched.push({ type: 'building', item: b, label: b.name });
        }
      });

      tenants.forEach(t => {
        if (t.name?.toLowerCase().includes(searchTerm) || t.email?.toLowerCase().includes(searchTerm)) {
          matched.push({ type: 'tenant', item: t, label: t.name });
        }
      });

      return matched.slice(0, 5);
    },
    enabled: query.length >= 2
  });

  return (
    <div className="relative">
      <VfInput
        leftIcon={Search}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--theme-border)] rounded-lg shadow-lg z-50">
          {results.map((result, index) => (
            <Link
              key={index}
              to={createPageUrl(result.type === 'building' ? 'BuildingDetail' : 'TenantDetail')}
              onClick={() => setQuery('')}
              className="block px-4 py-3 hover:bg-[var(--theme-surface)] border-b last:border-b-0"
            >
              <div className="font-medium">{result.label}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">{result.type}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}