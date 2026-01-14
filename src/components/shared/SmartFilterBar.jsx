import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Save, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartFilterBar({ 
  filters = [],
  activeFilters = {},
  onFilterChange,
  onSavePreset,
  savedPresets = []
}) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = Object.keys(activeFilters).filter(
    key => activeFilters[key] && activeFilters[key] !== 'all'
  ).length;

  const clearAll = () => {
    const cleared = {};
    filters.forEach(filter => {
      cleared[filter.key] = 'all';
    });
    onFilterChange?.(cleared);
  };

  const loadPreset = (preset) => {
    onFilterChange?.(preset.filters);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Zurücksetzen
          </Button>
        )}

        {savedPresets.length > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {savedPresets.slice(0, 3).map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => loadPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  {filter.label}
                </label>
                <Select
                  value={activeFilters[filter.key] || 'all'}
                  onValueChange={(value) => 
                    onFilterChange?.({ ...activeFilters, [filter.key]: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {onSavePreset && activeCount > 0 && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSavePreset?.(activeFilters)}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Preset speichern
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}