import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function PersistentQuickFilters({ 
  filters = [],
  onFilterChange,
  storageKey = 'quickFilters'
}) {
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setActiveFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading filters:', e);
      }
    }
  }, [storageKey]);

  const toggleFilter = (filterId) => {
    const updated = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    onFilterChange?.(updated);
  };

  const clearAll = () => {
    setActiveFilters([]);
    localStorage.removeItem(storageKey);
    onFilterChange?.([]);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => toggleFilter(filter.id)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeFilters.includes(filter.id)
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
      
      {activeFilters.length > 0 && (
        <button
          onClick={clearAll}
          className="px-2 py-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
          title="Alle Filter löschen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}