import React from 'react';
import { VfDatePicker } from './VfDatePicker';
import { Button } from '@/components/ui/button';

export default function DateRangeSelector({ 
  startDate, 
  endDate,
  onStartChange,
  onEndChange,
  presets = true
}) {
  const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'today':
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    onStartChange(start);
    onEndChange(end);
  };

  return (
    <div className="space-y-4">
      {presets && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => applyPreset('today')}>Heute</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset('week')}>7 Tage</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset('month')}>30 Tage</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset('quarter')}>90 Tage</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset('year')}>1 Jahr</Button>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <VfDatePicker
          label="Von"
          value={startDate}
          onChange={onStartChange}
        />
        <VfDatePicker
          label="Bis"
          value={endDate}
          onChange={onEndChange}
        />
      </div>
    </div>
  );
}