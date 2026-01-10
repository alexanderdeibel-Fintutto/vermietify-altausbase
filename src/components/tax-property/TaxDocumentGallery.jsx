import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TaxDocumentGallery() {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['taxDocuments'],
    queryFn: () => base44.entities.Document.filter(
      { category: { $in: ['Finanzen', 'Verwaltung'] } },
      '-created_date',
      50
    )
  });

  const imageDocs = documents.filter(d => d.file_type === 'image');
  const pdfDocs = documents.filter(d => d.file_type === 'pdf');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Dokumenten-Galerie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-blue-900">Fotos</p>
              <p className="text-2xl font-bold text-blue-900">{imageDocs.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-purple-900">PDFs</p>
              <p className="text-2xl font-bold text-purple-900">{pdfDocs.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {documents.slice(0, 9).map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="aspect-square relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 transition-all"
              >
                {doc.file_type === 'image' ? (
                  <img src={doc.file_url} alt={doc.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                  <p className="text-xs text-white truncate">{doc.name}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDoc?.file_type === 'image' ? (
              <img src={selectedDoc.file_url} alt={selectedDoc.name} className="w-full rounded-lg" />
            ) : (
              <div className="bg-slate-100 p-8 rounded-lg text-center">
                <FileText className="w-16 h-16 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">PDF-Dokument</p>
              </div>
            )}
            {selectedDoc?.ai_summary && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold mb-1">KI-Zusammenfassung:</p>
                <p className="text-sm text-slate-700">{selectedDoc.ai_summary}</p>
              </div>
            )}
            <div className="flex gap-2">
              {selectedDoc?.category && <Badge>{selectedDoc.category}</Badge>}
              {selectedDoc?.ai_category && <Badge className="bg-purple-600">{selectedDoc.ai_category}</Badge>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}