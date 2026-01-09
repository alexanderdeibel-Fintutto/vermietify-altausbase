import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const typographyGroups = {
  'Schriftfamilie': ['font_family_primary'],
  'Schriftgrößen': ['font_size_xs', 'font_size_sm', 'font_size_base', 'font_size_lg', 'font_size_xl'],
  'Schriftgewichte': ['font_weight_extralight', 'font_weight_light', 'font_weight_normal', 'font_weight_medium', 'font_weight_semibold', 'font_weight_bold'],
};

export default function TypographyTokenEditor({ tokens, onChange }) {
  return (
    <div className="space-y-6 pt-4">
      {Object.entries(typographyGroups).map(([groupName, keys]) => (
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
                  placeholder="z.B. 1rem oder 600"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}