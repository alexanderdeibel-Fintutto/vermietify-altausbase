import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Copy } from 'lucide-react';

const FIELD_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Zahl' },
  { id: 'date', label: 'Datum' },
  { id: 'currency', label: 'Währung' },
  { id: 'textarea', label: 'Mehrzeiliger Text' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Telefon' },
  { id: 'entity_select', label: 'Entity Auswahl' }
];

export default function TemplateFieldManager({ fields = [], onChange, documentType }) {
  const [newField, setNewField] = useState({ name: '', type: 'text', entity_type: '', required: false });

  const addField = () => {
    if (!newField.name.trim()) return;
    const updatedFields = [...fields, { ...newField, id: `field_${Date.now()}` }];
    onChange(updatedFields);
    setNewField({ name: '', type: 'text', entity_type: '', required: false });
  };

  const removeField = (id) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id, updates) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Dokumentfelder</h3>

      {/* Existierende Felder */}
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id} className="flex gap-2 p-3 bg-slate-50 rounded-lg items-center">
            <div className="flex-1 space-y-1">
              <div className="font-medium text-sm">{field.name}</div>
              <div className="text-xs text-slate-600">{`{{${field.name}}}`}</div>
            </div>
            <div className="text-xs bg-white px-2 py-1 rounded border">{field.type}</div>
            {field.required && <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Pflichtfeld</div>}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(`{{${field.name}}}`);
              }}
              className="h-8 w-8"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeField(field.id)}
              className="h-8 w-8 text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Neues Feld hinzufügen */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium text-sm">Neues Feld hinzufügen</h4>
        <div className="space-y-2">
          <div>
            <Label>Feldname</Label>
            <Input
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="z.B. tenant_first_name"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label>Feldtyp</Label>
            <Select value={newField.type} onValueChange={(val) => setNewField({ ...newField, type: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(ft => (
                  <SelectItem key={ft.id} value={ft.id}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {newField.type === 'entity_select' && (
            <div>
              <Label>Entity-Typ</Label>
              <Input
                value={newField.entity_type}
                onChange={(e) => setNewField({ ...newField, entity_type: e.target.value })}
                placeholder="z.B. Tenant"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
            />
            <span className="text-sm">Pflichtfeld</span>
          </label>
        </div>
        <Button onClick={addField} className="w-full gap-2">
          <Plus className="w-4 h-4" /> Feld hinzufügen
        </Button>
      </div>
    </div>
  );
}