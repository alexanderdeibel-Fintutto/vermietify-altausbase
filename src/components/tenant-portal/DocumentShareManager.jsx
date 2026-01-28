import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { shareDocumentWithTenant } from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, EyeOff, Upload, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentShareManager({ unitId, buildingId }) {
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [file, setFile] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Dokumente laden
  const { data: documents = [] } = useQuery({
    queryKey: ['tenant-portal-documents', unitId],
    queryFn: () => unitId
      ? base44.entities.TenantPortalDocument.filter({ unit_id: unitId })
      : base44.entities.TenantPortalDocument.filter({ building_id: buildingId }),
  });
  
  // Dokument hochladen
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      return base44.entities.TenantPortalDocument.create({
        unit_id: unitId,
        building_id: buildingId,
        document_type: docType,
        title,
        file_url,
        file_size: file.size,
        document_date: new Date().toISOString().split('T')[0],
        is_visible: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-documents'] });
      toast.success('Dokument hochgeladen!');
      setShowUpload(false);
      setTitle('');
      setFile(null);
    }
  });
  
  // Sichtbarkeit togglen
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (doc) => {
      return base44.entities.TenantPortalDocument.update(doc.id, {
        is_visible: !doc.is_visible
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-documents'] });
      toast.success('Sichtbarkeit geändert');
    }
  });
  
  // Dokument löschen
  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.TenantPortalDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-documents'] });
      toast.success('Dokument gelöscht');
    }
  });
  
  const docTypeLabels = {
    operating_costs: 'Nebenkostenabrechnung',
    lease: 'Mietvertrag',
    utility_bills: 'Versorgungsrechnungen',
    maintenance: 'Instandhaltung',
    notice: 'Mitteilung',
    announcement: 'Ankündigung',
    other: 'Sonstiges'
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dokumente für Mieter</h2>
          <p className="text-sm text-gray-600">Dokumente mit Mietern teilen</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
          <Upload className="w-4 h-4" />
          Dokument hochladen
        </Button>
      </div>
      
      {/* Upload Form */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Neues Dokument hochladen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Dokumenttyp</label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Titel</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Nebenkostenabrechnung 2024"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Datei</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!title || !file || uploadMutation.isPending}
                  className="flex-1"
                >
                  {uploadMutation.isPending ? 'Lädt hoch...' : 'Hochladen'}
                </Button>
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Dokumente Liste */}
      <div className="grid gap-4">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold">{doc.title}</h4>
                      <p className="text-sm text-gray-600">{docTypeLabels[doc.document_type]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.is_visible ? 'default' : 'secondary'}>
                        {doc.is_visible ? 'Sichtbar' : 'Versteckt'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.document_date || doc.created_date).toLocaleDateString('de-DE')}
                    </span>
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      Öffnen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibilityMutation.mutate(doc)}
                      disabled={toggleVisibilityMutation.isPending}
                      className="gap-2"
                    >
                      {doc.is_visible ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Verstecken
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Anzeigen
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Dokument wirklich löschen?')) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {documents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Noch keine Dokumente freigegeben</p>
          </div>
        )}
      </div>
    </div>
  );
}