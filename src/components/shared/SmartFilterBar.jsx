import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SmartFilterBar({ 
  filters = [],
  onFilterChange,
  onClear,
  searchPlaceholder = 'Filtern...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filterId, value) => {
    const updated = { ...activeFilters, [filterId]: value };
    setActiveFilters(updated);
    onFilterChange?.(updated);
  };

  const handleClear = () => {
    setActiveFilters({});
    setSearchTerm('');
    onClear?.();
  };

  const activeCount = Object.values(activeFilters).filter(v => v).length;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <Filter className="w-4 h-4 text-slate-500" />
      
      <Input
        type="text"
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8 text-sm flex-1 min-w-[150px]"
      />

      {filters.map(filter => (
        <DropdownMenu key={filter.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              {filter.label}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {filter.options.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={activeFilters[filter.id] === option.value}
                onCheckedChange={() => 
                  handleFilterChange(filter.id, option.value)
                }
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {activeCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-600">
            {activeCount} Filter aktiv
          </span>
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}