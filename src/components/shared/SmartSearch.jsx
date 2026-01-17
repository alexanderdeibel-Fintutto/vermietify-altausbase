import React, { useState, useEffect } from 'react';
import { VfInput } from './VfInput';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SmartSearch({ 
  entities = ['Building', 'Tenant', 'LeaseContract'],
  onSelect,
  placeholder = 'Suchen...' 
}) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['smart-search', query, entities],
    queryFn: async () => {
      if (query.length < 2) return [];

      const searchTerm = query.toLowerCase();
      const allResults = [];

      for (const entityName of entities) {
        const items = await base44.entities[entityName].list();
        items.forEach(item => {
          const searchableFields = Object.values(item).join(' ').toLowerCase();
          if (searchableFields.includes(searchTerm)) {
            allResults.push({
              entity: entityName,
              item,
              label: item.name || item.title || item.id
            });
          }
        });
      }

      return allResults.slice(0, 10);
    },
    enabled: query.length >= 2
  });

  useEffect(() => {
    setShowResults(query.length >= 2);
  }, [query]);

  return (
    <div className="relative">
      <VfInput
        leftIcon={isLoading ? Loader2 : Search}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--theme-border)] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => {
                onSelect(result);
                setQuery('');
                setShowResults(false);
              }}
              className="px-4 py-3 hover:bg-[var(--theme-surface)] cursor-pointer border-b last:border-b-0"
            >
              <div className="font-medium">{result.label}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">{result.entity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}