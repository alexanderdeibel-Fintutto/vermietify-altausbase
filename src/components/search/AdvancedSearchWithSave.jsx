import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Save, Trash2, Loader2, Plus, X, Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const OPERATORS = {
  equals: { label: '=', applies: ['text', 'number', 'date'] },
  contains: { label: 'enthält', applies: ['text'] },
  greater: { label: '>', applies: ['number', 'date'] },
  less: { label: '<', applies: ['number', 'date'] },
  between: { label: 'zwischen', applies: ['number', 'date'] }
};

export default function AdvancedSearchWithSave({ open, onOpenChange, entityType, fields, onSearch }) {
  const queryClient = useQueryClient();
  const [conditions, setConditions] = useState([{ field: '', operator: 'equals', value: '' }]);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches', entityType],
    queryFn: () => base44.entities.SavedSearch.filter({ 
      entity: entityType,
      user_email: user?.email 
    }),
    enabled: !!user
  });

  const saveSearchMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Suche gespeichert');
      setShowSaveDialog(false);
      setSaveName('');
    }
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedSearch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Suche gelöscht');
    }
  });

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, key, value) => {
    const newConditions = [...conditions];
    newConditions[index][key] = value;
    setConditions(newConditions);
  };

  const handleSearch = () => {
    const validConditions = conditions.filter(c => c.field && c.value);
    if (validConditions.length === 0) {
      toast.error('Bitte mindestens ein Suchkriterium angeben');
      return;
    }
    onSearch(validConditions);
    onOpenChange(false);
  };

  const handleSaveSearch = () => {
    if (!saveName) {
      toast.error('Bitte Namen eingeben');
      return;
    }

    saveSearchMutation.mutate({
      name: saveName,
      entity: entityType,
      conditions: conditions.filter(c => c.field && c.value),
      user_email: user?.email
    });
  };

  const loadSavedSearch = (search) => {
    setConditions(search.conditions);
    toast.success(`Filter "${search.name}" geladen`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Erweiterte Suche - {entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div>
              <Label className="mb-2 block">Gespeicherte Suchen</Label>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(search => (
                  <div key={search.id} className="flex items-center gap-1 bg-slate-100 rounded-lg pl-3 pr-1 py-1">
                    <button
                      onClick={() => loadSavedSearch(search)}
                      className="text-sm hover:underline"
                    >
                      {search.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteSearchMutation.mutate(search.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Suchbedingungen</Label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="w-4 h-4 mr-2" />
                Bedingung hinzufügen
              </Button>
            </div>

            {conditions.map((condition, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Feld wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATORS).map(([key, op]) => (
                          <SelectItem key={key} value={key}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Wert..."
                    />
                  </div>

                  <div className="col-span-1">
                    {conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <Label className="mb-2 block">Suche speichern</Label>
              <div className="flex gap-2">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="z.B. Unbezahlte Rechnungen 2024"
                />
                <Button onClick={handleSaveSearch} disabled={saveSearchMutation.isPending}>
                  {saveSearchMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Suche speichern
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Suchen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}