import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText } from 'lucide-react';

export default function AIDocumentSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiDocumentAnalysis', {
        action: 'search_in_documents',
        search_query: query
      }),
    onSuccess: (response) => setResults(response.data.search_results)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Dokumentensuche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Suche nach Inhalten, Verträgen, Beträgen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMutation.mutate()}
          />
          <Button
            onClick={() => searchMutation.mutate()}
            disabled={!query || searchMutation.isPending}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {results && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600">
              {results.results.length} Ergebnisse gefunden
            </p>
            {results.results
              .sort((a, b) => b.relevance_score - a.relevance_score)
              .map((result, i) => (
                <div key={i} className="p-3 bg-slate-50 border rounded hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <h4 className="font-medium text-sm">{result.document_name}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.relevance_score}% Match
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{result.reason}</p>
                  {result.matching_content && (
                    <p className="text-xs text-slate-500 italic">"{result.matching_content}"</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}