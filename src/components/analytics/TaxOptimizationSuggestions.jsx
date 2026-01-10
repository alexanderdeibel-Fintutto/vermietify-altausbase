import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lightbulb, TrendingDown } from 'lucide-react';

export default function TaxOptimizationSuggestions() {
  const { data: suggestions = [] } = useQuery({
    queryKey: ['taxOptimization'],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxOptimizationSuggestions', {});
      return response.data.suggestions;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Steuer-Optimierungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-5 h-5 text-green-600 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{suggestion.title}</p>
                <p className="text-xs text-slate-600 mt-1">{suggestion.description}</p>
                <Badge className="mt-2 bg-green-600">
                  Sparpotenzial: {suggestion.potential_savings}€
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}