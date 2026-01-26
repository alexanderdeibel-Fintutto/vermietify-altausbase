import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DocumentDeleteDialog({ document, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-bold">Dokument löschen?</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Das Dokument "{document.title || document.file_name}" wird permanent gelöscht.
          {document.document_shares?.length > 0 && (
            <span className="block mt-2 text-sm">
              Alle {document.document_shares.length} Freigaben werden ebenfalls entfernt.
            </span>
          )}
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Wird gelöscht...' : 'Löschen'}
          </Button>
        </div>
      </div>
    </div>
  );
}