import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

export default function AdvancedFilterBar({ filters, onFilterChange, filterConfig }) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length;

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    const resetFilters = {};
    filterConfig.forEach(f => {
      resetFilters[f.key] = '';
    });
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-3">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
      </Button>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-slate-50">
          {filterConfig.map(config => (
            <div key={config.key}>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                {config.label}
              </label>
              {config.type === 'select' ? (
                <Select value={filters[config.key] || ''} onValueChange={(v) => handleFilterChange(config.key, v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={config.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={config.type}
                  value={filters[config.key] || ''}
                  onChange={(e) => handleFilterChange(config.key, e.target.value)}
                  placeholder={config.placeholder}
                  className="h-8 text-xs"
                />
              )}
            </div>
          ))}
          <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <X className="w-3 h-3 mr-1" /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}