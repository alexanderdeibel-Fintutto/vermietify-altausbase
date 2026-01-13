import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const SEARCH_FIELDS = {
  Building: ['name', 'address', 'city', 'owner'],
  Invoice: ['title', 'amount', 'status', 'due_date'],
  LeaseContract: ['tenant_name', 'unit', 'status', 'start_date'],
  Tenant: ['name', 'email', 'phone', 'status']
};

const OPERATORS = {
  text: ['enthält', 'ist genau', 'beginnt mit'],
  number: ['=', '>', '<', '>=', '<='],
  date: ['nach', 'vor', 'zwischen']
};

export default function AdvancedSearchBuilder({ open, onOpenChange, onSearch }) {
  const [entityType, setEntityType] = useState('Building');
  const [filters, setFilters] = useState([{ field: '', operator: 'enthält', value: '' }]);
  const [searchName, setSearchName] = useState('');
  const [saveSearch, setSaveSearch] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const validFilters = filters.filter(f => f.field && f.value);
      
      // Build query
      const query = {};
      validFilters.forEach(f => {
        if (f.operator === 'enthält') {
          query[f.field] = { $regex: f.value };
        } else if (f.operator === '=') {
          query[f.field] = f.value;
        } else if (f.operator === '>') {
          query[f.field] = { $gt: f.value };
        }
      });

      return base44.entities[entityType].filter(query, '-updated_date', 50);
    },
    onSuccess: (results) => {
      toast.success(`✅ ${results.length} Ergebnisse gefunden`);
      onSearch?.(results);
      onOpenChange(false);
    }
  });

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: 'enthält', value: '' }]);
  };

  const handleRemoveFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const handleUpdateFilter = (idx, key, value) => {
    const updated = [...filters];
    updated[idx][key] = value;
    setFilters(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Erweiterte Suche</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity Type */}
          <div>
            <label className="text-sm font-medium">Entität</label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(SEARCH_FIELDS).map(et => (
                  <SelectItem key={et} value={et}>{et}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Filter</p>
            {filters.map((filter, idx) => (
              <div key={idx} className="flex gap-2">
                <Select value={filter.field} onValueChange={(v) => handleUpdateFilter(idx, 'field', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Feld" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_FIELDS[entityType]?.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filter.operator} onValueChange={(v) => handleUpdateFilter(idx, 'operator', v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.text?.map(op => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Wert"
                  value={filter.value}
                  onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                  className="flex-1"
                />

                {filters.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFilter(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={handleAddFilter}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Filter hinzufügen
            </Button>
          </div>

          {/* Save Search */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={saveSearch}
                onChange={(e) => setSaveSearch(e.target.checked)}
              />
              Suche speichern
            </label>
            {saveSearch && (
              <Input
                placeholder="Suchname"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => searchMutation.mutate()}
              disabled={!filters.some(f => f.field && f.value) || searchMutation.isPending}
            >
              {searchMutation.isPending ? 'Suche...' : 'Suchen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}