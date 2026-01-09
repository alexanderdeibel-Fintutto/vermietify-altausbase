import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Archive, Lock, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentArchivePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const queryClient = useQueryClient();

  const { data: archivedDocs = [] } = useQuery({
    queryKey: ['archivedDocuments'],
    queryFn: async () => {
      const docs = await base44.entities.Document.list('-archived_at', 200);
      return docs.filter(d => d.is_archived);
    }
  });

  const filteredDocs = archivedDocs.filter(doc =>
    doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Archivierte Dokumente durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Archiviert: {new Date(doc.archived_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                {doc.is_immutable && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Lock className="w-3 h-3 mr-1" />
                    Revisionssicher
                  </Badge>
                )}
              </div>

              {doc.ai_summary && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">{doc.ai_summary}</p>
              )}

              {doc.ai_tags && doc.ai_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {doc.ai_tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              {doc.retention_until && (
                <p className="text-xs text-slate-500">
                  Aufbewahrung bis: {new Date(doc.retention_until).toLocaleDateString('de-DE')}
                </p>
              )}

              {doc.archive_reason && (
                <p className="text-xs text-slate-500 mt-1">Grund: {doc.archive_reason}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine archivierten Dokumente gefunden
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ArchiveDocumentDialog({ documentId, onClose }) {
  const [reason, setReason] = useState('');
  const [makeImmutable, setMakeImmutable] = useState(false);
  const [retentionYears, setRetentionYears] = useState(10);
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('archiveDocument', {
        document_id: documentId,
        reason,
        make_immutable: makeImmutable,
        retention_years: retentionYears
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['archivedDocuments'] });
      toast.success('Dokument erfolgreich archiviert');
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Dokument archivieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Archivierungsgrund</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional: Grund für die Archivierung"
              rows={3}
            />
          </div>

          <div>
            <Label>Aufbewahrungsfrist (Jahre)</Label>
            <Input
              type="number"
              value={retentionYears}
              onChange={(e) => setRetentionYears(Number(e.target.value))}
              min="1"
              max="30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={makeImmutable} onCheckedChange={setMakeImmutable} />
            <Label>
              Revisionssicher archivieren
              <p className="text-xs text-slate-600 font-normal">
                Dokument wird unveränderbar und mit Hash gesichert
              </p>
            </Label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending} className="flex-1">
              <Archive className="w-4 h-4 mr-2" />
              Archivieren
            </Button>
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}