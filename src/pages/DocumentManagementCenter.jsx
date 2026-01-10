import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Image, Download, Eye } from 'lucide-react';

import DocumentUploadManager from '@/components/tax-property/DocumentUploadManager';
import BulkDocumentUpload from '@/components/tax-property/BulkDocumentUpload';
import DocumentSearchEngine from '@/components/tax-property/DocumentSearchEngine';
import TaxDocumentGallery from '@/components/tax-property/TaxDocumentGallery';
import DocumentFilterPanel from '@/components/tax-property/DocumentFilterPanel';
import DocumentExportPanel from '@/components/tax-property/DocumentExportPanel';
import SmartFilingAssistant from '@/components/tax-property/SmartFilingAssistant';
import DocumentPreviewDialog from '@/components/tax-property/DocumentPreviewDialog';
import GoBDArchive from '@/components/tax-property/GoBDArchive';
import RetentionTracker from '@/components/tax-property/RetentionTracker';

export default function DocumentManagementCenter() {
  const [filters, setFilters] = useState({
    category: 'all',
    fileType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      let query = {};
      
      if (filters.category !== 'all') query.category = filters.category;
      if (filters.fileType !== 'all') query.file_type = filters.fileType;
      if (filters.status !== 'all') query.status = filters.status;
      
      return await base44.entities.Document.filter(query, '-created_date', 200);
    }
  });

  const stats = {
    total: documents.length,
    images: documents.filter(d => d.file_type === 'image').length,
    pdfs: documents.filter(d => d.file_type === 'pdf').length,
    analyzed: documents.filter(d => d.ai_processed).length
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fotos</p>
                <p className="text-2xl font-bold">{stats.images}</p>
              </div>
              <Image className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">PDFs</p>
                <p className="text-2xl font-bold">{stats.pdfs}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">KI-Analysiert</p>
                <p className="text-2xl font-bold">{stats.analyzed}</p>
              </div>
              <Badge className="bg-indigo-600">{((stats.analyzed/stats.total)*100).toFixed(0)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="browse">Durchsuchen</TabsTrigger>
          <TabsTrigger value="organize">Organisieren</TabsTrigger>
          <TabsTrigger value="archive">Archiv</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentUploadManager />
            <BulkDocumentUpload />
          </div>
          
          <TaxDocumentGallery />
        </TabsContent>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DocumentSearchEngine />
            <DocumentFilterPanel filters={filters} onFilterChange={setFilters} />
            <DocumentExportPanel />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alle Dokumente ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-500 transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {doc.file_type === 'image' ? (
                        <Image className="w-5 h-5 text-green-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{doc.name}</p>
                        {doc.ai_summary && (
                          <p className="text-xs text-slate-600">{doc.ai_summary.slice(0, 80)}...</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline">{doc.category}</Badge>
                        {doc.ai_processed && <Badge className="bg-purple-600">KI</Badge>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organize" className="space-y-6">
          <SmartFilingAssistant />
          <TaxDocumentGallery />
        </TabsContent>

        <TabsContent value="archive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoBDArchive />
            <RetentionTracker />
          </div>
        </TabsContent>
      </Tabs>

      <DocumentPreviewDialog 
        document={selectedDoc} 
        open={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
      />
    </div>
  );
}