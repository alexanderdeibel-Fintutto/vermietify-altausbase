import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, RefreshCw, BarChart3 } from 'lucide-react';

export default function DocumentInboxSettings() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: imapAccounts = [] } = useQuery({
    queryKey: ['imapAccounts'],
    queryFn: async () => base44.entities.IMAPAccount.list()
  });

  const handleSaveAccountSettings = async (accountId, settings) => {
    setSaving(true);
    await base44.entities.IMAPAccount.update(accountId, settings);
    await queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
    setSaving(false);
  };

  const handleManualSync = async (accountId) => {
    await base44.functions.invoke('processIncomingDocuments', { account_id: accountId });
    await queryClient.invalidateQueries({ queryKey: ['imapAccounts'] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Dokumenten-Eingang Einstellungen</h1>
        <p className="text-slate-500 mt-1">Verwalte automatische E-Mail-Dokumentenerfassung</p>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-Mail-Konten
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        {/* E-Mail-Konten */}
        <TabsContent value="accounts" className="space-y-4">
          {imapAccounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-500">Keine IMAP-Konten konfiguriert</p>
                <Button className="mt-4 gap-2">Konto hinzufügen</Button>
              </CardContent>
            </Card>
          ) : (
            imapAccounts.map(account => (
              <Card key={account.id} className={account.process_for_documents ? 'border-green-300' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{account.email_address}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">{account.imap_server}</p>
                    </div>
                    {account.process_for_documents && (
                      <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Aktivierung */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                    <Checkbox
                      id={`process-${account.id}`}
                      checked={account.process_for_documents || false}
                      onCheckedChange={async (checked) => {
                        await handleSaveAccountSettings(account.id, {
                          process_for_documents: checked
                        });
                      }}
                      disabled={saving}
                    />
                    <label
                      htmlFor={`process-${account.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      Automatische Dokumenten-Erfassung aktiviert
                    </label>
                  </div>

                  {/* Ordner-Auswahl */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Zu überwachender Ordner:</label>
                    <Input
                      value={account.inbox_folder || 'INBOX'}
                      onChange={async (e) => {
                        await handleSaveAccountSettings(account.id, {
                          inbox_folder: e.target.value
                        });
                      }}
                      placeholder="INBOX"
                      disabled={saving}
                    />
                  </div>

                  {/* Dokumenttypen */}
                  <div>
                    <p className="text-sm font-medium mb-2">Zu erkennende Dokumenttypen:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'invoice', label: '🧾 Rechnungen' },
                        { id: 'lease_contract', label: '📋 Mietverträge' },
                        { id: 'handover_protocol', label: '🔑 Übergabeprotokolle' },
                        { id: 'property_tax', label: '🏛️ Grundsteuerbescheide' },
                        { id: 'insurance', label: '🛡️ Versicherungen' }
                      ].map(type => (
                        <div key={type.id} className="flex items-center gap-2">
                          <Checkbox id={`type-${account.id}-${type.id}`} defaultChecked />
                          <label
                            htmlFor={`type-${account.id}-${type.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {type.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistik */}
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <p className="text-slate-600">
                      Zuletzt geprüft: {account.last_document_sync_date 
                        ? new Date(account.last_document_sync_date).toLocaleString('de-DE') 
                        : 'Noch nie'}
                    </p>
                    <p className="text-slate-600">
                      Verarbeitete E-Mails: {account.processed_count || 0}
                    </p>
                  </div>

                  {/* Aktionen */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManualSync(account.id)}
                      className="flex-1 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Jetzt synchronisieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Statistik */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Dokumenten-Erfassungsstatistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-xs text-slate-600">Gesamt erfasst</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {imapAccounts.reduce((sum, acc) => sum + (acc.processed_count || 0), 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-xs text-slate-600">Letzter Lauf</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {imapAccounts.some(acc => acc.last_document_sync_date)
                      ? 'Erfolgreich'
                      : 'Noch nicht ausgeführt'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Konten Status:</p>
                <div className="space-y-1 text-sm">
                  {imapAccounts.map(acc => (
                    <div key={acc.id} className="flex justify-between">
                      <span className="text-slate-600">{acc.email_address}</span>
                      <Badge className={acc.process_for_documents ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                        {acc.process_for_documents ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}