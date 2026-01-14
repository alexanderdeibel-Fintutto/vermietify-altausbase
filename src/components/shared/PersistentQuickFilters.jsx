import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentQuickFilters({ 
  entityType, 
  filters = [], 
  activeFilters = {}, 
  onFilterChange 
}) {
  const [savedFilters, setSavedFilters] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`${entityType}_quick_filters`) || '[]');
      setSavedFilters(saved);
    } catch {
      setSavedFilters([]);
    }
  }, [entityType]);

  const saveCurrentFilters = () => {
    const filterName = prompt('Name für diesen Filter:');
    if (!filterName) return;

    const newFilter = {
      name: filterName,
      filters: activeFilters,
      timestamp: new Date().toISOString()
    };

    const updated = [...savedFilters, newFilter].slice(-5); // Keep last 5
    setSavedFilters(updated);
    localStorage.setItem(`${entityType}_quick_filters`, JSON.stringify(updated));
  };

  const removeFilter = (index) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);
    localStorage.setItem(`${entityType}_quick_filters`, JSON.stringify(updated));
  };

  return (
    <div className="space-y-3">
      {/* Active Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <AnimatePresence>
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === 'all') return null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge className="bg-blue-100 text-blue-800 gap-1 pr-1">
                  {key}: {value}
                  <button
                    onClick={() => onFilterChange({ ...activeFilters, [key]: null })}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {Object.keys(activeFilters).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({})}
            className="h-6 text-xs"
          >
            Alle löschen
          </Button>
        )}
      </div>

      {/* Saved Quick Filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Gespeicherte Filter:</span>
          {savedFilters.map((saved, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="cursor-pointer hover:bg-slate-100 gap-2"
              onClick={() => onFilterChange(saved.filters)}
            >
              {saved.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFilter(idx);
                }}
                className="hover:bg-slate-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {Object.keys(activeFilters).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={saveCurrentFilters}
          className="h-7 text-xs"
        >
          💾 Filter speichern
        </Button>
      )}
    </div>
  );
}