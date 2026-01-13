import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { debounce } from 'lodash';

export default function DocumentSearchBar({ onSearch, loading = false }) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      onSearch(searchQuery);
    }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Dokumente durchsuchen..."
          className="pl-9 text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {loading && (
        <div className="flex items-center text-xs text-slate-500">
          Suche...
        </div>
      )}
    </div>
  );
}