import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, ArchiveX } from 'lucide-react';
import ArchivedDocumentsSearch from '@/components/documents/ArchivedDocumentsSearch';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function DocumentArchiveManager() {
  const { companyId } = useParams();

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-8 h-8" />
            Dokumentarchiv
          </h1>
          <p className="text-slate-600 mt-1">Verwalten und wiederherstellen archivierter Dokumente</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="archived" className="w-full">
          <TabsList>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archivierte Dokumente
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <ArchiveX className="w-4 h-4" />
              Informationen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="archived" className="space-y-4">
            <ArchivedDocumentsSearch companyId={companyId} />
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Über das Dokumentarchiv</h3>
              <ul className="text-sm text-blue-900 space-y-2">
                <li>✓ Archivierte Dokumente bleiben gespeichert und durchsuchbar</li>
                <li>✓ Alle Archivierungsaktionen werden im Audit Trail protokolliert</li>
                <li>✓ Sie können Dokumente jederzeit wiederherstellen</li>
                <li>✓ Archivierung ist reversibel und hinterlässt keine Daten</li>
                <li>✓ Slack-Benachrichtigungen bei Archive/Restore-Aktionen</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Best Practices</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Verwenden Sie aussagekräftige Gründe und Notizen</li>
                <li>• Fügen Sie Such-Tags hinzu (z.B. Jahr, Abteilung, Status)</li>
                <li>• Downloaden Sie Kopien vor der Archivierung</li>
                <li>• Überprüfen Sie regelmäßig archivierte Dokumente</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}