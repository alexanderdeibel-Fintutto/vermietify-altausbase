import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

export default function DocumentPreviewDialog({ document, open, onClose }) {
  const [zoom, setZoom] = useState(100);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document.name}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm">{zoom}%</span>
              <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => window.open(document.file_url, '_blank')}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 overflow-auto max-h-[70vh]">
          {document.file_type === 'image' ? (
            <img 
              src={document.file_url} 
              alt={document.name} 
              style={{ width: `${zoom}%` }}
              className="mx-auto rounded-lg"
            />
          ) : document.file_type === 'pdf' ? (
            <iframe 
              src={document.file_url} 
              className="w-full h-[600px] rounded-lg border"
            />
          ) : (
            <div className="bg-slate-100 p-12 rounded-lg text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">Vorschau nicht verfügbar</p>
            </div>
          )}

          {document.ai_summary && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">KI-Analyse:</p>
              <p className="text-sm text-slate-700">{document.ai_summary}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge>{document.category}</Badge>
            {document.ai_category && <Badge className="bg-purple-600">{document.ai_category}</Badge>}
            <Badge variant="outline">{document.file_type}</Badge>
            {document.file_size && (
              <Badge variant="outline">{(document.file_size / 1024).toFixed(0)} KB</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}