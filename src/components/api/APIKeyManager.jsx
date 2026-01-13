import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Key, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function APIKeyManager() {
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const queryClient = useQueryClient();

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.entities.ApiKey?.list?.('-updated_date', 50) || []
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const key = `sk_${Math.random().toString(36).substr(2, 32)}`;
      return base44.entities.ApiKey?.create?.({
        name: newKeyName,
        key: key,
        is_active: true,
        permissions: ['read', 'write']
      });
    },
    onSuccess: () => {
      toast.success('✅ API Key erstellt');
      queryClient.invalidateQueries(['api-keys']);
      setNewKeyName('');
      setShowNewKey(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId) => base44.entities.ApiKey?.delete?.(keyId),
    onSuccess: () => {
      toast.success('✅ API Key gelöscht');
      queryClient.invalidateQueries(['api-keys']);
    }
  });

  const maskKey = (key) => {
    if (!key) return '••••••••';
    return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </span>
          <Button size="sm" onClick={() => setShowNewKey(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neu
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKeys.length === 0 ? (
          <p className="text-sm text-slate-500">Keine API Keys vorhanden</p>
        ) : (
          apiKeys.map(key => (
            <div key={key.id} className="p-3 bg-slate-50 rounded border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-slate-600 font-mono mt-1">{maskKey(key.key)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(key.key);
                      toast.success('In Zwischenablage kopiert');
                    }}
                    className="h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(key.id)}
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={key.is_active ? 'default' : 'secondary'}>
                  {key.is_active ? '✓ Aktiv' : 'Inaktiv'}
                </Badge>
                <span className="text-xs text-slate-500">
                  Erstellt: {new Date(key.created_date).toLocaleDateString('de-DE')}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Create New Key Dialog */}
      <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                placeholder="z.B. External App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewKey(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newKeyName || createMutation.isPending}
              >
                {createMutation.isPending ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}