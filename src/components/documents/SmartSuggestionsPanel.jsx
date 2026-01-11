import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Tag, Workflow, FileText, ArrowRight } from 'lucide-react';

export default function SmartSuggestionsPanel({ documentId, companyId }) {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['smart-suggestions', documentId],
    queryFn: async () => {
      const result = await base44.functions.invoke('documentSmartSuggestions', {
        company_id: companyId,
        document_id: documentId
      });
      return result.data.suggestions;
    }
  });

  if (isLoading) return <div className="text-center py-4">Analysiere...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI-Vorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags */}
        {suggestions?.tags && suggestions.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Empfohlene Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {suggestions.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs cursor-pointer hover:bg-slate-100">
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Workflows */}
        {suggestions?.workflows && suggestions.workflows.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Workflow className="w-3 h-3" />
              Passende Workflows
            </p>
            <div className="space-y-1">
              {suggestions.workflows.map(wf => (
                <Button key={wf} variant="outline" size="sm" className="w-full justify-start text-xs">
                  {wf}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Next Actions */}
        {suggestions?.next_actions && suggestions.next_actions.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Nächste Schritte
            </p>
            <div className="space-y-1">
              {suggestions.next_actions.map((action, i) => (
                <p key={i} className="text-xs text-slate-700 flex items-start gap-1">
                  <span>•</span>
                  <span>{action}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}