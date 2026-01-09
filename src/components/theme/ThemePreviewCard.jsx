import React from 'react';

export default function ThemePreviewCard({ theme }) {
  const colors = theme.design_tokens?.colors || {};

  return (
    <div className="space-y-3">
      {/* Color Palette */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Farben</p>
        <div className="flex gap-1 flex-wrap">
          {['primary_600', 'success', 'warning', 'error', 'info'].map((colorKey) => (
            <div
              key={colorKey}
              className="w-6 h-6 rounded border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: colors[colorKey] || '#f0f0f0' }}
              title={colorKey}
            />
          ))}
        </div>
      </div>

      {/* Font Preview */}
      <div className="text-xs text-slate-600 space-y-1">
        <p
          style={{
            fontFamily: theme.design_tokens?.typography?.font_family_primary || 'sans-serif',
            fontSize: '12px',
          }}
        >
          AaBbCc 123
        </p>
      </div>
    </div>
  );
}