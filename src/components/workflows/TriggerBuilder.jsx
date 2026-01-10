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
import { Zap, Plus, X } from 'lucide-react';

const TRIGGER_TYPES = {
  email_received: {
    label: 'E-Mail erhalten',
    icon: '📧',
    fields: [
      { name: 'from', label: 'Von (E-Mail)', type: 'text' },
      { name: 'subject', label: 'Betreff (enthält)', type: 'text' }
    ]
  },
  google_drive_change: {
    label: 'Google Drive Änderung',
    icon: '📁',
    fields: [
      { name: 'folder_id', label: 'Ordner ID', type: 'text', required: true },
      { name: 'event_type', label: 'Ereignistyp', type: 'select', options: ['file_created', 'file_modified', 'file_deleted'] }
    ]
  },
  salesforce_record_update: {
    label: 'Salesforce Record Update',
    icon: '☁️',
    fields: [
      { name: 'sobject_type', label: 'Object Typ', type: 'text', required: true },
      { name: 'field', label: 'Feld', type: 'text' }
    ]
  },
  webhook: {
    label: 'Webhook',
    icon: '🔗',
    fields: []
  }
};

export default function TriggerBuilder({ onTriggerChange }) {
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState({});
  const [conditions, setConditions] = useState([]);
  const [newCondition, setNewCondition] = useState({ field: '', operator: 'equals', value: '' });

  const config = TRIGGER_TYPES[triggerType];

  const handleConfigChange = (field, value) => {
    const updated = { ...triggerConfig, [field]: value };
    setTriggerConfig(updated);
    onTriggerChange?.({
      trigger_type: triggerType,
      config: updated,
      conditions
    });
  };

  const addCondition = () => {
    if (newCondition.field && newCondition.operator && newCondition.value) {
      const updated = [...conditions, newCondition];
      setConditions(updated);
      setNewCondition({ field: '', operator: 'equals', value: '' });
      onTriggerChange?.({
        trigger_type: triggerType,
        config: triggerConfig,
        conditions: updated
      });
    }
  };

  const removeCondition = (index) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onTriggerChange?.({
      trigger_type: triggerType,
      config: triggerConfig,
      conditions: updated
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Workflow-Trigger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trigger Type */}
        <div>
          <label className="text-sm font-medium">Trigger-Typ</label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Trigger auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_TYPES).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.icon} {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trigger Config */}
        {config && (
          <div className="space-y-3">
            {config.fields.map(field => (
              <div key={field.name}>
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'text' && (
                  <Input
                    value={triggerConfig[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="mt-1"
                    placeholder={field.label}
                  />
                )}
                {field.type === 'select' && (
                  <Select
                    value={triggerConfig[field.name] || ''}
                    onValueChange={(v) => handleConfigChange(field.name, v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Conditions */}
        {triggerType && (
          <div className="pt-4 border-t space-y-3">
            <p className="text-sm font-medium">Zusätzliche Bedingungen (optional)</p>

            {conditions.length > 0 && (
              <div className="space-y-2">
                {conditions.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <span className="text-xs flex-1">
                      <strong>{cond.field}</strong> {cond.operator} <strong>{cond.value}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCondition(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Feld"
                value={newCondition.field}
                onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
                className="text-sm"
              />
              <Select
                value={newCondition.operator}
                onValueChange={(v) => setNewCondition({ ...newCondition, operator: v })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">gleich</SelectItem>
                  <SelectItem value="contains">enthält</SelectItem>
                  <SelectItem value="greater_than">&gt;</SelectItem>
                  <SelectItem value="less_than">&lt;</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Wert"
                value={newCondition.value}
                onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={addCondition}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}