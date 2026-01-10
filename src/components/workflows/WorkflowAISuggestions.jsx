import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Zap, RefreshCw } from 'lucide-react';

export default function WorkflowAISuggestions({ companyId }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['workflow-suggestions', companyId, refreshKey],
    queryFn: () =>
      base44.functions.invoke('generateWorkflowSuggestions', {
        company_id: companyId,
        limit: 5
      }).then(res => res.data?.suggestions || [])
  });

  const { data: optimizations = [], isLoading: loadingOptimizations } = useQuery({
    queryKey: ['workflow-optimizations', companyId, refreshKey],
    queryFn: () =>
      base44.functions.invoke('analyzeWorkflowBottlenecks', {
        company_id: companyId
      }).then(res => res.data?.optimizations || [])
  });

  return (
    <div className="space-y-4">
      {/* Workflow Suggestions */}
      <Card>
        <CardHeader className="pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              KI-Workflow-Vorschläge
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-600 text-center py-4">Analysiert Muster...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">Keine Vorschläge verfügbar</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-3 border border-yellow-100 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-slate-900">{suggestion.title}</h4>
                    {suggestion.estimated_time_savings && (
                      <Badge variant="secondary" className="text-xs">
                        💾 {suggestion.estimated_time_savings}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{suggestion.description}</p>
                  <p className="text-xs text-slate-600 italic">{suggestion.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Optimizations */}
      <Card>
        <CardHeader className="pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Optimierungsmöglichkeiten
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loadingOptimizations}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingOptimizations ? (
            <p className="text-sm text-slate-600 text-center py-4">Analysiert Engpässe...</p>
          ) : optimizations.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">
              Keine Optimierungen identifiziert
            </p>
          ) : (
            <div className="space-y-3">
              {optimizations.map((opt, idx) => (
                <div key={idx} className="p-3 border border-blue-100 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-slate-900">{opt.title}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        opt.implementation_effort === 'low'
                          ? 'bg-green-100 text-green-700'
                          : opt.implementation_effort === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {opt.implementation_effort}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{opt.description}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Erwartete Verbesserung:</span> {opt.expected_improvement}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}