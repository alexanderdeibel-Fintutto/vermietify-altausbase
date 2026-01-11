import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DESIGN_PRESETS = [
  {
    id: 'modern',
    name: 'Modern',
    primaryColor: '#1e40af',
    accentColor: '#ec4899',
    font: '"Inter", sans-serif',
    spacing: 'medium',
    borderRadius: '0.5rem'
  },
  {
    id: 'classic',
    name: 'Klassisch',
    primaryColor: '#1e293b',
    accentColor: '#dc2626',
    font: '"Georgia", serif',
    spacing: 'large',
    borderRadius: '0rem'
  },
  {
    id: 'minimal',
    name: 'Minimalistisch',
    primaryColor: '#000000',
    accentColor: '#6b7280',
    font: '"Helvetica", sans-serif',
    spacing: 'small',
    borderRadius: '0.25rem'
  },
  {
    id: 'corporate',
    name: 'Business',
    primaryColor: '#0c4a6e',
    accentColor: '#16a34a',
    font: '"Arial", sans-serif',
    spacing: 'medium',
    borderRadius: '0.375rem'
  },
  {
    id: 'creative',
    name: 'Kreativ',
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    font: '"Verdana", sans-serif',
    spacing: 'large',
    borderRadius: '1rem'
  }
];

export default function TemplateDesignPanel({ design, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...design, [field]: value });
  };

  const applyPreset = (preset) => {
    onChange({
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      font: preset.font,
      spacing: preset.spacing,
      borderRadius: preset.borderRadius
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Design-Vorlagen</Label>
        <div className="grid grid-cols-2 gap-3">
          {DESIGN_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-lg border-2 hover:border-blue-500 transition text-left"
              style={{
                borderColor: design.primaryColor === preset.primaryColor ? '#3b82f6' : '#e2e8f0'
              }}
            >
              <p className="font-medium text-sm">{preset.name}</p>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <div className="text-xs text-slate-500">{preset.spacing}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Primärfarbe</Label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={design.primaryColor || '#1e293b'}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <Input
            value={design.primaryColor || '#1e293b'}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            placeholder="#000000"
            className="text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Akzentfarbe</Label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={design.accentColor || '#ec4899'}
            onChange={(e) => handleChange('accentColor', e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <Input
            value={design.accentColor || '#ec4899'}
            onChange={(e) => handleChange('accentColor', e.target.value)}
            placeholder="#ec4899"
            className="text-xs"
          />
        </div>
      </div>

      {/* Font */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Schriftart</Label>
        <Select value={design.font || 'Arial'} onValueChange={(v) => handleChange('font', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='"Arial", sans-serif'>Arial (Modern)</SelectItem>
            <SelectItem value='"Georgia", serif'>Georgia (Klassisch)</SelectItem>
            <SelectItem value='"Helvetica", sans-serif'>Helvetica (Neutral)</SelectItem>
            <SelectItem value='"Times New Roman", serif'>Times New Roman (Formal)</SelectItem>
            <SelectItem value='"Courier New", monospace'>Courier New (Technisch)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spacing */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Abstände</Label>
        <Select value={design.spacing || 'medium'} onValueChange={(v) => handleChange('spacing', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Eng</SelectItem>
            <SelectItem value="medium">Normal</SelectItem>
            <SelectItem value="large">Locker</SelectItem>
            <SelectItem value="xlarge">Sehr locker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border Radius */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Eckenradius</Label>
        <Select value={design.borderRadius || '0.5rem'} onValueChange={(v) => handleChange('borderRadius', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0rem">Scharf (rechteckig)</SelectItem>
            <SelectItem value="0.25rem">Sehr gering</SelectItem>
            <SelectItem value="0.5rem">Normal</SelectItem>
            <SelectItem value="1rem">Gerundet</SelectItem>
            <SelectItem value="9999px">Vollständig gerundet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg bg-slate-100 border">
        <p className="text-xs text-slate-600 mb-3 font-medium">Vorschau</p>
        <div
          style={{
            fontFamily: design.font,
            color: design.primaryColor
          }}
        >
          <p className="text-lg font-bold mb-2">Überschrift</p>
          <p className="text-sm mb-3">Das ist ein Beispieltext mit den aktuellen Designeinstellungen.</p>
          <button
            className="px-4 py-2 text-white rounded text-sm font-medium"
            style={{
              backgroundColor: design.primaryColor,
              borderRadius: design.borderRadius
            }}
          >
            Button
          </button>
        </div>
      </div>
    </div>
  );
}