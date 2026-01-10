import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, FileText } from 'lucide-react';

export default function FullTextSearch() {
  const [query, setQuery] = useState('');

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return [];
      const response = await base44.functions.invoke('fullTextSearch', { query });
      return response.data.results;
    },
    enabled: query.length > 2
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Volltext-Suche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Dokumente durchsuchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.map(result => (
          <div key={result.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{result.title}</p>
                <p className="text-xs text-slate-600">{result.excerpt}...</p>
                <Badge variant="outline" className="mt-1 text-xs">{result.type}</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}