import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import APIKeyFilterBar from '@/components/api/APIKeyFilterBar';
import APIKeyTable from '@/components/api/APIKeyTable';
import QuickStats from '@/components/shared/QuickStats';
import { AlertCircle, Copy } from 'lucide-react';

export default function APIKeyManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const queryClient = useQueryClient();

  const { data: keys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.entities.APIKey?.list?.() || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.APIKey.create(data),
    onSuccess: (newKey) => { 
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(newKey);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.APIKey.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] })
  });

  const toggleMutation = useMutation({
    mutationFn: (key) => base44.entities.APIKey.update(key.id, { is_active: !key.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] })
  });

  const filteredKeys = keys.filter(k => (k.name || '').toLowerCase().includes(search.toLowerCase()));
  const activeCount = keys.filter(k => k.is_active).length;

  const stats = [
    { label: 'Gesamt-Keys', value: keys.length },
    { label: 'Aktiv', value: activeCount },
    { label: 'Inaktiv', value: keys.length - activeCount },
    { label: 'Diese Woche verwendet', value: 0 },
  ];

  const handleCreateKey = () => {
    if (newKeyName.trim()) {
      createMutation.mutate({ name: newKeyName });
      setNewKeyName('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🔑 API Key Management</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre API-Authentifizierungsschlüssel</p>
      </div>

      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          API Keys mit Bedacht behandeln. Niemals in öffentliche Repositories committen!
        </AlertDescription>
      </Alert>

      <QuickStats stats={stats} accentColor="red" />
      <APIKeyFilterBar onSearchChange={setSearch} onNewKey={() => setShowDialog(true)} />
      <APIKeyTable keys={filteredKeys} onDelete={(k) => deleteMutation.mutate(k.id)} onToggle={(k) => toggleMutation.mutate(k)} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer API Key</DialogTitle></DialogHeader>
          {!createdKey ? (
            <div className="space-y-4">
              <Input 
                placeholder="Key Name (z.B. 'Production API')" 
                value={newKeyName} 
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
                <Button onClick={handleCreateKey} className="bg-red-600 hover:bg-red-700">Erstellen</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  API Key erfolgreich erstellt! Speichern Sie ihn an einem sicheren Ort.
                </AlertDescription>
              </Alert>
              <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm break-all flex items-center justify-between gap-2">
                <span className="flex-1">{createdKey.key_value}</span>
                <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(createdKey.key_value)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => { setShowDialog(false); setCreatedKey(null); }} className="w-full bg-red-600 hover:bg-red-700">Fertig</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}