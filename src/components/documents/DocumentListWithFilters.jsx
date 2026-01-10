import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
import { Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentListWithFilters({ companyId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: async () => {
      const all = await base44.entities.Document.filter({ company_id: companyId });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const allDocTypes = [...new Set(documents.map(d => d.document_type).filter(Boolean))];
  const allTags = [...new Set(documents.flatMap(d => d.tags || []))];

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!doc.name?.toLowerCase().includes(query) &&
            !doc.document_type?.toLowerCase().includes(query) &&
            !(doc.tags || []).some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Apply filters
      if (filters.from_date && new Date(doc.created_date) < new Date(filters.from_date)) {
        return false;
      }
      if (filters.to_date && new Date(doc.created_date) > new Date(filters.to_date)) {
        return false;
      }
      if (filters.document_type && doc.document_type !== filters.document_type) {
        return false;
      }
      if (filters.tags?.length > 0) {
        const docTags = doc.tags || [];
        if (!filters.tags.some(tag => docTags.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [documents, searchQuery, filters]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Dokumente durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        documentTypes={allDocTypes}
        tags={allTags}
      />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumente ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Keine Dokumente gefunden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900">{doc.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{doc.document_type}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                        {doc.tags?.map(tag => (
                          <Badge key={tag} className="text-xs bg-blue-100 text-blue-700">{tag}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(doc.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}