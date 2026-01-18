import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AdvancedSearchBar from '@/components/search/AdvancedSearchBar';
import SearchResults from '@/components/search/SearchResults';
import SavedSearches from '@/components/search/SavedSearches';

export default function AdvancedSearch() {
  const [results, setResults] = useState([]);

  const handleSearch = (params) => {
    console.log('Searching:', params);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Erweiterte Suche"
        subtitle="Durchsuchen Sie alle Ihre Daten"
      />

      <div className="mb-6">
        <AdvancedSearchBar onSearch={handleSearch} />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          {results.length > 0 ? (
            <SearchResults results={results} />
          ) : (
            <div className="vf-empty-state">
              <div className="vf-empty-state-icon">🔍</div>
              <div className="vf-empty-state-title">Keine Ergebnisse</div>
              <div className="vf-empty-state-description">
                Starten Sie eine Suche, um Ergebnisse zu sehen
              </div>
            </div>
          )}
        </div>

        <SavedSearches />
      </div>
    </div>
  );
}