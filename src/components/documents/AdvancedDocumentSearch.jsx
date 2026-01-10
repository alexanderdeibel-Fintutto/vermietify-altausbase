import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Calendar } from 'lucide-react';

export default function AdvancedDocumentSearch({ companyId }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    document_type: '',
    tags: [],
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('advancedDocumentSearch', {
        company_id: companyId,
        query,
        filters,
        limit: 50
      })
  });

  const results = searchMutation.data?.data;

  const handleSearch = (e) => {
    e.preventDefault();
    searchMutation.mutate();
  };

  const toggleTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Dokumente durchsuchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Filter"
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button type="submit" disabled={searchMutation.isPending}>
            Suchen
          </Button>
        </div>
      </form>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Dokumenttyp</label>
              <Input
                value={filters.document_type}
                onChange={(e) => setFilters(prev => ({ ...prev, document_type: e.target.value }))}
                placeholder="z.B. contract, invoice"
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium">Von</label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Bis</label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facets */}
      {results?.facets && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 space-y-3">
            {Object.entries(results.facets.tags || {}).map(([tag, count]) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                <span className="text-sm">{tag}</span>
                <Badge variant="outline" className="ml-auto text-xs">{count}</Badge>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {results.total} Ergebnis{results.total !== 1 ? 'se' : ''} gefunden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.results.map(doc => (
              <div key={doc.id} className="p-2 border rounded hover:bg-slate-50">
                <p className="font-medium text-sm">{doc.name}</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {doc.content?.substring(0, 100)}...
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                  {doc.tags?.map(tag => (
                    <Badge key={tag} className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}