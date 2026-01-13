import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PersistentQuickFilters({ 
  filters = [], 
  onFiltersChange,
  storageKey = 'quick-filters'
}) {
  const [activeFilters, setActiveFilters] = useState({});
  const [saved, setSaved] = useState(false);

  // Load filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setActiveFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading filters:', e);
      }
    }
  }, [storageKey]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);

  const updateFilter = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setSaved(false);
  };

  const saveFilters = () => {
    localStorage.setItem(storageKey, JSON.stringify(activeFilters));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetFilters = () => {
    setActiveFilters({});
    localStorage.removeItem(storageKey);
  };

  const hasFilters = Object.values(activeFilters).some(v => v);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-slate-700">Schnellfilter</p>
        {hasFilters && (
          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Zurücksetzen
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filters.map(filter => (
          <div key={filter.key} className="flex items-center gap-2">
            {filter.type === 'text' ? (
              <Input
                placeholder={filter.label}
                value={activeFilters[filter.key] || ''}
                onChange={(e) => updateFilter(filter.key, e.target.value)}
                className="h-8 text-xs"
              />
            ) : (
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => updateFilter(filter.key, e.target.value)}
                className="flex h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium"
              >
                <option value="">{filter.label}</option>
                {filter.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {hasFilters && (
        <div className="flex gap-2">
          <Button
            onClick={saveFilters}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1 h-7 text-xs"
          >
            <Save className="w-3 h-3" />
            Speichern
            {saved && <span className="ml-auto">✓</span>}
          </Button>
        </div>
      )}
    </motion.div>
  );
}