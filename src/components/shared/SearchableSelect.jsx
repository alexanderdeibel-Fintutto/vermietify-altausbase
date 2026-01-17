import React, { useState } from 'react';
import { VfInput } from './VfInput';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange,
  placeholder = 'Suchen...',
  label 
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      {label && <div className="vf-label mb-1">{label}</div>}
      
      <div onClick={() => setIsOpen(!isOpen)}>
        <VfInput
          value={selected?.label || ''}
          placeholder={placeholder}
          readOnly
          className="cursor-pointer"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--theme-border)] rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <VfInput
              leftIcon={Search}
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "px-4 py-2 cursor-pointer hover:bg-[var(--theme-surface)] flex items-center justify-between",
                  value === option.value && "bg-[var(--vf-primary-50)]"
                )}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-[var(--vf-primary-600)]" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}