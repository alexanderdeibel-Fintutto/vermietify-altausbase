import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SHADOW_PRESETS = [
  { id: 'none', label: 'Keine', value: 'none' },
  { id: 'sm', label: 'Klein', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  { id: 'md', label: 'Mittel', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  { id: 'lg', label: 'Groß', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  { id: 'xl', label: 'Sehr groß', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
];

export default function EffectsPanel({ effects, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...effects, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Shadow */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Schatten</Label>
        <Select value={effects.shadow || 'none'} onValueChange={(v) => handleChange('shadow', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHADOW_PRESETS.map(preset => (
              <SelectItem key={preset.id} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Border */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Rahmen Dicke (px)</Label>
        <Input
          type="number"
          min="0"
          max="10"
          value={effects.borderWidth || 0}
          onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
          className="h-8 text-xs"
        />
      </div>

      {effects.borderWidth > 0 && (
        <div>
          <Label className="text-xs font-medium mb-2 block">Rahmen Farbe</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={effects.borderColor || '#000000'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
              className="h-8 w-12 rounded cursor-pointer"
            />
            <input
              type="text"
              value={effects.borderColor || '#000000'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
              className="h-8 text-xs flex-1 px-2 border rounded"
            />
          </div>
        </div>
      )}

      {/* Border Radius */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Eckenradius (px)</Label>
        <Input
          type="number"
          min="0"
          max="50"
          value={effects.borderRadius || 0}
          onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
          className="h-8 text-xs"
        />
      </div>

      {/* Opacity */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Transparenz: {Math.round((effects.opacity || 1) * 100)}%</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={effects.opacity || 1}
          onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Gradient */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Gradient aktivieren</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={effects.gradient?.enabled || false}
            onChange={(e) => handleChange('gradient', { ...effects.gradient, enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-xs">Farbverlauf verwenden</span>
        </label>
      </div>

      {effects.gradient?.enabled && (
        <>
          <div>
            <Label className="text-xs font-medium mb-2 block">Gradient Richtung</Label>
            <Select value={effects.gradient?.direction || 'to-right'} onValueChange={(v) => handleChange('gradient', { ...effects.gradient, direction: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to-right">Nach rechts</SelectItem>
                <SelectItem value="to-bottom">Nach unten</SelectItem>
                <SelectItem value="to-bottom-right">Diagonal</SelectItem>
                <SelectItem value="45deg">45 Grad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">Start-Farbe</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effects.gradient?.startColor || '#ffffff'}
                onChange={(e) => handleChange('gradient', { ...effects.gradient, startColor: e.target.value })}
                className="h-8 w-12 rounded cursor-pointer"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">End-Farbe</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effects.gradient?.endColor || '#000000'}
                onChange={(e) => handleChange('gradient', { ...effects.gradient, endColor: e.target.value })}
                className="h-8 w-12 rounded cursor-pointer"
              />
            </div>
          </div>
        </>
      )}

      {/* Preview */}
      <div className="p-3 rounded-lg bg-slate-50 border-2 border-slate-200 mt-4">
        <p className="text-xs text-slate-600 mb-2 font-medium">Vorschau Effekte</p>
        <div
          className="p-4 text-center text-sm font-medium"
          style={{
            shadow: effects.shadow === 'none' ? 'none' : effects.shadow,
            boxShadow: effects.shadow === 'none' ? 'none' : effects.shadow,
            border: effects.borderWidth ? `${effects.borderWidth}px solid ${effects.borderColor || '#000000'}` : 'none',
            borderRadius: `${effects.borderRadius || 0}px`,
            opacity: effects.opacity || 1,
            background: effects.gradient?.enabled 
              ? `linear-gradient(${effects.gradient.direction}, ${effects.gradient.startColor}, ${effects.gradient.endColor})`
              : '#ffffff'
          }}
        >
          Effekt Preview
        </div>
      </div>
    </div>
  );
}