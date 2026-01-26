import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

const ACCESS_LEVEL_LABELS = {
  view: 'Ansicht',
  download: 'Download',
  edit: 'Bearbeiten'
};

const ACTION_LABELS = {
  shared: 'Geteilt',
  revoked: 'Widerufen',
  updated: 'Aktualisiert'
};

export default function DocumentShareHistory({ documentId, onClose }) {
  const [expandedShare, setExpandedShare] = useState(null);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['document-share-history', documentId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDocumentShareHistory', {
        document_id: documentId
      });
      return response.data || [];
    }
  });

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold">Freigabe-Verlauf</h3>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Lädt...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Kein Verlauf vorhanden</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((entry, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpandedShare(expandedShare === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.shared_with_email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{ACTION_LABELS[entry.action] || entry.action}</Badge>
                  {entry.access_level && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {ACCESS_LEVEL_LABELS[entry.access_level]}
                    </Badge>
                  )}
                </div>
              </div>

              {expandedShare === idx && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  <p>Geteilt von: <strong>{entry.shared_by_email}</strong></p>
                  {entry.expires_at && (
                    <p>Läuft ab: <strong>{new Date(entry.expires_at).toLocaleDateString('de-DE')}</strong></p>
                  )}
                  {entry.revoked_at && (
                    <p>Widerrufen am: <strong>{new Date(entry.revoked_at).toLocaleDateString('de-DE')}</strong></p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}