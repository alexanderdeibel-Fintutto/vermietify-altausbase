import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Plus, X, Filter } from 'lucide-react';

export default function AdvancedSearchBuilder() {
  const [filters, setFilters] = useState([
    { field: 'name', operator: 'contains', value: '' }
  ]);
  const [results, setResults] = useState([]);

  const addFilter = () => {
    setFilters([...filters, { field: 'name', operator: 'contains', value: '' }]);
  };

  const removeFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx, key, value) => {
    const updated = [...filters];
    updated[idx][key] = value;
    setFilters(updated);
  };

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('advancedSearch', { filters });
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data.results);
    }
  });

  const fields = [
    { value: 'name', label: 'Name' },
    { value: 'city', label: 'Stadt' },
    { value: 'status', label: 'Status' },
    { value: 'amount', label: 'Betrag' },
    { value: 'date', label: 'Datum' }
  ];

  const operators = [
    { value: 'contains', label: 'enthält' },
    { value: 'equals', label: 'ist gleich' },
    { value: 'greater', label: 'größer als' },
    { value: 'less', label: 'kleiner als' },
    { value: 'between', label: 'zwischen' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Advanced Search Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.map((filter, idx) => (
          <div key={idx} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg">
            <Select value={filter.field} onValueChange={(val) => updateFilter(idx, 'field', val)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filter.operator} onValueChange={(val) => updateFilter(idx, 'operator', val)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Wert..."
              value={filter.value}
              onChange={(e) => updateFilter(idx, 'value', e.target.value)}
              className="flex-1"
            />

            {filters.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeFilter(idx)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addFilter} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Filter hinzufügen
          </Button>
          <Button onClick={() => searchMutation.mutate()} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Suchen ({filters.length} Filter)
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-semibold">{results.length} Ergebnisse gefunden</p>
            {results.map((result, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded flex justify-between items-center">
                <span className="text-sm">{result.name}</span>
                <Badge>{result.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}