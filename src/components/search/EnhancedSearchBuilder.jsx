import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, Save } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EnhancedSearchBuilder({ entityName, onResults, onSave }) {
  const [conditions, setConditions] = useState([]);
  const [saveName, setSaveName] = useState('');

  const operators = [
    { value: 'equals', label: 'Gleich' },
    { value: 'not_equals', label: 'Nicht gleich' },
    { value: 'contains', label: 'Enthält' },
    { value: 'not_contains', label: 'Enthält nicht' },
    { value: 'starts_with', label: 'Beginnt mit' },
    { value: 'ends_with', label: 'Endet mit' },
    { value: 'greater_than', label: 'Größer als' },
    { value: 'less_than', label: 'Kleiner als' },
    { value: 'greater_equal', label: 'Größer oder gleich' },
    { value: 'less_equal', label: 'Kleiner oder gleich' },
    { value: 'is_empty', label: 'Ist leer' },
    { value: 'is_not_empty', label: 'Ist nicht leer' },
    { value: 'in_last_days', label: 'In den letzten X Tagen' },
    { value: 'before_days', label: 'Vor X Tagen' },
    { value: 'in_next_days', label: 'In den nächsten X Tagen' },
    { value: 'between_dates', label: 'Zwischen Daten' }
  ];

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, key, value) => {
    const updated = [...conditions];
    updated[index][key] = value;
    setConditions(updated);
  };

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('enhancedSearch', {
        entity: entityName,
        conditions
      });
      return response.data;
    },
    onSuccess: (data) => {
      onResults?.(data);
      toast.success(`${data.length} Ergebnisse gefunden`);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveEnhancedSearch', {
        name: saveName,
        entity: entityName,
        conditions
      });
    },
    onSuccess: () => {
      toast.success('Suche gespeichert');
      setSaveName('');
      onSave?.();
    }
  });

  const needsValue = (operator) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Erweiterte Suche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Feldname (z.B. name, email, status)"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                />
                
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {needsValue(condition.operator) && (
                  <Input
                    placeholder={
                      condition.operator.includes('days') ? 'Anzahl Tage' : 
                      condition.operator === 'between_dates' ? 'Start-Datum,End-Datum (YYYY-MM-DD)' :
                      'Wert'
                    }
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  />
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addCondition} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Bedingung hinzufügen
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => searchMutation.mutate()}
            disabled={conditions.length === 0 || searchMutation.isPending}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Suchen
          </Button>
        </div>

        {conditions.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-semibold">Suche speichern:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Name der Suche..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!saveName || saveMutation.isPending}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}