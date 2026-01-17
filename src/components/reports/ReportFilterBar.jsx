import React from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import DateRangeSelector from '@/components/shared/DateRangeSelector';
import { Search } from 'lucide-react';

export default function ReportFilterBar({ 
  searchTerm,
  onSearchChange,
  dateRange,
  onDateChange,
  reportType,
  onTypeChange 
}) {
  return (
    <div className="vf-card p-4 space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <VfInput
          leftIcon={Search}
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        
        <VfSelect
          label="Berichtstyp"
          value={reportType}
          onChange={onTypeChange}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'financial', label: 'Finanzen' },
            { value: 'property', label: 'Objekte' },
            { value: 'tenant', label: 'Mieter' },
            { value: 'tax', label: 'Steuern' }
          ]}
        />
      </div>

      <DateRangeSelector
        startDate={dateRange?.start}
        endDate={dateRange?.end}
        onStartChange={(d) => onDateChange({ ...dateRange, start: d })}
        onEndChange={(d) => onDateChange({ ...dateRange, end: d })}
      />
    </div>
  );
}