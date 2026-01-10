import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, X, Trash2 } from 'lucide-react';

export default function ConditionBuilder({ stepId, onConditionChange }) {
  const [conditionType, setConditionType] = useState('if_then');
  const [rules, setRules] = useState([]);
  const [defaultNextStep, setDefaultNextStep] = useState('');
  const [newRule, setNewRule] = useState({
    field: '',
    operator: 'equals',
    value: '',
    nextStepId: ''
  });

  const addRule = () => {
    if (newRule.field && newRule.nextStepId) {
      const updated = [...rules, newRule];
      setRules(updated);
      setNewRule({ field: '', operator: 'equals', value: '', nextStepId: '' });
      onConditionChange?.({
        condition_type: conditionType,
        logic: {
          rules: updated,
          default_next_step_id: defaultNextStep
        }
      });
    }
  };

  const removeRule = (index) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    onConditionChange?.({
      condition_type: conditionType,
      logic: {
        rules: updated,
        default_next_step_id: defaultNextStep
      }
    });
  };

  const handleDefaultStepChange = (value) => {
    setDefaultNextStep(value);
    onConditionChange?.({
      condition_type: conditionType,
      logic: {
        rules,
        default_next_step_id: value
      }
    });
  };

  const OPERATORS = [
    { value: 'equals', label: '= gleich' },
    { value: 'not_equals', label: '≠ nicht gleich' },
    { value: 'contains', label: 'enthält' },
    { value: 'not_contains', label: 'enthält nicht' },
    { value: 'greater_than', label: '> größer' },
    { value: 'less_than', label: '< kleiner' },
    { value: 'greater_or_equal', label: '≥ größer/gleich' },
    { value: 'less_or_equal', label: '≤ kleiner/gleich' },
    { value: 'is_empty', label: 'ist leer' },
    { value: 'is_not_empty', label: 'ist nicht leer' },
    { value: 'matches_regex', label: 'Regex' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Bedingte Logik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition Type */}
        <div>
          <label className="text-sm font-medium">Typ</label>
          <Select value={conditionType} onValueChange={setConditionType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="if_then">Wenn-Dann</SelectItem>
              <SelectItem value="switch">Switch/Case</SelectItem>
              <SelectItem value="loop">Schleife</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rules */}
        <div className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium">Regeln</p>

          {rules.length > 0 && (
            <div className="space-y-2 bg-slate-50 p-3 rounded">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-start justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <p className="text-xs font-mono">
                      <span className="font-medium">{rule.field}</span>
                      <span className="text-slate-600 mx-1">
                        {OPERATORS.find(o => o.value === rule.operator)?.label}
                      </span>
                      <span className="font-medium">{rule.value}</span>
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      → {rule.nextStepId}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRule(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Rule */}
          <div className="space-y-2 p-3 border rounded bg-blue-50">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Feldname"
                value={newRule.field}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                className="text-sm"
              />
              <Select
                value={newRule.operator}
                onValueChange={(v) => setNewRule({ ...newRule, operator: v })}
              >
                <SelectTrigger className="text-sm">
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
                placeholder="Wert"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nächster Schritt (ID)"
                value={newRule.nextStepId}
                onChange={(e) => setNewRule({ ...newRule, nextStepId: e.target.value })}
                className="text-sm flex-1"
              />
              <Button size="sm" onClick={addRule}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Default Next Step */}
        <div className="pt-2 border-t">
          <label className="text-sm font-medium">Standard Nächster Schritt (keine Regel passt)</label>
          <Input
            placeholder="Schritt ID"
            value={defaultNextStep}
            onChange={(e) => handleDefaultStepChange(e.target.value)}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}