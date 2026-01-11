import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Loader2 } from 'lucide-react';

export default function DocumentRelationshipGraph({ documentId, companyId }) {
  const { data: relationships = [] } = useQuery({
    queryKey: ['document-relationships', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentRelationship.filter({
        source_document_id: documentId
      });
      return result;
    }
  });

  const detectMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('detectDocumentRelationships', {
        company_id: companyId,
        document_id: documentId
      })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Dokumentbeziehungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="w-full gap-2"
          variant="outline"
          size="sm"
        >
          {detectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Beziehungen erkennen
        </Button>

        {relationships.length > 0 && (
          <div className="space-y-2">
            {relationships.map(rel => (
              <div key={rel.id} className="p-2 border rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{rel.relationship_type}</Badge>
                  <Badge variant="secondary" className="text-xs">
                    {(rel.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-slate-600">→ {rel.target_document_id}</p>
              </div>
            ))}
          </div>
        )}

        {relationships.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">
            Keine Beziehungen gefunden
          </p>
        )}
      </CardContent>
    </Card>
  );
}