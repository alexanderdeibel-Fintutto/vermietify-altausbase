import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartLinking({ 
  availableItems = [],
  linkedItems = [],
  onLink,
  onUnlink,
  searchFields = ['name', 'label'],
  placeholder = 'Verlinken...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    
    const term = searchTerm.toLowerCase();
    return availableItems
      .filter(item => 
        !linkedItems.find(l => l.id === item.id) &&
        searchFields.some(field => 
          String(item[field] || '').toLowerCase().includes(term)
        )
      )
      .slice(0, 5);
  }, [searchTerm, availableItems, linkedItems, searchFields]);

  const handleLink = (item) => {
    onLink?.(item);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10"
        />
        <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10"
          >
            {suggestions.map(item => (
              <button
                key={item.id}
                onClick={() => handleLink(item)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b last:border-b-0"
              >
                {item.name || item.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {linkedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Verlinkt ({linkedItems.length})</p>
          <div className="flex flex-wrap gap-2">
            {linkedItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                <span>{item.name || item.label}</span>
                <button
                  onClick={() => onUnlink?.(item.id)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}