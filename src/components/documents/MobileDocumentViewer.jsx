import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Download, Share2, MoreVertical } from 'lucide-react';

export default function MobileDocumentViewer({ documentId }) {
  const [expanded, setExpanded] = useState(false);

  const { data: doc } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.Document.read(documentId);
      return result;
    }
  });

  if (!doc) return <div className="text-center py-8">Lade Dokument...</div>;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{doc.name}</CardTitle>
            <p className="text-xs text-slate-600 mt-1">
              {new Date(doc.created_date).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Button size="icon" variant="ghost" className="shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status & Type */}
        <div className="flex flex-wrap gap-1">
          {doc.document_type && (
            <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
          )}
          {doc.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-hidden">
          <p className="text-sm text-slate-700 line-clamp-5">
            {doc.content?.substring(0, 200)}...
          </p>
        </div>

        {/* Expandable Content */}
        {expanded && (
          <div className="bg-slate-50 rounded-lg p-3 max-h-60 overflow-y-auto">
            <p className="text-sm text-slate-700">{doc.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`w-3 h-3 transition ${expanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8">
            <Share2 className="w-3 h-3 mr-1" />
            Teilen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}