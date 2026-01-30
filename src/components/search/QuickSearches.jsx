import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickSearches({ savedSearches = [], recentSearches = [], onSelect }) {
  return (
    <div className="space-y-4">
      {savedSearches.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
            <Star className="w-3 h-3" />
            Gespeicherte Suchen
          </h3>
          <div className="space-y-1">
            {savedSearches.map((search, idx) => (
              <motion.button
                key={search.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelect(search)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-gray-900 dark:text-gray-100">{search.name}</span>
                <span className="text-xs text-gray-500">{search.resultCount} Ergebnisse</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {recentSearches.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Kürzlich
          </h3>
          <div className="space-y-1">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => onSelect({ query: search })}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}