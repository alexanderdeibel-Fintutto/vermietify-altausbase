import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdvancedSearchBar from '@/components/search/AdvancedSearchBar';
import AdvancedFilterPanel from '@/components/search/AdvancedFilterPanel';
import SearchResults from '@/components/search/SearchResults';
import { Card } from '@/components/ui/card';

/**
 * Comprehensive advanced search page
 */
export default function AdvancedSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [sortBy, setSortBy] = useState('updated_date');
  const [sortOrder, setSortOrder] = useState(-1);

  const handleSearch = async (searchParams) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('advancedSearchEntities', {
        query: searchParams.query,
        entity_types: searchParams.entity_types,
        filters: currentFilters,
        sort_by: searchParams.sort_by || sortBy,
        sort_order: searchParams.sort_order !== undefined ? searchParams.sort_order : sortOrder,
        limit: 50,
        offset: 0
      });

      setResults(response.data?.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = (filters) => {
    setCurrentFilters(filters);
    // Re-run search with new filters
    const query = document.querySelector('input[placeholder*="Suche"]')?.value || '';
    handleSearch({
      query,
      entity_types: ['buildings', 'tenants', 'contracts', 'documents', 'invoices']
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-slate-900">Erweiterte Suche</h1>
        <p className="text-slate-600 font-light mt-2">
          Durchsuchen Sie alle Ihre Daten - Gebäude, Mieter, Verträge, Dokumente und Rechnungen
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <AdvancedSearchBar
          onSearch={handleSearch}
          onFilterChange={setCurrentFilters}
          loading={loading}
          showFilters={showFilters}
          onFiltersToggle={() => setShowFilters(!showFilters)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(newSort, newOrder) => {
            setSortBy(newSort);
            setSortOrder(newOrder);
          }}
        />
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <AdvancedFilterPanel
          onApplyFilters={handleFilterApply}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Results */}
      {results && (
        <Card className="p-6">
          <SearchResults results={results} loading={loading} />
        </Card>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <p className="text-3xl">🔍</p>
            <p className="text-slate-600 font-light">
              Geben Sie einen Suchbegriff ein, um zu beginnen
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}