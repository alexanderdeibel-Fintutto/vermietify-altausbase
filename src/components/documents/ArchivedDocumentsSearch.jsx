import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Download, RotateCcw, Archive } from 'lucide-react';

const reasonLabels = {
  manual: 'Manuell',
  expired: 'Abgelaufen',
  replaced: 'Ersetzt',
  completed: 'Abgeschlossen',
  other: 'Sonstig'
};

export default function ArchivedDocumentsSearch({ companyId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: archives = [], isLoading } = useQuery({
    queryKey: ['archived-documents', companyId],
    queryFn: async () => {
      const allArchives = await base44.entities.DocumentArchive.filter({
        company_id: companyId,
        restored: false
      });
      return allArchives.sort((a, b) => new Date(b.archived_date) - new Date(a.archived_date));
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (archiveId) => base44.functions.invoke('restoreDocument', { archive_id: archiveId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-documents', companyId] });
    }
  });

  const filteredArchives = useMemo(() => {
    if (!searchTerm) return archives;
    const term = searchTerm.toLowerCase();
    return archives.filter(a =>
      a.document_name.toLowerCase().includes(term) ||
      a.archive_notes?.toLowerCase().includes(term) ||
      a.tags?.some(t => t.toLowerCase().includes(term))
    );
  }, [archives, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Dokumente, Notizen oder Tags durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredArchives.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <Archive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {searchTerm ? 'Keine Dokumente gefunden' : 'Keine archivierten Dokumente'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredArchives.map(archive => (
            <Card key={archive.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{archive.document_name}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Archiviert am {format(new Date(archive.archived_date), 'dd. MMM yyyy', { locale: de })}
                      {' '}von {archive.archived_by}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className="bg-slate-100 text-slate-700 text-xs">
                        {reasonLabels[archive.archive_reason]}
                      </Badge>
                      {archive.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {archive.archive_notes && (
                      <p className="text-xs text-slate-600 mt-2 italic">{archive.archive_notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(archive.document_url, '_blank')}
                      className="gap-1"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => restoreMutation.mutate(archive.id)}
                      disabled={restoreMutation.isPending}
                      className="gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden sm:inline">Restore</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}