import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

export default function DocumentPreviewDialog({ open, onOpenChange, document = null }) {
  if (!document) return null;

  const isPdf = document.file_type === 'pdf' || document.file_url?.endsWith('.pdf');
  const isImage = document.file_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-light">{document.name}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[60vh] bg-slate-100 rounded-lg overflow-hidden">
          {isPdf && (
            <iframe
              src={document.file_url}
              className="w-full h-full border-0"
              title={document.name}
            />
          )}

          {isImage && (
            <img
              src={document.file_url}
              alt={document.name}
              className="w-full h-full object-contain"
            />
          )}

          {!isPdf && !isImage && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-600 font-light mb-4">Vorschau nicht verfügbar</p>
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-light text-sm"
                >
                  Datei öffnen →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200 pt-4">
          <div>
            <p className="text-slate-500 font-light">Typ</p>
            <p className="text-slate-900 font-light capitalize">{document.file_type}</p>
          </div>
          <div>
            <p className="text-slate-500 font-light">Größe</p>
            <p className="text-slate-900 font-light">
              {document.file_size ? (document.file_size / 1024 / 1024).toFixed(2) + ' MB' : '—'}
            </p>
          </div>
          {document.entity_references?.length > 0 && (
            <div className="col-span-2">
              <p className="text-slate-500 font-light mb-1">Verknüpfungen</p>
              <div className="flex flex-wrap gap-1">
                {document.entity_references.map((ref, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {ref.entity_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}