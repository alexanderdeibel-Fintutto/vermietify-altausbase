import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkShareActions({ shares, documentTitle, onClose, onSuccess }) {
  const [selectedShares, setSelectedShares] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: async (shareIds) => {
      const response = await base44.functions.invoke('bulkRevokeShares', {
        share_ids: Array.from(shareIds)
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`${result.revoked} Freigaben widerrufen`);
      onSuccess();
    },
    onError: (error) => {
      toast.error('Fehler beim Widerrufen der Freigaben');
    }
  });

  const toggleShare = (shareId) => {
    const newSelected = new Set(selectedShares);
    if (newSelected.has(shareId)) {
      newSelected.delete(shareId);
    } else {
      newSelected.add(shareId);
    }
    setSelectedShares(newSelected);
  };

  const toggleAll = () => {
    if (selectedShares.size === shares.length) {
      setSelectedShares(new Set());
    } else {
      setSelectedShares(new Set(shares.map(s => s.id)));
    }
  };

  const handleRevoke = () => {
    revokeMutation.mutate(selectedShares);
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">Freigaben verwalten</h3>
        <p className="text-sm text-gray-600">"{documentTitle}"</p>
      </div>

      {selectedShares.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">{selectedShares.size} ausgewählt</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={revokeMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Entfernen
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b mb-2">
          <input
            type="checkbox"
            checked={selectedShares.size === shares.length && shares.length > 0}
            onChange={toggleAll}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Alle auswählen</span>
        </div>

        {shares.map(share => (
          <div key={share.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={selectedShares.has(share.id)}
              onChange={() => toggleShare(share.id)}
              className="w-4 h-4"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{share.shared_with_email}</p>
              <p className="text-xs text-gray-500">
                {new Date(share.created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {share.access_level}
            </Badge>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {selectedShares.size} Freigaben widerrufen?
              </p>
              <p className="text-xs text-red-700 mt-1">
                Diese Nutzer können danach nicht mehr auf das Dokument zugreifen.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={revokeMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? 'Wird entfernt...' : 'Entfernen'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={revokeMutation.isPending}
        >
          Schließen
        </Button>
      </div>
    </div>
  );
}