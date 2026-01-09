import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export default function ThemePreviewPanel({ tokens }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Create a preview with applied tokens
    const previewDiv = document.createElement('div');
    Object.entries(tokens.colors || {}).forEach(([key, value]) => {
      previewDiv.style.setProperty(`--color-${key}`, value);
    });
    Object.entries(tokens.typography || {}).forEach(([key, value]) => {
      previewDiv.style.setProperty(`--font-${key}`, value);
    });
    Object.entries(tokens.spacing || {}).forEach(([key, value]) => {
      previewDiv.style.setProperty(`--spacing-${key}`, value);
    });
    Object.entries(tokens.effects || {}).forEach(([key, value]) => {
      previewDiv.style.setProperty(`--effect-${key}`, value);
    });
    setPreview(previewDiv);
  }, [tokens]);

  return (
    <div className="sticky top-0 space-y-4">
      <h4 className="font-medium text-sm text-slate-600">Live-Vorschau</h4>

      <Card className="p-4 space-y-3">
        {/* Color Palette */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Farben</p>
          <div className="grid grid-cols-3 gap-2">
            {['primary_600', 'success', 'warning', 'error', 'info'].map((color) => (
              <div
                key={color}
                className="h-8 rounded border border-slate-200"
                style={{ backgroundColor: tokens.colors?.[color] || '#f0f0f0' }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Typography Preview */}
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Typographie</p>
          <div
            style={{
              fontFamily: tokens.typography?.font_family_primary || 'sans-serif',
              fontSize: tokens.typography?.font_size_base || '1rem',
              fontWeight: tokens.typography?.font_weight_normal || '400',
            }}
          >
            <p className="text-sm">Sample Text</p>
          </div>
        </div>

        {/* Spacing Preview */}
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Abstände</p>
          <div className="flex gap-1">
            {['spacing_sm', 'spacing_md', 'spacing_lg'].map((spacing) => (
              <div
                key={spacing}
                className="bg-blue-100 rounded"
                style={{ width: tokens.spacing?.[spacing] || '1rem', height: '20px' }}
                title={spacing}
              />
            ))}
          </div>
        </div>

        {/* Effects Preview */}
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Border Radius</p>
          <div className="flex gap-2">
            {['radius_sm', 'radius_md', 'radius_lg'].map((radius) => (
              <div
                key={radius}
                className="w-8 h-8 bg-violet-500"
                style={{ borderRadius: tokens.effects?.[radius] || '4px' }}
                title={radius}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}