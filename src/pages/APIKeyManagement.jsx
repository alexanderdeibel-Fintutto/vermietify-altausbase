import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Key, Plus, Copy, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeyManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', scopes: [] });
  const [generatedKey, setGeneratedKey] = useState(null);
  const queryClient = useQueryClient();

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.asServiceRole.entities.APIKey.list('-created_date')
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createAPIKey', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setGeneratedKey(data.key);
      toast.success('API-Key erstellt');
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.asServiceRole.entities.APIKey.update(keyId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API-Key widerrufen');
    }
  });

  const handleCreate = () => {
    if (!newKeyData.name) return;
    createKeyMutation.mutate(newKeyData);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert');
  };

  const availableScopes = [
    { id: 'read:users', label: 'Benutzer lesen' },
    { id: 'write:users', label: 'Benutzer schreiben' },
    { id: 'read:roles', label: 'Rollen lesen' },
    { id: 'write:roles', label: 'Rollen schreiben' },
    { id: 'read:activities', label: 'Aktivitäten lesen' },
    { id: 'admin:all', label: 'Vollzugriff' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API-Key Verwaltung</h1>
          <p className="text-slate-600">Verwalten Sie API-Zugriffsschlüssel</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer API-Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Gesamt Keys</div>
                <div className="text-3xl font-bold text-blue-600">{apiKeys.length}</div>
              </div>
              <Key className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <div className="text-sm text-slate-600">Aktive Keys</div>
              <div className="text-3xl font-bold text-green-600">
                {apiKeys.filter(k => k.is_active).length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <div className="text-sm text-slate-600">Verwendungen</div>
              <div className="text-3xl font-bold text-purple-600">
                {apiKeys.reduce((sum, k) => sum + (k.usage_count || 0), 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API-Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{key.name}</span>
                    {key.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Widerrufen</Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 ml-7">
                    <code className="bg-slate-100 px-2 py-1 rounded">{key.prefix}...</code>
                  </div>
                  <div className="text-xs text-slate-500 ml-7 mt-1">
                    Verwendet: {key.usage_count || 0}x
                    {key.last_used_at && ` • Zuletzt: ${new Date(key.last_used_at).toLocaleDateString('de-DE')}`}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 ml-7">
                    {key.scopes?.map(scope => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                {key.is_active && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeKeyMutation.mutate(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen API-Key erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">Name</Label>
              <Input
                id="keyName"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                placeholder="Produktions-API-Key"
              />
            </div>
            <div>
              <Label>Berechtigungen</Label>
              <div className="space-y-2 mt-2">
                {availableScopes.map(scope => (
                  <label key={scope.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyData.scopes.includes(scope.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyData({
                            ...newKeyData,
                            scopes: [...newKeyData.scopes, scope.id]
                          });
                        } else {
                          setNewKeyData({
                            ...newKeyData,
                            scopes: newKeyData.scopes.filter(s => s !== scope.id)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newKeyData.name || newKeyData.scopes.length === 0}
              className="w-full"
            >
              Key erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Key Dialog */}
      {generatedKey && (
        <Dialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API-Key erstellt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    Kopieren Sie diesen Key jetzt. Er wird nicht erneut angezeigt!
                  </div>
                </div>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg">
                <code className="text-sm break-all">{generatedKey}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(generatedKey)}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                In Zwischenablage kopieren
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}