import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Filter } from 'lucide-react';

export default function QuickFilterBar({ 
  filters = [],
  onFilterChange,
  searchPlaceholder = "Suchen..."
}) {
  const [activeFilters, setActiveFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterToggle = (filterId) => {
    const updated = {
      ...activeFilters,
      [filterId]: !activeFilters[filterId]
    };
    setActiveFilters(updated);
    onFilterChange({ ...updated, search: searchTerm });
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    onFilterChange({ ...activeFilters, search: value });
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v) || searchTerm;

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-slate-500" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 min-w-32 text-sm"
        />
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveFilters({});
              setSearchTerm('');
              onFilterChange({ search: '' });
            }}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <Button
              key={filter.id}
              size="sm"
              variant={activeFilters[filter.id] ? 'default' : 'outline'}
              onClick={() => handleFilterToggle(filter.id)}
              className="text-xs"
            >
              {filter.icon && <span className="mr-1">{filter.icon}</span>}
              {filter.label}
              {activeFilters[filter.id] && <span className="ml-1">✓</span>}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}