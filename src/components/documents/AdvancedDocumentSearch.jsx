import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Download, AlertCircle, FileText, BarChart3 } from 'lucide-react';

export default function AdvancedDocumentSearch({ companyId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    document_type: '',
    date_from: '',
    date_to: '',
    tags: [],
    categories: [],
    min_confidence: 0.7
  });
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults = { results: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['document-search', companyId, searchQuery, filters],
    queryFn: async () => {
      if (!searchQuery.trim()) return { results: [], total: 0 };
      
      setIsSearching(true);
      const result = await base44.functions.invoke('advancedDocumentSearch', {
        query: searchQuery,
        company_id: companyId,
        filters
      });
      setIsSearching(false);
      return result;
    },
    enabled: !!searchQuery.trim()
  });

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-2 border-slate-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Dokumente durchsuchen (Inhalt, Name, Tags)..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-12 py-2 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Dokumenttyp</label>
              <Select 
                value={filters.document_type} 
                onValueChange={(value) => setFilters({ ...filters, document_type: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  <SelectItem value="contract">Vertrag</SelectItem>
                  <SelectItem value="invoice">Rechnung</SelectItem>
                  <SelectItem value="receipt">Beleg</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Von Datum</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Bis Datum</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Min. Vertrauenswürdigkeit</label>
              <Select 
                value={String(filters.min_confidence)}
                onValueChange={(value) => setFilters({ ...filters, min_confidence: parseFloat(value) })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Alle</SelectItem>
                  <SelectItem value="0.7">70%+</SelectItem>
                  <SelectItem value="0.8">80%+</SelectItem>
                  <SelectItem value="0.9">90%+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  document_type: '',
                  date_from: '',
                  date_to: '',
                  tags: [],
                  categories: [],
                  min_confidence: 0.7
                })}
                className="w-full"
              >
                Zurücksetzen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        {!searchQuery.trim() ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Geben Sie einen Suchbegriff ein, um zu beginnen</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : searchResults.total === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Keine Dokumente gefunden</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {searchResults.total} Ergebnis{searchResults.total !== 1 ? 'se' : ''} gefunden
              </p>
              <Badge variant="outline" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Relevanz sortiert
              </Badge>
            </div>

            {searchResults.results.map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-slate-900">{doc.name}</h3>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700">
                            {Math.round(doc.relevanceScore)}%
                          </div>
                          <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${doc.relevanceScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-2">
                        Erstellt: {format(new Date(doc.created_date), 'dd. MMM yyyy', { locale: de })}
                      </p>

                      {/* Match indicators */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {doc.matchedFields.includes('name') && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Name</Badge>
                        )}
                        {doc.matchedFields.includes('content') && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Inhalt</Badge>
                        )}
                        {doc.matchedFields.includes('tags') && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Tags</Badge>
                        )}
                        {doc.matchedFields.includes('summary') && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">Zusammenfassung</Badge>
                        )}
                      </div>

                      {/* Analysis info */}
                      {doc.analysis && (
                        <div className="text-xs text-slate-600 space-y-1">
                          {doc.analysis.category && (
                            <p>Kategorie: <span className="font-medium">{doc.analysis.category}</span></p>
                          )}
                          {doc.analysis.confidence_score && (
                            <p>Vertrauen: <span className="font-medium">{Math.round(doc.analysis.confidence_score * 100)}%</span></p>
                          )}
                          {doc.analysis.extracted_data?.summary && (
                            <p className="mt-2 italic text-slate-500">{doc.analysis.extracted_data.summary.substring(0, 100)}...</p>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.url, '_blank')}
                      className="gap-1 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Öffnen</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}