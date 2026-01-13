import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function MobileOptimizedTable({ 
  data = [],
  fields = [],
  onItemClick,
  rowKey = 'id'
}) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <Card
          key={item[rowKey] || idx}
          onClick={() => onItemClick?.(item)}
          className={`p-3 ${onItemClick ? 'cursor-pointer hover:shadow-md' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {fields.map(field => (
                <div key={field.key} className="mb-2 last:mb-0">
                  <p className="text-xs text-slate-600 font-medium">{field.label}</p>
                  <p className="text-sm text-slate-900 font-semibold truncate">
                    {field.format 
                      ? field.format(item[field.key], item)
                      : item[field.key]
                    }
                  </p>
                </div>
              ))}
            </div>
            {onItemClick && (
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}