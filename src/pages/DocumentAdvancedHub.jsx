import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedDocumentSearch from '@/components/documents/AdvancedDocumentSearch';
import DocumentVersionViewer from '@/components/documents/DocumentVersionViewer';
import DocumentSharingMatrix from '@/components/documents/DocumentSharingMatrix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileUp, Eye, Share2, Zap } from 'lucide-react';

export default function DocumentAdvancedHub() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkDocIds, setBulkDocIds] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Erweiterte Dokumentenverwaltung</h1>
        <p className="text-slate-600 mt-1">
          Suche, Versionierung, Sharing, E-Signature & Webhooks
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">Suche</TabsTrigger>
          <TabsTrigger value="versions">Versionen</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Advanced Search */}
        <TabsContent value="search" className="space-y-4">
          <AdvancedDocumentSearch companyId={companyId} />
        </TabsContent>

        {/* Version Control */}
        <TabsContent value="versions">
          {selectedDoc ? (
            <DocumentVersionViewer documentId={selectedDoc} />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-slate-600">Wähle ein Dokument zum Anzeigen der Versionshistorie</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sharing */}
        <TabsContent value="sharing">
          {selectedDoc ? (
            <DocumentSharingMatrix documentId={selectedDoc} />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-slate-600">Wähle ein Dokument zum Verwalten von Berechtigungen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bulk Operations */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk-Operationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Aktion</label>
                <select
                  value={bulkActionType}
                  onChange={(e) => setBulkActionType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded text-sm"
                >
                  <option value="">-- Wähle eine Aktion --</option>
                  <option value="add_tags">Tags hinzufügen</option>
                  <option value="change_type">Typ ändern</option>
                  <option value="archive">Archivieren</option>
                  <option value="share">Teilen</option>
                </select>
              </div>

              {bulkActionType && (
                <div>
                  <label className="text-sm font-medium">
                    {bulkActionType === 'add_tags' && 'Tags (kommagetrennt)'}
                    {bulkActionType === 'change_type' && 'Neuer Dokumenttyp'}
                    {bulkActionType === 'share' && 'E-Mails (kommagetrennt)'}
                  </label>
                  <Input
                    placeholder="Eingabe..."
                    className="mt-1 text-sm"
                  />
                </div>
              )}

              <Button className="w-full gap-2" disabled={!bulkActionType}>
                <Zap className="w-4 h-4" />
                Ausführen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhooks konfigurieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Webhook URL"
                className="text-sm"
              />
              <div className="space-y-2">
                {['document.created', 'document.updated', 'document.shared'].map(event => (
                  <label key={event} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
              <Button className="w-full">Registrieren</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}