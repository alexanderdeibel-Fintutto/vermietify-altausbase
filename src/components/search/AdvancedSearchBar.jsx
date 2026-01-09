import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable advanced search bar with quick filters
 */
export default function AdvancedSearchBar({
  onSearch,
  onFilterChange,
  entityTypes = ['buildings', 'tenants', 'contracts', 'documents', 'invoices'],
  loading = false,
  showFilters = false,
  onFiltersToggle,
  sortBy = 'updated_date',
  sortOrder = -1,
  onSortChange
}) {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(new Set(entityTypes));

  const handleSearch = useCallback(() => {
    onSearch({
      query,
      entity_types: Array.from(selectedTypes),
      sort_by: sortBy,
      sort_order: sortOrder
    });
  }, [query, selectedTypes, sortBy, sortOrder, onSearch]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleEntityType = (type) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedTypes(new Set(entityTypes));
  };

  const entityLabels = {
    buildings: '🏢 Gebäude',
    tenants: '👥 Mieter',
    contracts: '📋 Verträge',
    documents: '📄 Dokumente',
    invoices: '💰 Rechnungen'
  };

  const sortOptions = [
    { value: 'updated_date', label: 'Zuletzt aktualisiert' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'date', label: 'Datum' },
    { value: 'amount', label: 'Betrag' }
  ];

  return (
    <div className="space-y-3">
      {/* Sort Options */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-light text-slate-600">Sortierung:</span>
        <div className="flex gap-1">
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSortChange?.(opt.value, sortOrder)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-light transition-colors',
                sortBy === opt.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => onSortChange?.(sortBy, sortOrder === -1 ? 1 : -1)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-light transition-colors',
              'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {sortOrder === -1 ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Suche nach Name, Adresse, E-Mail..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 font-light"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 font-light"
        >
          {loading ? '⏳' : 'Suchen'}
        </Button>
        {onFiltersToggle && (
          <Button
            onClick={onFiltersToggle}
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            className="font-light"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Entity Type Filter */}
      <div className="flex flex-wrap gap-2">
        {entityTypes.map(type => (
          <button
            key={type}
            onClick={() => toggleEntityType(type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-light transition-colors',
              selectedTypes.has(type)
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {entityLabels[type] || type}
          </button>
        ))}
      </div>
    </div>
  );
}