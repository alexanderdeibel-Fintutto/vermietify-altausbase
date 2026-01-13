import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentQuickFilters({
  filters = [],
  onFilterChange,
  storageKey = 'quickFilters',
}) {
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setActiveFilters(parsed);
    }
  }, [storageKey]);

  const toggleFilter = (filterId) => {
    const updated = activeFilters.includes(filterId)
      ? activeFilters.filter((id) => id !== filterId)
      : [...activeFilters, filterId];

    setActiveFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    onFilterChange?.(updated);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {filters.map((filter) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              onClick={() => toggleFilter(filter.id)}
              variant={
                activeFilters.includes(filter.id) ? 'default' : 'outline'
              }
              size="sm"
              className="gap-2"
            >
              {filter.label}
              {activeFilters.includes(filter.id) && (
                <X className="w-3 h-3" />
              )}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}