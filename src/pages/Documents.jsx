import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCode, Type, FolderOpen, Sparkles, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DocumentsList from '../components/documents/DocumentsList';
import DocumentListEnhanced from '../components/documents/DocumentListEnhanced';
import DocumentUploadDialog from '../components/documents/DocumentUploadDialog';
import TemplatesList from '../components/documents/TemplatesList';
import TextBlocksList from '../components/documents/TextBlocksList';
import OriginalsList from '../components/documents/OriginalsList';
import PDFTemplateImporter from '../components/documents/PDFTemplateImporter';
import ModuleGuard from '@/components/package/ModuleGuard';
import AdvancedDocumentSearch from '../components/documents/AdvancedDocumentSearch';
import DocumentTemplateManager from '../components/documents/DocumentTemplateManager';
import DocumentArchivePanel from '../components/documents/DocumentArchivePanel';

export default function DocumentsPage() {
    const [importerOpen, setImporterOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState({});
    const [showSearch, setShowSearch] = useState(false);
    const queryClient = useQueryClient();

    // Fetch data for upload dialog
    const { data: allDocuments = [] } = useQuery({
      queryKey: ['documents'],
      queryFn: () => base44.entities.Document.list('-created_date', 200),
    });

    // Filter documents based on search
    const documents = React.useMemo(() => {
      let filtered = [...allDocuments];

      if (searchFilters.searchText) {
        const search = searchFilters.searchText.toLowerCase();
        filtered = filtered.filter(doc => 
          doc.title?.toLowerCase().includes(search) ||
          doc.description?.toLowerCase().includes(search)
        );
      }

      if (searchFilters.documentType && searchFilters.documentType !== 'all') {
        filtered = filtered.filter(doc => doc.document_type === searchFilters.documentType);
      }

      if (searchFilters.status && searchFilters.status !== 'all') {
        filtered = filtered.filter(doc => doc.status === searchFilters.status);
      }

      if (searchFilters.dateFrom) {
        filtered = filtered.filter(doc => 
          new Date(doc.created_at) >= new Date(searchFilters.dateFrom)
        );
      }

      if (searchFilters.dateTo) {
        filtered = filtered.filter(doc => 
          new Date(doc.created_at) <= new Date(searchFilters.dateTo)
        );
      }

      if (searchFilters.tags?.length > 0) {
        filtered = filtered.filter(doc => 
          searchFilters.tags.some(tag => 
            doc.tags?.includes(tag) || 
            doc.title?.includes(tag) ||
            doc.description?.includes(tag)
          )
        );
      }

      return filtered;
    }, [allDocuments, searchFilters]);

    const { data: buildings = [] } = useQuery({
      queryKey: ['buildings'],
      queryFn: () => base44.entities.Building.list('-updated_date', 50),
    });

    const { data: tenants = [] } = useQuery({
      queryKey: ['tenants'],
      queryFn: () => base44.entities.Tenant.list('-updated_date', 100),
    });

    const { data: contracts = [] } = useQuery({
      queryKey: ['contracts'],
      queryFn: () => base44.entities.LeaseContract.list('-updated_date', 100),
    });

    const { data: equipment = [] } = useQuery({
      queryKey: ['equipment'],
      queryFn: () => base44.entities.Equipment.list('-updated_date', 100),
    });

    const deleteMutation = useMutation({
      mutationFn: (docId) => base44.entities.Document.delete(docId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      },
    });
    
    return (
        <ModuleGuard moduleName="dokumentation">
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Dokumente</h1>
                    <p className="text-sm font-extralight text-slate-400 mt-1">Verwalten Sie Dokumente, Vorlagen und Textbausteine</p>
                </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
            <Tabs defaultValue="documents" className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <Button
                        onClick={() => setShowSearch(!showSearch)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Erweiterte Suche
                    </Button>
                    <Button
                        onClick={() => setUploadOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Dokument hochladen
                    </Button>
                </div>

                {showSearch && (
                    <div className="mb-6">
                        <AdvancedDocumentSearch onSearch={setSearchFilters} />
                    </div>
                )}
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="documents">
                        <FileText className="w-4 h-4 mr-2" />
                        Dokumente
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileCode className="w-4 h-4 mr-2" />
                        Vorlagen
                    </TabsTrigger>
                    <TabsTrigger value="textblocks">
                        <Type className="w-4 h-4 mr-2" />
                        Textbausteine
                    </TabsTrigger>
                    <TabsTrigger value="originals">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Originale
                    </TabsTrigger>
                    <TabsTrigger value="archive">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Archiv
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-6">
                    <DocumentListEnhanced 
                        documents={documents}
                        onDelete={(docId) => deleteMutation.mutate(docId)}
                    />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <DocumentTemplateManager />
                </TabsContent>

                <TabsContent value="textblocks" className="mt-6">
                    <TextBlocksList />
                </TabsContent>

                <TabsContent value="originals" className="mt-6">
                    <OriginalsList />
                </TabsContent>

                <TabsContent value="archive" className="mt-6">
                    <DocumentArchivePanel />
                </TabsContent>
                </Tabs>
                </motion.div>

                <DocumentUploadDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    buildings={buildings}
                    tenants={tenants}
                    contracts={contracts}
                    equipment={equipment}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['documents'] });
                    }}
                />
                </div>
                </ModuleGuard>
                );
                }