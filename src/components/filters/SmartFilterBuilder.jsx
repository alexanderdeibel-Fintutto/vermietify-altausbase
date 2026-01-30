import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const OPERATORS = [
  { value: 'equals', label: 'ist gleich' },
  { value: 'contains', label: 'enthält' },
  { value: 'gt', label: 'größer als' },
  { value: 'lt', label: 'kleiner als' },
  { value: 'between', label: 'zwischen' }
];

export default function SmartFilterBuilder({ fields = [], onChange, initialFilters = [] }) {
  const [filters, setFilters] = useState(initialFilters);

  const addFilter = () => {
    const newFilter = { field: '', operator: 'equals', value: '', id: Date.now() };
    const updated = [...filters, newFilter];
    setFilters(updated);
    onChange(updated);
  };

  const removeFilter = (id) => {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    onChange(updated);
  };

  const updateFilter = (id, key, value) => {
    const updated = filters.map(f => f.id === id ? { ...f, [key]: value } : f);
    setFilters(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {filters.map((filter, idx) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 items-center"
          >
            <Select
              value={filter.field}
              onValueChange={(val) => updateFilter(filter.id, 'field', val)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Feld" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.operator}
              onValueChange={(val) => updateFilter(filter.id, 'operator', val)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={filter.value}
              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
              placeholder="Wert"
              className="flex-1"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter(filter.id)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        variant="outline"
        size="sm"
        onClick={addFilter}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Filter hinzufügen
      </Button>
    </div>
  );
}