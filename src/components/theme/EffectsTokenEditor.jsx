import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const effectsGroups = {
  'Border Radius': ['radius_sm', 'radius_md', 'radius_lg', 'radius_xl'],
  'Schatten': ['shadow_sm', 'shadow_md', 'shadow_lg'],
  'Übergänge': ['transition_fast', 'transition_normal', 'transition_slow'],
};

export default function EffectsTokenEditor({ tokens, onChange }) {
  return (
    <div className="space-y-6 pt-4">
      {Object.entries(effectsGroups).map(([groupName, keys]) => (
        <div key={groupName}>
          <h4 className="font-medium text-sm mb-3 text-slate-600">{groupName}</h4>
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key}>
                <Label className="text-xs">{key.replace(/_/g, ' ')}</Label>
                <Input
                  value={tokens[key] || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="text-xs mt-1"
                  placeholder="z.B. 0.5rem"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}