import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/components/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartSearch({ 
  onSearch,
  placeholder = "Suchen...",
  recentSearches = [],
  suggestions = [],
  onRecentClick 
}) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      onSearch?.(debouncedQuery);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      <AnimatePresence>
        {showResults && (query.length === 0 || query.length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="shadow-lg">
              <div className="p-3 space-y-3">
                {/* Recent Searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        Kürzliche Suchen
                      </span>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 5).map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(search);
                            onRecentClick?.(search);
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-sm text-slate-700"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {query.length >= 2 && suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        Vorschläge
                      </span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.slice(0, 5).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(suggestion.text);
                            onRecentClick?.(suggestion.text);
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">{suggestion.text}</span>
                            {suggestion.type && (
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type}
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}