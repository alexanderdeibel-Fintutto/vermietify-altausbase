import React from 'react';
import { Button } from '@/components/ui/button';

const TIME_RANGES = [
  { id: 'today', label: 'Heute' },
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'quarter', label: 'Quartal' },
  { id: 'year', label: 'Jahr' },
  { id: 'custom', label: 'Custom' },
];

export default function TimeRangeSelector({ selected, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TIME_RANGES.map(range => (
        <Button
          key={range.id}
          variant={selected === range.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(range.id)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}