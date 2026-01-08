import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeyManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState('read');
  const [createdKey, setCreatedKey] = useState(null);
  const queryClient = useQueryClient();

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.asServiceRole.entities.APIKey.list('-created_date')
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createAPIKey', {
        name: newKeyName,
        scopes: newKeyScopes.split(',').map(s => s.trim())
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(data.key);
      setNewKeyName('');
      toast.success('API-Key erstellt');
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.asServiceRole.entities.APIKey.delete(keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API-Key gelöscht');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert');
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API-Key Verwaltung</h1>
          <p className="text-slate-600">Verwalten Sie API-Zugriffsschlüssel</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer API-Key
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Gesamt Keys", value: apiKeys.length, color: "blue" },
          { label: "Aktive Keys", value: apiKeys.filter(k => k.is_active).length, color: "green" },
          { label: "Verwendungen", value: apiKeys.reduce((sum, k) => sum + (k.usage_count || 0), 0), color: "purple" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color !== 'blue' ? `text-${stat.color}-600` : ''}`}>
                  {stat.value}
                </p>
              </div>
              <Key className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
      {createdKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">API-Key erstellt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-3">
              Kopieren Sie diesen Key jetzt. Er wird nur einmal angezeigt!
            </p>
            <div className="flex items-center gap-2">
              <Input value={createdKey} readOnly className="font-mono" />
              <Button onClick={() => copyToClipboard(createdKey)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="mt-3" onClick={() => setCreatedKey(null)}>
              Verstanden
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showCreateDialog && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
        <Card>
          <CardHeader>
            <CardTitle>Neuen API-Key erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="z.B. Mobile App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Berechtigungen</label>
              <Input
                placeholder="z.B. read, write"
                value={newKeyScopes}
                onChange={(e) => setNewKeyScopes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createKeyMutation.mutate()} disabled={!newKeyName || createKeyMutation.isPending}>
                Erstellen
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>API-Keys ({apiKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{key.name}</div>
                  <div className="text-sm text-slate-600 font-mono">{key.prefix}...</div>
                  <div className="flex gap-2 mt-2">
                    {key.scopes?.map((scope, idx) => (
                      <Badge key={idx} variant="secondary">{scope}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-right">
                    <div className="text-slate-600">Verwendet: {key.usage_count || 0}x</div>
                    {key.last_used_at && (
                      <div className="text-xs text-slate-500">
                        Zuletzt: {new Date(key.last_used_at).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  {key.is_active ? (
                    <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                  ) : (
                    <Badge variant="secondary">Inaktiv</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('API-Key wirklich löschen?')) {
                        deleteKeyMutation.mutate(key.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-center text-slate-600 py-8">Noch keine API-Keys erstellt</p>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}