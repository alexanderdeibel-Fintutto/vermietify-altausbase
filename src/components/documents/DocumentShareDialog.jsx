import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const ACCESS_LEVELS = {
  view: 'Nur ansehen',
  download: 'Ansehen + Download',
  edit: 'Bearbeiten'
};

export default function DocumentShareDialog({ document, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const queryClient = useQueryClient();

  // Load users in org
  const { data: orgUsers = [] } = useQuery({
    queryKey: ['org-users'],
    queryFn: async () => {
      const response = await base44.functions.invoke('loadOrgUsers', {});
      return response.data || [];
    }
  });

  const shareMutation = useMutation({
    mutationFn: async (shareData) => {
      const response = await base44.functions.invoke('shareDocument', shareData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEmail('');
      setAccessLevel('view');
      onSuccess();
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (shareId) => {
      const response = await base44.functions.invoke('revokeDocumentShare', {
        share_id: shareId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleShare = (e) => {
    e.preventDefault();
    if (!email) return;

    shareMutation.mutate({
      document_id: document.id,
      shared_with_email: email,
      access_level: accessLevel
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{document.title || document.file_name} teilen</h2>

        {/* Current Shares */}
        {document.document_shares?.length > 0 && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-sm font-medium mb-3">Geteilt mit:</h3>
            <div className="space-y-2">
              {document.document_shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div>
                    <p className="text-sm font-medium">{share.shared_with_email}</p>
                    <p className="text-xs text-gray-500">{ACCESS_LEVELS[share.access_level]}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeMutation.mutate(share.id)}
                    disabled={revokeMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teilen mit:</label>
            <Input
              type="email"
              placeholder="E-Mail Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Zugriff:</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {Object.entries(ACCESS_LEVELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={shareMutation.isPending}
            >
              Schließen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!email || shareMutation.isPending}
            >
              {shareMutation.isPending ? 'Wird geteilt...' : 'Teilen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}