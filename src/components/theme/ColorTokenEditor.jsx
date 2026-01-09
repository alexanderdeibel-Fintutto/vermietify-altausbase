import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const colorGroups = {
  'Primärfarben': ['primary_50', 'primary_100', 'primary_200', 'primary_300', 'primary_400', 'primary_500', 'primary_600', 'primary_700', 'primary_800', 'primary_900'],
  'Semantische Farben': ['success', 'warning', 'error', 'info'],
  'Neutrale Farben': ['background', 'foreground', 'muted', 'muted_foreground', 'border'],
};

export default function ColorTokenEditor({ tokens, onChange }) {
  return (
    <div className="space-y-6 pt-4">
      {Object.entries(colorGroups).map(([groupName, keys]) => (
        <div key={groupName}>
          <h4 className="font-medium text-sm mb-3 text-slate-600">{groupName}</h4>
          <div className="grid grid-cols-2 gap-4">
            {keys.map((key) => (
              <div key={key}>
                <Label className="text-xs">{key.replace(/_/g, ' ')}</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={tokens[key] || '#000000'}
                    onChange={(e) => onChange(key, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={tokens[key] || ''}
                    onChange={(e) => onChange(key, e.target.value)}
                    className="flex-1 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}