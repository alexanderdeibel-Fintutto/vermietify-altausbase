import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Filter, X } from 'lucide-react';

export default function AdvancedFilterPanel({ 
  filters = [],
  values = {},
  onChange,
  onClear 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderFilter = (filter) => {
    switch (filter.type) {
      case 'text':
        return (
          <VfInput
            key={filter.key}
            label={filter.label}
            value={values[filter.key] || ''}
            onChange={(e) => onChange({ ...values, [filter.key]: e.target.value })}
            placeholder={filter.placeholder}
          />
        );
      
      case 'select':
        return (
          <VfSelect
            key={filter.key}
            label={filter.label}
            value={values[filter.key] || ''}
            onChange={(v) => onChange({ ...values, [filter.key]: v })}
            options={filter.options}
          />
        );
      
      case 'date':
        return (
          <VfDatePicker
            key={filter.key}
            label={filter.label}
            value={values[filter.key]}
            onChange={(v) => onChange({ ...values, [filter.key]: v })}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Erweiterte Filter {isExpanded ? '▲' : '▼'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>

        {isExpanded && (
          <div className="grid md:grid-cols-3 gap-4">
            {filters.map(renderFilter)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}