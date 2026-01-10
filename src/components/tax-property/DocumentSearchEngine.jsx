import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, FileText, Download } from 'lucide-react';

export default function DocumentSearchEngine() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allDocs = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 200)
  });

  const filteredDocs = allDocs.filter(doc => 
    searchTerm.length > 0 && (
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ai_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ai_category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Dokumentensuche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Dokumente durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Keine Dokumente gefunden</p>
            ) : (
              filteredDocs.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <p className="font-semibold text-sm">{doc.name}</p>
                      </div>
                      {doc.ai_summary && (
                        <p className="text-xs text-slate-600 mb-1">{doc.ai_summary}</p>
                      )}
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                        {doc.ai_category && <Badge className="text-xs bg-purple-600">{doc.ai_category}</Badge>}
                      </div>
                    </div>
                    {doc.file_url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}