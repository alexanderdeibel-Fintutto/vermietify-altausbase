import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

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
          placeholder="Suche über alle Daten..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{result.title}</p>
                <Badge variant="outline">{result.type}</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">{result.snippet}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}