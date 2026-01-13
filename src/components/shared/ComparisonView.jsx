import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComparisonView({
  items = [],
  fields = [],
  labels = [],
}) {
  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <Card key={idx} className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{field.label || field}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {items.map((item, itemIdx) => {
                const value = typeof field === 'string' 
                  ? item[field] 
                  : item[field.key];
                
                const hasChanged = items.length > 1 && itemIdx > 0 && 
                  value !== (typeof items[0] === 'object' && items[0][typeof field === 'string' ? field : field.key]);
                
                return (
                  <div
                    key={itemIdx}
                    className={`p-2 rounded text-sm ${
                      hasChanged
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-slate-50'
                    }`}
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      {labels[itemIdx] || `Item ${itemIdx + 1}`}
                    </p>
                    <p className="font-medium text-slate-900">
                      {value || '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}