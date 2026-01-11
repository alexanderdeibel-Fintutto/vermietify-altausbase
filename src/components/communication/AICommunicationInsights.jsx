import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, MessageSquare } from 'lucide-react';

export default function AICommunicationInsights({ companyId }) {
  const [insights, setInsights] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiCommunicationAnalyzer', {
        action: 'summarize_common_queries',
        company_id: companyId
      }),
    onSuccess: (response) => setInsights(response.data.summary)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Kommunikationsanalyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Anfragen analysieren
        </Button>

        {insights && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900 mb-1">KI-Einblicke</p>
              <p className="text-xs text-blue-700">{insights.insights}</p>
            </div>

            <div>
              <p className="font-medium text-sm mb-3">Häufigste Anfragen</p>
              <div className="space-y-3">
                {insights.common_queries?.map((query, i) => (
                  <div key={i} className="p-3 bg-slate-50 border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <h4 className="font-medium text-sm">{query.category}</h4>
                      </div>
                      <Badge variant="outline">{query.frequency}x</Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-white rounded">
                        <p className="font-medium text-slate-700 mb-1">Beispiel:</p>
                        <p className="text-slate-600 italic">"{query.example_question}"</p>
                      </div>
                      
                      <div className="p-2 bg-green-50 rounded">
                        <p className="font-medium text-green-900 mb-1">Vorgeschlagene Antwort:</p>
                        <p className="text-green-700">{query.suggested_response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}