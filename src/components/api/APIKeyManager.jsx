import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function APIKeyManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showKey, setShowKey] = useState({});
  const queryClient = useQueryClient();

  const { data: keys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.entities.APIKey?.list?.('-updated_date', 100) || []
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const key = 'sk_' + Math.random().toString(36).substr(2, 32);
      const response = await base44.functions.invoke('createAPIKey', {
        name: keyName,
        key: key,
        scopes: 'read,write'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ API Key erstellt');
      queryClient.invalidateQueries(['api-keys']);
      setKeyName('');
      setShowCreateDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.entities.APIKey?.delete?.(keyId);
    },
    onSuccess: () => {
      toast.success('✅ API Key gelöscht');
      queryClient.invalidateQueries(['api-keys']);
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Kopiert');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">API Keys</h3>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Key
        </Button>
      </div>

      {/* Keys List */}
      <div className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-sm text-slate-500">Keine API Keys vorhanden</p>
        ) : (
          keys.map(key => (
            <Card key={key.id}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{key.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                      {showKey[key.id] ? key.key : '••••••••••••••••'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                    >
                      {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(key.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{key.scopes}</Badge>
                    {key.last_used && (
                      <Badge variant="outline" className="text-xs">
                        Zuletzt: {new Date(key.last_used).toLocaleDateString('de-DE')}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(key.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Key-Name (z.B. Mobile App)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!keyName || createMutation.isPending}
              >
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}