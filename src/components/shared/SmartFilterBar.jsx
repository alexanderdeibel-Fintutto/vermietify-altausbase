import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Save, Bookmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SmartFilterBar({ 
  onFilterChange, 
  filters = {}, 
  filterOptions = [],
  entityName = 'Item'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(filters);
  const [saveOpen, setSaveOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const queryClient = useQueryClient();

  const { data: savedFilters = [] } = useQuery({
    queryKey: ['saved-filters', entityName],
    queryFn: () => base44.entities.SavedSearch.filter({ 
      entity_type: entityName 
    })
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create({
      entity_type: entityName,
      filter_name: filterName,
      filter_config: activeFilters,
      is_favorite: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-filters']);
      toast.success('Filter gespeichert');
      setSaveOpen(false);
      setFilterName('');
    }
  });

  const toggleFilter = (filterKey, value) => {
    const updated = { ...activeFilters };
    if (updated[filterKey] === value) {
      delete updated[filterKey];
    } else {
      updated[filterKey] = value;
    }
    setActiveFilters(updated);
    onFilterChange(updated);
  };

  const applySearchFilter = (query) => {
    setSearchQuery(query);
    if (query) {
      onFilterChange({ ...activeFilters, search: query });
    } else {
      const { search, ...rest } = activeFilters;
      onFilterChange(rest);
    }
  };

  const applySavedFilter = (savedFilter) => {
    setActiveFilters(savedFilter.filter_config);
    onFilterChange(savedFilter.filter_config);
    toast.success(`Filter "${savedFilter.filter_name}" angewendet`);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="space-y-3">
      {/* Search & Quick Actions */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Schnellsuche..."
            value={searchQuery}
            onChange={(e) => applySearchFilter(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => applySearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSaveOpen(true)}
          disabled={activeFilterCount === 0}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Speichern
        </Button>

        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Löschen
          </Button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={`${option.key}-${option.value}`}
            variant={activeFilters[option.key] === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFilter(option.key, option.value)}
            className="gap-2"
          >
            {option.label}
            {activeFilters[option.key] === option.value && (
              <X className="w-3 h-3" />
            )}
          </Button>
        ))}
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {savedFilters.slice(0, 5).map((saved) => (
            <Badge
              key={saved.id}
              variant="outline"
              className="cursor-pointer hover:bg-slate-100"
              onClick={() => applySavedFilter(saved)}
            >
              <Bookmark className="w-3 h-3 mr-1" />
              {saved.filter_name}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1 text-xs text-slate-600">
          <span className="font-medium">Aktive Filter ({activeFilterCount}):</span>
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="text-xs">
              {key}: {value}
            </Badge>
          ))}
        </div>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter speichern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="z.B. 'Offene Rechnungen 2024'"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSaveOpen(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!filterName || saveMutation.isPending}
                className="flex-1"
              >
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}