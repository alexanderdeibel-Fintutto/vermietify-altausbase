import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QuickFilterBar({ 
  onSearch, 
  onFilter, 
  onNew,
  filters = [],
  newButtonText = 'Neu erstellen',
  accentColor = 'purple'
}) {
  const colorMap = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
  };

  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Suchen..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filters.map((filter, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select onValueChange={(value) => onFilter?.(filter.key, value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {onNew && (
        <Button onClick={onNew} className={colorMap[accentColor]}>
          <Plus className="w-4 h-4 mr-2" />
          {newButtonText}
        </Button>
      )}
    </div>
  );
}