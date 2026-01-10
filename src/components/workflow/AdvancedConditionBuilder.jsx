import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

const operatorOptions = {
  text: ['equals', 'contains', 'startsWith', 'endsWith', 'notEquals'],
  number: ['equals', 'greaterThan', 'lessThan', 'between', 'notEquals'],
  date: ['equals', 'before', 'after', 'between', 'inLast', 'inNext'],
  boolean: ['equals'],
  list: ['in', 'notIn', 'contains', 'isEmpty']
};

const operatorLabels = {
  equals: 'Gleich',
  notEquals: 'Ungleich',
  contains: 'Enthält',
  startsWith: 'Beginnt mit',
  endsWith: 'Endet mit',
  greaterThan: 'Größer als',
  lessThan: 'Kleiner als',
  between: 'Zwischen',
  before: 'Vor',
  after: 'Nach',
  inLast: 'In den letzten',
  inNext: 'In den nächsten',
  in: 'In Liste',
  notIn: 'Nicht in Liste',
  isEmpty: 'Ist leer'
};

export default function AdvancedConditionBuilder({ conditions, onChange, entityFields }) {
  const addCondition = () => {
    onChange([...conditions, {
      field: '',
      fieldType: 'text',
      operator: 'equals',
      value: '',
      valueType: 'static'
    }]);
  };

  const updateCondition = (index, updates) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Erweiterte Bedingungen</CardTitle>
          <Button onClick={addCondition} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Bedingung
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">
            Keine Bedingungen definiert
          </p>
        ) : (
          conditions.map((condition, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex gap-2">
                <Select
                  value={condition.field}
                  onValueChange={(field) => {
                    const fieldDef = entityFields.find(f => f.name === field);
                    updateCondition(index, { 
                      field,
                      fieldType: fieldDef?.type || 'text'
                    });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Feld wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityFields.map(field => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(operator) => updateCondition(index, { operator })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions[condition.fieldType]?.map(op => (
                      <SelectItem key={op} value={op}>
                        {operatorLabels[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCondition(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Value Input based on operator */}
              {condition.operator === 'between' ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Von"
                    value={condition.value?.from || ''}
                    onChange={(e) => updateCondition(index, { 
                      value: { ...condition.value, from: e.target.value }
                    })}
                    type={condition.fieldType === 'date' ? 'date' : 'text'}
                  />
                  <Input
                    placeholder="Bis"
                    value={condition.value?.to || ''}
                    onChange={(e) => updateCondition(index, { 
                      value: { ...condition.value, to: e.target.value }
                    })}
                    type={condition.fieldType === 'date' ? 'date' : 'text'}
                  />
                </div>
              ) : condition.operator === 'inLast' || condition.operator === 'inNext' ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Anzahl"
                    type="number"
                    value={condition.value?.count || ''}
                    onChange={(e) => updateCondition(index, { 
                      value: { ...condition.value, count: e.target.value }
                    })}
                  />
                  <Select
                    value={condition.value?.unit || 'days'}
                    onValueChange={(unit) => updateCondition(index, { 
                      value: { ...condition.value, unit }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Tage</SelectItem>
                      <SelectItem value="weeks">Wochen</SelectItem>
                      <SelectItem value="months">Monate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : condition.operator === 'in' || condition.operator === 'notIn' ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Werte (kommagetrennt)"
                    value={Array.isArray(condition.value) ? condition.value.join(', ') : ''}
                    onChange={(e) => updateCondition(index, { 
                      value: e.target.value.split(',').map(v => v.trim())
                    })}
                  />
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(condition.value) && condition.value.map((v, i) => (
                      <Badge key={i} variant="outline">{v}</Badge>
                    ))}
                  </div>
                </div>
              ) : condition.operator !== 'isEmpty' && (
                <Input
                  placeholder="Wert"
                  value={condition.value || ''}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  type={
                    condition.fieldType === 'date' ? 'date' :
                    condition.fieldType === 'number' ? 'number' :
                    'text'
                  }
                />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}