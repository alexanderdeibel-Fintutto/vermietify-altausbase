import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SpacingTokenEditor({ tokens, onChange }) {
  const keys = ['spacing_xs', 'spacing_sm', 'spacing_md', 'spacing_lg', 'spacing_xl'];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h4 className="font-medium text-sm mb-3 text-slate-600">Abstände</h4>
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key}>
              <Label className="text-xs">{key.replace(/_/g, ' ')}</Label>
              <Input
                value={tokens[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="text-xs mt-1"
                placeholder="z.B. 1rem"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Visuelle Vorschau */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3 text-slate-600">Vorschau</h4>
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={`preview-${key}`} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">{key.replace(/_/g, ' ')}</span>
              <div
                className="bg-blue-500"
                style={{ width: tokens[key], height: '2rem' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}