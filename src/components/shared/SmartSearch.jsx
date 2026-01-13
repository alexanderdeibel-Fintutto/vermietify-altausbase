import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartSearch({ 
  onSearch,
  placeholder = 'Suchen...',
  storageKey = 'search-history'
}) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, [storageKey]);

  const handleSearch = (value) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      addToHistory(query);
      handleSearch(query);
    }
  };

  const addToHistory = (q) => {
    const updated = [q, ...history.filter(h => h !== q)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const removeFromHistory = (item) => {
    const updated = history.filter(h => h !== item);
    setHistory(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return (
    <div className="relative flex-1">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            className="pl-10 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearch?.('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search History */}
      {showHistory && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10"
        >
          <div className="p-2">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
                <button
                  onClick={() => removeFromHistory(item)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}