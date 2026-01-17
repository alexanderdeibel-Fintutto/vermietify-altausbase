import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Search } from 'lucide-react';
import { useDebounce } from '@/components/hooks/useDebounce';
import SearchResults from './SearchResults';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdvancedSearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [] } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const response = await base44.functions.invoke('globalSearch', { query: debouncedQuery });
      return response.data.results || [];
    },
    enabled: debouncedQuery.length >= 2
  });

  return (
    <div className="relative">
      <VfInput
        leftIcon={Search}
        placeholder="Suchen Sie nach Objekten, Mietern, Verträgen..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />

      {isFocused && query.length >= 2 && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--theme-border)] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <SearchResults results={results} />
        </div>
      )}
    </div>
  );
}