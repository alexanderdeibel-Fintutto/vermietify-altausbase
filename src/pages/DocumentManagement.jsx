import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Share2, Trash2, Download, FileText, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DocumentUploadDialog from '@/components/documents/DocumentUploadDialog';
import DocumentShareDialog from '@/components/documents/DocumentShareDialog';
import DocumentDeleteDialog from '@/components/documents/DocumentDeleteDialog';

const DOCUMENT_TYPES = {
  mietvertrag: 'Mietvertrag',
  nebenkostenabrechnung: 'NK-Abrechnung',
  kuendigung: 'Kündigungsschreiben',
  uebergabeprotokoll: 'Übergabeprotokoll',
  mahnung: 'Mahnschreiben',
  rechnung: 'Rechnung',
  versicherung: 'Versicherungspolice',
  grundriss: 'Grundriss',
  zaehlerstand: 'Zählerstand',
  sonstiges: 'Sonstiges'
};

export default function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const queryClient = useQueryClient();

  // Load buildings
  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('loadBuildingSummary', {});
      return response.data || [];
    }
  });

  // Load documents for selected building
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', selectedBuilding?.id],
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const response = await base44.functions.invoke('loadBuildingDocuments', {
        building_id: selectedBuilding.id
      });
      return response.data || [];
    },
    enabled: !!selectedBuilding
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await base44.functions.invoke('deleteDocument', {
        document_id: documentId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
    }
  });

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (doc) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleShare = (doc) => {
    setSelectedDoc(doc);
    setShareDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dokumentverwaltung</h1>
          <p className="text-gray-600 mt-2">Verwalten und teilen Sie alle Dokumente für Ihre Gebäude</p>
        </div>

        {/* Building Selection */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {buildings?.map(building => (
            <Button
              key={building.id}
              variant={selectedBuilding?.id === building.id ? 'default' : 'outline'}
              onClick={() => setSelectedBuilding(building)}
              className="whitespace-nowrap"
            >
              {building.name}
            </Button>
          ))}
        </div>

        {selectedBuilding && (
          <>
            {/* Toolbar */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Dokument hochladen
              </Button>

              <Input
                placeholder="Dokumente durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-xs"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Alle Typen</option>
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Documents Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Dokumente laden...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Keine Dokumente vorhanden</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDocs.map(doc => (
                  <Card key={doc.id} className="hover:shadow-md transition">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doc.title || doc.file_name}</h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">
                            {DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                          </Badge>
                          {doc.document_shares?.length > 0 && (
                            <Badge variant="outline">
                              Mit {doc.document_shares.length} geteilt
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(doc.created_date).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url, '_blank')}
                          title="Herunterladen"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShare(doc)}
                          title="Teilen"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc)}
                          className="text-red-500 hover:text-red-700"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        {uploadDialogOpen && selectedBuilding && (
          <DocumentUploadDialog
            building={selectedBuilding}
            onClose={() => setUploadDialogOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              setUploadDialogOpen(false);
            }}
          />
        )}

        {shareDialogOpen && selectedDoc && (
          <DocumentShareDialog
            document={selectedDoc}
            onClose={() => setShareDialogOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              setShareDialogOpen(false);
            }}
          />
        )}

        {deleteDialogOpen && selectedDoc && (
          <DocumentDeleteDialog
            document={selectedDoc}
            onConfirm={() => deleteMutation.mutate(selectedDoc.id)}
            onCancel={() => setDeleteDialogOpen(false)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}