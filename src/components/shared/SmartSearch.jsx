import React, { useState } from 'react';
import { VfInput } from './VfInput';
import { Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SearchResults from '@/components/search/SearchResults';
import { useDebounce } from '@/components/hooks/useDebounce';

export default function SmartSearch({ placeholder = 'Suchen...' }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const searchMutation = useMutation({
    mutationFn: (q) => base44.functions.invoke('globalSearch', { query: q }),
    onSuccess: () => setShowResults(true)
  });

  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchMutation.mutate(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <VfInput
        leftIcon={Search}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      {showResults && searchMutation.data?.data?.results?.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--theme-border)] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <SearchResults results={searchMutation.data.data.results} />
        </div>
      )}
    </div>
  );
}