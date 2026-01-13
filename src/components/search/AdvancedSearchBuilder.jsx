import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const FILTER_FIELDS = {
  Invoice: ['status', 'amount', 'date', 'tenant'],
  Contract: ['status', 'start_date', 'end_date', 'tenant'],
  Building: ['city', 'status', 'units', 'owner'],
  Task: ['status', 'priority', 'assigned_to', 'due_date']
};

const OPERATORS = {
  text: ['contains', 'equals', 'starts_with', 'ends_with'],
  number: ['equals', 'greater_than', 'less_than', 'between'],
  date: ['equals', 'before', 'after', 'between'],
  select: ['equals', 'in']
};

export default function AdvancedSearchBuilder({ open, onOpenChange, entityType = 'Invoice' }) {
  const [filters, setFilters] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [saveSearch, setSaveSearch] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => base44.entities.SavedSearch?.list?.() || []
  });

  const addFilterMutation = useMutation({
    mutationFn: async (query) => {
      const response = await base44.functions.invoke('advancedSearch', {
        entityType: entityType,
        filters: query
      });
      return response.data;
    },
    onSuccess: (results) => {
      toast.success(`✅ ${results.length} Ergebnisse gefunden`);
    }
  });

  const saveSearchMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SavedSearch.create({
        name: searchName,
        entity_type: entityType,
        filters: filters,
        created_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      toast.success('💾 Suche gespeichert');
      queryClient.invalidateQueries(['saved-searches']);
      setSaveSearch(false);
      setSearchName('');
    }
  });

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: '', value: '' }]);
  };

  const handleRemoveFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const handleUpdateFilter = (idx, key, value) => {
    const updated = [...filters];
    updated[idx][key] = value;
    setFilters(updated);
  };

  const handleSearch = () => {
    addFilterMutation.mutate(filters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Erweiterte Suche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter Builder */}
          <div className="space-y-3">
            {filters.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Filter hinzugefügt</p>
            ) : (
              filters.map((filter, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Select value={filter.field} onValueChange={(val) => handleUpdateFilter(idx, 'field', val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Feld" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_FIELDS[entityType]?.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filter.operator} onValueChange={(val) => handleUpdateFilter(idx, 'operator', val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Operator" />
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

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFilter(idx)}
                  >
                    ✕
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddFilter}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Filter hinzufügen
          </Button>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Gespeicherte Suchen:</p>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(search => (
                  <Badge
                    key={search.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => setFilters(search.filters)}
                  >
                    {search.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            {filters.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSaveSearch(!saveSearch)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </Button>
            )}
            <Button
              onClick={handleSearch}
              disabled={filters.length === 0 || addFilterMutation.isPending}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Suchen
            </Button>
          </div>

          {/* Save Search Dialog */}
          {saveSearch && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
              <Input
                placeholder="Name für diese Suche"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setSaveSearch(false)}
                  variant="outline"
                >
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveSearchMutation.mutate()}
                  disabled={!searchName || saveSearchMutation.isPending}
                >
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}