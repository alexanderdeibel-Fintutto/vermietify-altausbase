import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, History, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function TenantDocumentsManager({ tenantId }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['tenantDocuments', tenantId],
    queryFn: () => base44.entities.Document.filter({ tenant_id: tenantId }, '-created_at', 50)
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', selectedDoc?.id],
    queryFn: () => base44.entities.DocumentVersion.filter({ document_id: selectedDoc?.id }, '-version_number', 20),
    enabled: !!selectedDoc
  });

  const groupedDocs = documents.reduce((acc, doc) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  const getDocTypeLabel = (type) => {
    const labels = {
      rental_agreement: 'Mietvertrag',
      house_rules: 'Hausordnung',
      welcome_guide: 'Willkommensführer',
      invoice: 'Rechnung',
      other: 'Sonstiges'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-light text-slate-900">Dokumente</h2>
      </div>

      {Object.entries(groupedDocs).map(([type, docs]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-base">{getDocTypeLabel(type)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-slate-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">
                          {new Date(doc.created_at).toLocaleDateString('de-DE')}
                        </span>
                        <Badge className={doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShowVersionHistory(true);
                      }}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Versionsverlauf: {selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-slate-600">Keine Versionen verfügbar</p>
            ) : (
              versions.map(version => (
                <div key={version.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">Version {version.version_number}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(version.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <Badge className={version.is_current ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}>
                      {version.is_current ? 'Aktuell' : 'Archiviert'}
                    </Badge>
                  </div>
                  {version.change_notes && (
                    <p className="text-sm text-slate-700 mt-2">{version.change_notes}</p>
                  )}
                  {version.modified_by && (
                    <p className="text-xs text-slate-500 mt-2">Geändert von: {version.modified_by}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Ansehen
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Herunterladen
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}